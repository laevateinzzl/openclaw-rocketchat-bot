import { describe, expect, it } from "vitest";

import { attachmentMediaDir, checkpointPathForAccount } from "../src/plugin.js";

describe("checkpointPathForAccount", () => {
  it("uses OPENCLAW_HOME when provided", () => {
    expect(
      checkpointPathForAccount("main", {
        env: {
          OPENCLAW_HOME: "/tmp/openclaw-home"
        },
        homedir: () => "/Users/tester"
      })
    ).toBe("/tmp/openclaw-home/.openclaw/rocketchat/main.json");
  });

  it("prefers OPENCLAW_STATE_DIR over OPENCLAW_HOME", () => {
    expect(
      checkpointPathForAccount("main", {
        env: {
          OPENCLAW_HOME: "/tmp/openclaw-home",
          OPENCLAW_STATE_DIR: "/var/lib/openclaw-state"
        },
        homedir: () => "/Users/tester"
      })
    ).toBe("/var/lib/openclaw-state/rocketchat/main.json");
  });

  it("falls back to the user home directory instead of process cwd", () => {
    expect(
      checkpointPathForAccount("main", {
        env: {},
        homedir: () => "/Users/tester"
      })
    ).toBe("/Users/tester/.openclaw/rocketchat/main.json");
  });
});

describe("attachmentMediaDir", () => {
  it("uses OPENCLAW_HOME when provided", () => {
    expect(
      attachmentMediaDir({
        env: {
          OPENCLAW_HOME: "/tmp/openclaw-home"
        },
        homedir: () => "/Users/tester"
      })
    ).toBe("/tmp/openclaw-home/.openclaw/media");
  });

  it("prefers OPENCLAW_STATE_DIR over OPENCLAW_HOME", () => {
    expect(
      attachmentMediaDir({
        env: {
          OPENCLAW_HOME: "/tmp/openclaw-home",
          OPENCLAW_STATE_DIR: "/var/lib/openclaw-state"
        },
        homedir: () => "/Users/tester"
      })
    ).toBe("/var/lib/openclaw-state/media");
  });

  it("falls back to the user home directory instead of process cwd", () => {
    expect(
      attachmentMediaDir({
        env: {},
        homedir: () => "/Users/tester"
      })
    ).toBe("/Users/tester/.openclaw/media");
  });
});
