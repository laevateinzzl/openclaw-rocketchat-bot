import { afterEach, describe, expect, it, vi } from "vitest";

const initialize = vi.fn();
const safePollOnce = vi.fn();
const start = vi.fn();
const stop = vi.fn();
const websocketStart = vi.fn();
const websocketStop = vi.fn();
const createWebSocketTransport = vi.fn();

vi.mock("../src/client.js", () => ({
  RocketChatClient: vi.fn().mockImplementation(() => ({
    initialize
  }))
}));

vi.mock("../src/checkpoints.js", () => ({
  FileCheckpointStore: vi.fn().mockImplementation(() => ({}))
}));

vi.mock("../src/channel.js", () => ({
  sendReplyLifecycle: vi.fn(),
  shouldHandleInboundEvent: vi.fn().mockReturnValue(true)
}));

vi.mock("../src/inbound/polling.js", () => ({
  RestPollingTransport: vi.fn().mockImplementation(() => ({
    safePollOnce,
    start,
    stop
  }))
}));

vi.mock("../src/inbound/websocket.js", () => ({
  createWebSocketTransport: vi.fn().mockImplementation((...args) => {
    createWebSocketTransport(...args);
    return {
      kind() {
        return "websocket";
      },
      start: websocketStart,
      stop: websocketStop
    };
  })
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("rocketchatPlugin.gateway.startAccount", () => {
  it("stays alive until the abort signal fires and then stops the transport", async () => {
    initialize.mockResolvedValue({
      userId: "bot-user",
      authToken: "token",
      username: "ai",
      displayName: "AI"
    });
    safePollOnce.mockResolvedValue(undefined);
    start.mockResolvedValue(undefined);
    stop.mockResolvedValue(undefined);

    const { rocketchatPlugin } = await import("../src/plugin.js");
    const abortController = new AbortController();
    const statuses: string[] = [];
    let resolved = false;

    const startPromise = rocketchatPlugin.gateway
      .startAccount({
        accountId: "main",
        account: {
          accountId: "main",
          enabled: true,
          serverUrl: "http://chat.example.com",
          auth: {
            mode: "token",
            userId: "bot-user",
            accessToken: "token"
          },
          transport: {
            mode: "polling",
            pollIntervalMs: 15_000
          },
          mentionNames: []
        },
        abortSignal: abortController.signal,
        runtime: {},
        setStatus: (status) => {
          statuses.push(status);
        }
      })
      .then(() => {
        resolved = true;
      });

    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(resolved).toBe(false);
    expect(safePollOnce).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();

    abortController.abort();
    await startPromise;

    expect(stop).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual(["connected", "stopped"]);
  });

  it("selects the websocket transport when configured", async () => {
    initialize.mockResolvedValue({
      userId: "bot-user",
      authToken: "token",
      username: "ai",
      displayName: "AI"
    });
    websocketStart.mockResolvedValue(undefined);
    websocketStop.mockResolvedValue(undefined);

    const { rocketchatPlugin } = await import("../src/plugin.js");
    const abortController = new AbortController();

    const startPromise = rocketchatPlugin.gateway.startAccount({
      accountId: "main",
      account: {
        accountId: "main",
        enabled: true,
        serverUrl: "http://chat.example.com",
        auth: {
          mode: "token",
          userId: "bot-user",
          accessToken: "token"
        },
        transport: {
          mode: "websocket",
          reconnectDelayMs: 5000
        },
        mentionNames: []
      },
      abortSignal: abortController.signal,
      runtime: {}
    });

    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(createWebSocketTransport).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(safePollOnce).not.toHaveBeenCalled();

    abortController.abort();
    await startPromise;

    expect(websocketStop).toHaveBeenCalledTimes(1);
  });
});
