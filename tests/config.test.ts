import { describe, expect, it } from "vitest";

import { parsePluginConfig } from "../src/config.js";

describe("parsePluginConfig", () => {
  it("accepts token auth accounts", () => {
    const config = parsePluginConfig({
      accounts: {
        main: {
          enabled: true,
          serverUrl: "https://chat.example.com",
          auth: {
            mode: "token",
            userId: "user-1",
            accessToken: "token-1"
          }
        }
      }
    });

    expect(config.accounts.main.auth.mode).toBe("token");
    expect(config.accounts.main.transport).toMatchObject({
      mode: "polling",
      pollIntervalMs: 3000
    });
  });

  it("accepts password auth accounts", () => {
    const config = parsePluginConfig({
      accounts: {
        main: {
          enabled: true,
          serverUrl: "https://chat.example.com",
          auth: {
            mode: "password",
            username: "bot",
            password: "secret"
          },
          mentionNames: ["rocketbot"]
        }
      }
    });

    expect(config.accounts.main.auth.mode).toBe("password");
    expect(config.accounts.main.mentionNames).toEqual(["rocketbot"]);
  });

  it("accepts websocket transport accounts", () => {
    const config = parsePluginConfig({
      accounts: {
        main: {
          enabled: true,
          serverUrl: "https://chat.example.com",
          auth: {
            mode: "token",
            userId: "user-1",
            accessToken: "token-1"
          },
          transport: {
            mode: "websocket"
          }
        }
      }
    });

    expect(config.accounts.main.transport.mode).toBe("websocket");
  });

  it("rejects incomplete or mixed auth config", () => {
    expect(() =>
      parsePluginConfig({
        accounts: {
          main: {
            enabled: true,
            serverUrl: "https://chat.example.com",
            auth: {
              mode: "token",
              accessToken: "token-1"
            }
          }
        }
      })
    ).toThrowError();

    expect(() =>
      parsePluginConfig({
        accounts: {
          main: {
            enabled: true,
            serverUrl: "https://chat.example.com",
            auth: {
              mode: "password",
              username: "bot",
              password: "secret",
              userId: "unexpected"
            }
          }
        }
      })
    ).toThrowError();
  });
});
