import { describe, expect, it } from "vitest";

import { createWebSocketTransport } from "../src/inbound/websocket.js";
import type { InboundEvent, InboundTransport } from "../src/inbound/types.js";

describe("inbound transport contracts", () => {
  it("exports the transport contract types", () => {
    const transport = null as unknown as InboundTransport;
    const event = null as unknown as InboundEvent;

    expect(transport).toBeNull();
    expect(event).toBeNull();
  });

  it("exposes a websocket transport factory", () => {
    const transport = createWebSocketTransport({
      accountId: "main",
      botUserId: "bot-user",
      serverUrl: "https://chat.example.com",
      userId: "bot-user",
      authToken: "resume-token",
      client: {
        async listSubscriptions() {
          return [];
        }
      },
      checkpointStore: {
        async hasSeen() {
          return false;
        },
        async markSeen() {
          return undefined;
        }
      },
      onEvent: async () => {
        return undefined;
      },
      websocketFactory: () =>
        ({
          addEventListener() {
            return undefined;
          },
          send() {
            return undefined;
          },
          close() {
            return undefined;
          }
        }) as never
    });

    expect(transport.kind()).toBe("websocket");
  });
});
