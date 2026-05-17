import { EMPTY_REPLY_FALLBACK, formatReplyFailure, formatReplyUpdate, THINKING_PLACEHOLDER } from "./format.js";
import type { InboundEvent } from "./inbound/types.js";

type ChannelRuleOptions = {
  botUserId: string;
  mentionNames: string[];
};

type ReplyClient = {
  postMessage(roomId: string, text: string, options?: { tmid?: string }): Promise<string>;
  updateMessage(roomId: string, messageId: string, text: string): Promise<void>;
  /**
   * Optional. When provided, an empty final reply will delete the
   * placeholder instead of leaving an "(no reply generated)" trail in
   * the channel. Implementations that can't delete safely (no
   * permission, transport restrictions) should leave this undefined —
   * the lifecycle will fall back to updating the placeholder with the
   * fallback text.
   */
  deleteMessage?(roomId: string, messageId: string): Promise<void>;
  uploadAttachment?(
    roomId: string,
    filePath: string,
    text?: string,
    options?: { tmid?: string }
  ): Promise<string>;
};

type SendReplyLifecycleOptions = {
  client: ReplyClient;
  roomId: string;
  /**
   * Thread message id to anchor the bot's reply to. When set, the
   * placeholder message and any follow-up attachments are posted as
   * thread replies on top of this message id.
   */
  tmid?: string;
} & (
  | {
      finalText: string;
      run?: never;
    }
  | {
      finalText?: never;
      run(session: ReplySession): Promise<void>;
    }
);

type ReplyStageKind = "tool" | "block" | "final";

type ReplyStagePayload = {
  text?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  attachmentPath?: string;
};

type ReplySession = {
  messageId: string;
  update(params: { kind: ReplyStageKind; payload: ReplyStagePayload }): Promise<void>;
  hasFinalUpdate(): boolean;
  fail(error: unknown): Promise<void>;
};

export function shouldHandleInboundEvent(
  event: InboundEvent,
  options: ChannelRuleOptions
): boolean {
  if (event.senderId === options.botUserId) {
    return false;
  }

  if (event.roomType === "direct") {
    return true;
  }

  const aliases = options.mentionNames.map(normalizeMention);
  const explicitMentions = event.mentions.map(normalizeMention);
  if (explicitMentions.some((mention) => aliases.includes(mention))) {
    return true;
  }

  const normalizedText = event.text.toLowerCase();
  return aliases.some((alias) => normalizedText.includes(`@${alias}`));
}

export async function sendReplyLifecycle(
  options: SendReplyLifecycleOptions
): Promise<string> {
  const session = await createReplySession(options.client, options.roomId, options.tmid);

  try {
    if (typeof options.run === "function") {
      await options.run(session);
      if (!session.hasFinalUpdate()) {
        await session.update({
          kind: "final",
          payload: {}
        });
      }
    } else {
      await session.update({
        kind: "final",
        payload: {
          text: options.finalText
        }
      });
    }
  } catch (error) {
    await session.fail(error);
    throw error;
  }

  return session.messageId;
}

function normalizeMention(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

async function createReplySession(
  client: ReplyClient,
  roomId: string,
  tmid: string | undefined
): Promise<ReplySession> {
  const threadOptions = tmid ? { tmid } : undefined;
  const messageId = await client.postMessage(roomId, THINKING_PLACEHOLDER, threadOptions);
  let finalUpdated = false;

  return {
    messageId,
    update: async ({ kind, payload }) => {
      if (kind === "final") {
        finalUpdated = true;
      }
      const text = formatReplyUpdate(kind, payload);
      // When the agent produces nothing meaningful for the final reply
      // (no text and no attachment), prefer silently removing the
      // placeholder over leaving "(no reply generated)" noise in the
      // channel. If the client can't delete (no permission, missing
      // method), keep the existing update-to-fallback behaviour so the
      // observability story stays intact.
      const isEmptyFinal =
        kind === "final" &&
        text === EMPTY_REPLY_FALLBACK &&
        !payload.attachmentPath;
      if (isEmptyFinal && client.deleteMessage) {
        try {
          await client.deleteMessage(roomId, messageId);
          return;
        } catch (error) {
          // Falling back to the visible "(no reply generated)" string is
          // strictly better than throwing — at worst the user sees the
          // same fallback they'd have seen anyway.
          console.warn(
            `[rocketchat] could not delete placeholder ${messageId}; falling back to update: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
      await client.updateMessage(roomId, messageId, text);
      if (kind === "final" && payload.attachmentPath && client.uploadAttachment) {
        await client.uploadAttachment(
          roomId,
          payload.attachmentPath,
          payload.text?.trim() || undefined,
          threadOptions
        );
      }
    },
    hasFinalUpdate: () => finalUpdated,
    fail: async (_error) => {
      await client.updateMessage(roomId, messageId, formatReplyFailure());
    }
  };
}
