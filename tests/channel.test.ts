import { describe, expect, it, vi } from "vitest";

import { sendReplyLifecycle, shouldHandleInboundEvent } from "../src/channel.js";
import type { InboundEvent } from "../src/inbound/types.js";

describe("shouldHandleInboundEvent", () => {
  const baseEvent: InboundEvent = {
    accountId: "main",
    roomId: "room-1",
    roomType: "channel",
    messageId: "m1",
    senderId: "user-1",
    senderName: "alice",
    text: "hello",
    mentions: [],
    sentAt: "2026-03-26T11:00:00.000Z",
    raw: {}
  };

  it("accepts direct messages", () => {
    expect(
      shouldHandleInboundEvent(
        {
          ...baseEvent,
          roomType: "direct"
        },
        {
          botUserId: "bot-1",
          mentionNames: ["rocketbot"]
        }
      )
    ).toBe(true);
  });

  it("requires a mention in group contexts", () => {
    expect(
      shouldHandleInboundEvent(baseEvent, {
        botUserId: "bot-1",
        mentionNames: ["rocketbot"]
      })
    ).toBe(false);
  });

  it("accepts mention metadata and alias text fallback", () => {
    expect(
      shouldHandleInboundEvent(
        {
          ...baseEvent,
          roomType: "group",
          mentions: ["rocketbot"]
        },
        {
          botUserId: "bot-1",
          mentionNames: ["rocketbot"]
        }
      )
    ).toBe(true);

    expect(
      shouldHandleInboundEvent(
        {
          ...baseEvent,
          roomType: "group",
          text: "@assistant help"
        },
        {
          botUserId: "bot-1",
          mentionNames: ["rocketbot", "assistant"]
        }
      )
    ).toBe(true);
  });

  it("ignores self-authored messages", () => {
    expect(
      shouldHandleInboundEvent(
        {
          ...baseEvent,
          senderId: "bot-1",
          roomType: "direct"
        },
        {
          botUserId: "bot-1",
          mentionNames: ["rocketbot"]
        }
      )
    ).toBe(false);
  });
});

describe("sendReplyLifecycle", () => {
  it("posts a placeholder and updates it with the final text", async () => {
    const client = {
      postMessage: vi.fn().mockResolvedValue("placeholder-1"),
      updateMessage: vi.fn().mockResolvedValue(undefined)
    };

    await sendReplyLifecycle({
      client,
      roomId: "room-1",
      finalText: "```ts\nconst value = 1;\n```"
    });

    expect(client.postMessage).toHaveBeenCalledWith("room-1", "思考中...");
    expect(client.updateMessage).toHaveBeenCalledWith(
      "room-1",
      "placeholder-1",
      "```ts\nconst value = 1;\n```"
    );
  });
});
