export const THINKING_PLACEHOLDER = "Thinking…";
export const EMPTY_REPLY_FALLBACK = "(no reply generated)";
export const TOOL_REPLY_FALLBACK = "Running a tool…";
export const BLOCK_REPLY_FALLBACK = "Drafting a reply…";
export const FAILED_REPLY_FALLBACK = "Something went wrong while replying. Try again.";

type ReplyPayload = {
  text?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
};

export function formatFinalReply(reply: string): string {
  return reply.trim().length > 0 ? reply : EMPTY_REPLY_FALLBACK;
}

export function formatReplyUpdate(
  kind: "tool" | "block" | "final",
  payload: ReplyPayload
): string {
  const content = formatReplyPayload(payload);

  if (kind === "final") {
    return formatFinalReply(content);
  }

  if (content.length > 0) {
    return content;
  }

  return kind === "tool" ? TOOL_REPLY_FALLBACK : BLOCK_REPLY_FALLBACK;
}

export function formatReplyFailure(): string {
  return FAILED_REPLY_FALLBACK;
}

function formatReplyPayload(payload: ReplyPayload): string {
  const parts: string[] = [];
  const text = payload.text?.trim();
  if (text) {
    parts.push(text);
  }

  const mediaUrls = [
    ...(payload.mediaUrls ?? []),
    ...(payload.mediaUrl ? [payload.mediaUrl] : [])
  ].map((value) => value.trim()).filter((value) => value.length > 0);

  if (mediaUrls.length > 0) {
    parts.push(mediaUrls.join("\n"));
  }

  return parts.join("\n\n").trim();
}
