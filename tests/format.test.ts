import { describe, expect, it } from "vitest";

import { THINKING_PLACEHOLDER, formatFinalReply } from "../src/format.js";

describe("formatFinalReply", () => {
  it("uses a stable thinking placeholder", () => {
    expect(THINKING_PLACEHOLDER).toBe("思考中...");
  });

  it("preserves fenced code blocks", () => {
    const reply = "```ts\nconst value = 1;\n```";

    expect(formatFinalReply(reply)).toBe(reply);
  });

  it("falls back for empty output", () => {
    expect(formatFinalReply("")).toBe("未生成可发送的回复。");
    expect(formatFinalReply("   ")).toBe("未生成可发送的回复。");
  });
});
