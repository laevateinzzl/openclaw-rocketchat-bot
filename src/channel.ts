import { formatFinalReply, THINKING_PLACEHOLDER } from "./format.js";
import type { InboundEvent } from "./inbound/types.js";

type ChannelRuleOptions = {
  botUserId: string;
  mentionNames: string[];
};

type ReplyClient = {
  postMessage(roomId: string, text: string): Promise<string>;
  updateMessage(roomId: string, messageId: string, text: string): Promise<void>;
};

type SendReplyLifecycleOptions = {
  client: ReplyClient;
  roomId: string;
  finalText: string;
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
  const placeholderId = await options.client.postMessage(options.roomId, THINKING_PLACEHOLDER);
  await options.client.updateMessage(
    options.roomId,
    placeholderId,
    formatFinalReply(options.finalText)
  );
  return placeholderId;
}

function normalizeMention(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase();
}
