import { describe, expect, it } from "vitest";

import { checkpointPathForAccount } from "../src/plugin.js";

describe("checkpointPathForAccount", () => {
  it("uses OPENCLAW_HOME when provided", () => {
    expect(
      checkpointPathForAccount("main", {
        env: {
          OPENCLAW_HOME: "/tmp/openclaw-home"
        },
        homedir: () => "/Users/tester"
      })
    ).toBe("/tmp/openclaw-home/rocketchat/main.json");
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
