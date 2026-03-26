import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  loadDebugEnv,
  createMemoryCheckpointStore,
  resolveDebugAccountConfigFromEnv
} from "../src/debug.js";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { force: true, recursive: true })));
});

describe("resolveDebugAccountConfigFromEnv", () => {
  it("builds a token-auth account from environment variables", () => {
    const account = resolveDebugAccountConfigFromEnv({
      ROCKETCHAT_SERVER_URL: "https://chat.example.com",
      ROCKETCHAT_AUTH_MODE: "token",
      ROCKETCHAT_USER_ID: "user-1",
      ROCKETCHAT_ACCESS_TOKEN: "token-1",
      ROCKETCHAT_MENTION_NAMES: "rocketbot,assistant"
    });

    expect(account.accountId).toBe("debug");
    expect(account.auth).toEqual({
      mode: "token",
      userId: "user-1",
      accessToken: "token-1"
    });
    expect(account.mentionNames).toEqual(["rocketbot", "assistant"]);
  });

  it("builds a password-auth account from environment variables", () => {
    const account = resolveDebugAccountConfigFromEnv({
      ROCKETCHAT_ACCOUNT_ID: "main",
      ROCKETCHAT_SERVER_URL: "https://chat.example.com",
      ROCKETCHAT_AUTH_MODE: "password",
      ROCKETCHAT_USERNAME: "rocketbot",
      ROCKETCHAT_PASSWORD: "secret",
      ROCKETCHAT_POLL_INTERVAL_MS: "5000"
    });

    expect(account.accountId).toBe("main");
    expect(account.auth).toEqual({
      mode: "password",
      username: "rocketbot",
      password: "secret"
    });
    expect(account.transport).toMatchObject({
      mode: "polling",
      pollIntervalMs: 5000
    });
  });

  it("rejects incomplete debug configuration", () => {
    expect(() =>
      resolveDebugAccountConfigFromEnv({
        ROCKETCHAT_SERVER_URL: "https://chat.example.com",
        ROCKETCHAT_AUTH_MODE: "token",
        ROCKETCHAT_ACCESS_TOKEN: "token-1"
      })
    ).toThrow('Missing required environment variable "ROCKETCHAT_USER_ID"');
  });
});

describe("loadDebugEnv", () => {
  it("loads Rocket.Chat debug variables from the project .env file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rocketchat-dotenv-"));
    cleanupPaths.push(directory);
    await writeFile(
      join(directory, ".env"),
      [
        "# comment",
        'ROCKETCHAT_SERVER_URL="https://chat.example.com"',
        "ROCKETCHAT_AUTH_MODE=token",
        "ROCKETCHAT_USER_ID=user-1",
        "ROCKETCHAT_ACCESS_TOKEN=token-1",
        "ROCKETCHAT_MENTION_NAMES=rocketbot,assistant"
      ].join("\n")
    );

    await expect(loadDebugEnv({ cwd: directory, env: {} })).resolves.toMatchObject({
      ROCKETCHAT_SERVER_URL: "https://chat.example.com",
      ROCKETCHAT_AUTH_MODE: "token",
      ROCKETCHAT_USER_ID: "user-1",
      ROCKETCHAT_ACCESS_TOKEN: "token-1",
      ROCKETCHAT_MENTION_NAMES: "rocketbot,assistant"
    });
  });

  it("keeps explicit environment variables ahead of .env values", async () => {
    const directory = await mkdtemp(join(tmpdir(), "rocketchat-dotenv-"));
    cleanupPaths.push(directory);
    await writeFile(
      join(directory, ".env"),
      [
        "ROCKETCHAT_SERVER_URL=https://chat-from-file.example.com",
        "ROCKETCHAT_AUTH_MODE=token",
        "ROCKETCHAT_USER_ID=user-from-file",
        "ROCKETCHAT_ACCESS_TOKEN=token-from-file"
      ].join("\n")
    );

    await expect(
      loadDebugEnv({
        cwd: directory,
        env: {
          ROCKETCHAT_SERVER_URL: "https://chat-from-shell.example.com",
          ROCKETCHAT_USER_ID: "user-from-shell"
        }
      })
    ).resolves.toMatchObject({
      ROCKETCHAT_SERVER_URL: "https://chat-from-shell.example.com",
      ROCKETCHAT_USER_ID: "user-from-shell",
      ROCKETCHAT_ACCESS_TOKEN: "token-from-file"
    });
  });
});

describe("createMemoryCheckpointStore", () => {
  it("seeds and updates in-memory checkpoint state", async () => {
    const store = createMemoryCheckpointStore("2026-03-26T12:00:00.000Z");

    await expect(store.read("debug")).resolves.toEqual({
      updatedSince: "2026-03-26T12:00:00.000Z",
      recentMessageIds: []
    });

    await store.markSeen("debug", "m1");
    await store.write("debug", {
      updatedSince: "2026-03-26T12:01:00.000Z",
      recentMessageIds: ["m1"]
    });

    await expect(store.hasSeen("debug", "m1")).resolves.toBe(true);
    await expect(store.read("debug")).resolves.toEqual({
      updatedSince: "2026-03-26T12:01:00.000Z",
      recentMessageIds: ["m1"]
    });
  });
});
