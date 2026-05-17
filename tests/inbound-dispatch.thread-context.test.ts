import { describe, expect, it, vi } from "vitest";

import type { InboundEvent } from "../src/inbound/types.js";
import {
  dispatchInboundEventWithChannelRuntime,
  type ThreadContextClientLike
} from "../src/inbound-dispatch.js";

describe("dispatchInboundEventWithChannelRuntime thread context", () => {
  it("prepends parent message + prior thread replies to BodyForAgent when event.tmid is set", async () => {
    const harness = createThreadHarness({
      eventOverrides: {
        tmid: "parent-msg-id",
        messageId: "reply-trigger-id",
        text: "kannst du das checken?"
      },
      threadContextClient: {
        getMessage: vi.fn().mockResolvedValue({
          id: "parent-msg-id",
          text: "Hat Allianz schon gezahlt?",
          username: "chris",
          ts: "2026-05-17T10:00:00.000Z",
          tmid: null
        }),
        getThreadMessages: vi.fn().mockResolvedValue([
          {
            id: "first-reply-id",
            text: "Ich schau gleich nach.",
            username: "bettina",
            ts: "2026-05-17T10:01:00.000Z"
          },
          {
            // Trigger message itself — should be filtered out by the
            // dispatcher so we don't duplicate it in the context block.
            id: "reply-trigger-id",
            text: "kannst du das checken?",
            username: "chris",
            ts: "2026-05-17T10:05:00.000Z"
          }
        ])
      }
    });

    await harness.dispatch();

    expect(harness.threadContextClient.getMessage).toHaveBeenCalledWith("parent-msg-id");
    expect(harness.threadContextClient.getThreadMessages).toHaveBeenCalledWith("parent-msg-id", 10);

    const ctx = harness.finalizeInboundContext.mock.calls[0][0] as Record<string, unknown>;
    const bodyForAgent = ctx.BodyForAgent as string;

    expect(bodyForAgent).toContain("[Thread context");
    expect(bodyForAgent).toContain("Parent (@chris): Hat Allianz schon gezahlt?");
    expect(bodyForAgent).toContain("@bettina: Ich schau gleich nach.");
    // Trigger message text follows the context block — exactly once.
    expect(bodyForAgent).toMatch(/kannst du das checken\?\s*$/);
    expect(bodyForAgent.match(/kannst du das checken/g)).toHaveLength(1);
    // RawBody should still be JUST the trigger so anything that wants
    // the unenriched text (logs, command parsing) keeps working.
    expect(ctx.RawBody).toBe("kannst du das checken?");
  });

  it("does nothing when event.tmid is null (top-level message)", async () => {
    const harness = createThreadHarness({
      eventOverrides: {
        tmid: null,
        text: "hi"
      },
      threadContextClient: {
        getMessage: vi.fn(),
        getThreadMessages: vi.fn()
      }
    });

    await harness.dispatch();

    expect(harness.threadContextClient.getMessage).not.toHaveBeenCalled();
    expect(harness.threadContextClient.getThreadMessages).not.toHaveBeenCalled();
    const ctx = harness.finalizeInboundContext.mock.calls[0][0] as Record<string, unknown>;
    expect(ctx.BodyForAgent).toBe("hi");
    expect(ctx.RawBody).toBe("hi");
  });

  it("does nothing when threadContextClient is missing (back-compat path)", async () => {
    const harness = createThreadHarness({
      eventOverrides: {
        tmid: "parent-id",
        text: "reply with no client wired"
      },
      threadContextClient: undefined
    });

    await harness.dispatch();

    const ctx = harness.finalizeInboundContext.mock.calls[0][0] as Record<string, unknown>;
    expect(ctx.BodyForAgent).toBe("reply with no client wired");
  });

  it("falls back gracefully when parent fetch throws — replies-only context is still attached", async () => {
    const harness = createThreadHarness({
      eventOverrides: {
        tmid: "parent-broken",
        text: "follow-up"
      },
      threadContextClient: {
        getMessage: vi.fn().mockRejectedValue(new Error("network down")),
        getThreadMessages: vi.fn().mockResolvedValue([
          {
            id: "earlier-reply",
            text: "Erste Reaktion",
            username: "marco",
            ts: "2026-05-17T10:00:00.000Z"
          }
        ])
      }
    });

    await harness.dispatch();

    const ctx = harness.finalizeInboundContext.mock.calls[0][0] as Record<string, unknown>;
    const bodyForAgent = ctx.BodyForAgent as string;
    expect(bodyForAgent).toContain("[Thread context");
    expect(bodyForAgent).toContain("@marco: Erste Reaktion");
    // Parent absent due to throw — but we still preserve the trigger
    // text at the end.
    expect(bodyForAgent).not.toContain("Parent (@");
    expect(bodyForAgent).toMatch(/follow-up\s*$/);
  });

  it("falls back to the bare trigger when both parent and replies are empty", async () => {
    const harness = createThreadHarness({
      eventOverrides: {
        tmid: "lonely-thread",
        messageId: "only-reply",
        text: "isolated reply"
      },
      threadContextClient: {
        // Parent vanished (404) — null return.
        getMessage: vi.fn().mockResolvedValue(null),
        // Only message in the thread is the trigger itself — filtered out.
        getThreadMessages: vi.fn().mockResolvedValue([
          {
            id: "only-reply",
            text: "isolated reply",
            username: "chris",
            ts: "2026-05-17T10:00:00.000Z"
          }
        ])
      }
    });

    await harness.dispatch();

    const ctx = harness.finalizeInboundContext.mock.calls[0][0] as Record<string, unknown>;
    // No context block — there was nothing useful to prepend.
    expect(ctx.BodyForAgent).toBe("isolated reply");
  });

  it("trims context that exceeds the soft cap to keep the agent prompt bounded", async () => {
    const longBlob = "A".repeat(8000);
    const harness = createThreadHarness({
      eventOverrides: {
        tmid: "huge-thread",
        text: "ok"
      },
      threadContextClient: {
        getMessage: vi.fn().mockResolvedValue({
          id: "huge-thread",
          text: longBlob,
          username: "chris",
          ts: "2026-05-17T10:00:00.000Z",
          tmid: null
        }),
        getThreadMessages: vi.fn().mockResolvedValue([])
      }
    });

    await harness.dispatch();

    const ctx = harness.finalizeInboundContext.mock.calls[0][0] as Record<string, unknown>;
    const bodyForAgent = ctx.BodyForAgent as string;
    expect(bodyForAgent).toContain("Thread-Kontext nach");
    expect(bodyForAgent).toContain("abgeschnitten");
    // Trigger text still arrives intact.
    expect(bodyForAgent).toMatch(/ok\s*$/);
  });
});

function createThreadHarness(params: {
  eventOverrides: Partial<InboundEvent>;
  threadContextClient: ThreadContextClientLike | undefined;
}) {
  const resolveAgentRoute = vi.fn().mockReturnValue({
    agentId: "main",
    sessionKey: "agent:main:session",
    accountId: "main"
  });
  const resolveStorePath = vi.fn().mockReturnValue("/tmp/openclaw/session-store");
  const readSessionUpdatedAt = vi.fn().mockReturnValue(undefined);
  const resolveEnvelopeFormatOptions = vi.fn().mockReturnValue({ format: "envelope" });
  const formatAgentEnvelope = vi.fn((p) => `[envelope]${p.body}`);
  const finalizeInboundContext = vi.fn((ctx) => ({
    ...ctx,
    SessionKey: (ctx as { SessionKey?: string }).SessionKey
  }));
  const recordInboundSession = vi.fn().mockResolvedValue(undefined);
  const dispatchReplyWithBufferedBlockDispatcher = vi.fn(async ({ dispatcherOptions }) => {
    await dispatcherOptions.deliver({ text: "ok" }, { kind: "final" });
    return { queuedFinal: true };
  });
  const baseEvent: InboundEvent = {
    accountId: "main",
    roomId: "room-1",
    roomType: "channel",
    messageId: "message-1",
    tmid: null,
    senderId: "user-1",
    senderName: "Chris",
    text: "trigger",
    mentions: [],
    attachments: [],
    sentAt: "2026-05-17T10:05:00.000Z",
    raw: { text: "trigger" }
  };
  const event: InboundEvent = { ...baseEvent, ...params.eventOverrides };

  return {
    finalizeInboundContext,
    threadContextClient: params.threadContextClient ?? { getMessage: vi.fn(), getThreadMessages: vi.fn() },
    dispatch: () =>
      dispatchInboundEventWithChannelRuntime({
        cfg: { session: { store: "memory" } },
        accountId: "main",
        event,
        channelRuntime: {
          routing: { resolveAgentRoute },
          session: { resolveStorePath, readSessionUpdatedAt, recordInboundSession },
          reply: {
            resolveEnvelopeFormatOptions,
            formatAgentEnvelope,
            finalizeInboundContext,
            dispatchReplyWithBufferedBlockDispatcher
          }
        },
        threadContextClient: params.threadContextClient,
        deliver: vi.fn().mockResolvedValue(undefined),
        onRecordError: vi.fn(),
        onDispatchError: vi.fn()
      })
  };
}
