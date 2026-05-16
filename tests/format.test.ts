import { describe, expect, it } from "vitest";

import { THINKING_PLACEHOLDER, formatFinalReply } from "../src/format.js";

describe("formatFinalReply", () => {
  it("uses a stable thinking placeholder", () => {
    expect(THINKING_PLACEHOLDER).toBe("Thinking…");
  });

  it("preserves fenced code blocks", () => {
    const reply = "```ts\nconst value = 1;\n```";

    expect(formatFinalReply(reply)).toBe(reply);
  });

  it("falls back for empty output", () => {
    expect(formatFinalReply("")).toBe("(no reply generated)");
    expect(formatFinalReply("   ")).toBe("(no reply generated)");
  });
});
