import { describe, expect, it, vi } from "vitest";

import type { InboundEvent } from "../src/inbound/types.js";
import { dispatchInboundEventWithChannelRuntime } from "../src/inbound-dispatch.js";

describe("dispatchInboundEventWithChannelRuntime", () => {
  it("records and dispatches direct messages through channelRuntime", async () => {
    const resolveAgentRoute = vi.fn().mockReturnValue({
      agentId: "main",
      sessionKey: "agent:main:session",
      accountId: "main"
    });
    const resolveStorePath = vi.fn().mockReturnValue("/tmp/openclaw/session-store");
    const readSessionUpdatedAt = vi.fn().mockReturnValue(undefined);
    const resolveEnvelopeFormatOptions = vi.fn().mockReturnValue({ format: "envelope" });
    const formatAgentEnvelope = vi.fn().mockReturnValue("[Rocket.Chat] 你好");
    const finalizeInboundContext = vi.fn((ctx) => ({
      ...ctx,
      SessionKey: ctx.SessionKey
    }));
    const recordInboundSession = vi.fn().mockResolvedValue(undefined);
    const dispatchReplyWithBufferedBlockDispatcher = vi.fn(async ({ dispatcherOptions }) => {
      await dispatcherOptions.deliver({ text: "收到" }, { kind: "final" });
      return { queuedFinal: true };
    });
    const deliver = vi.fn().mockResolvedValue(undefined);
    const onRecordError = vi.fn();
    const onDispatchError = vi.fn();
    const cfg = {
      session: {
        store: "memory"
      }
    };
    const event: InboundEvent = {
      accountId: "main",
      roomId: "room-1",
      roomType: "direct",
      messageId: "message-1",
      senderId: "user-1",
      senderName: "Alice",
      text: "你好",
      mentions: [],
      sentAt: "2026-03-26T17:35:00.000Z",
      raw: { text: "你好" }
    };

    await dispatchInboundEventWithChannelRuntime({
      cfg,
      accountId: "main",
      event,
      channelRuntime: {
        routing: {
          resolveAgentRoute
        },
        session: {
          resolveStorePath,
          readSessionUpdatedAt,
          recordInboundSession
        },
        reply: {
          resolveEnvelopeFormatOptions,
          formatAgentEnvelope,
          finalizeInboundContext,
          dispatchReplyWithBufferedBlockDispatcher
        }
      },
      deliver,
      onRecordError,
      onDispatchError
    });

    expect(resolveAgentRoute).toHaveBeenCalledWith({
      cfg,
      channel: "rocketchat",
      accountId: "main",
      peer: {
        kind: "direct",
        id: "room-1"
      }
    });
    expect(recordInboundSession).toHaveBeenCalledTimes(1);
    expect(dispatchReplyWithBufferedBlockDispatcher).toHaveBeenCalledTimes(1);
    expect(deliver).toHaveBeenCalledWith({
      text: "收到"
    });
    expect(onRecordError).not.toHaveBeenCalled();
    expect(onDispatchError).not.toHaveBeenCalled();
  });
});
