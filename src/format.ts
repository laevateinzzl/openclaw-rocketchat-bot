export const THINKING_PLACEHOLDER = "思考中...";
export const EMPTY_REPLY_FALLBACK = "未生成可发送的回复。";

export function formatFinalReply(reply: string): string {
  return reply.trim().length > 0 ? reply : EMPTY_REPLY_FALLBACK;
}
