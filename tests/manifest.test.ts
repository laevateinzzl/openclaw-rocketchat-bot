import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("plugin manifest", () => {
  it("declares the plugin id, channel, and config schema", async () => {
    const raw = await readFile(new URL("../openclaw.plugin.json", import.meta.url), "utf8");
    const manifest = JSON.parse(raw) as {
      id?: string;
      kind?: string;
      channels?: string[];
      configSchema?: Record<string, unknown>;
    };

    expect(manifest.id).toBe("rocketchat");
    expect(manifest.kind).toBe("channel");
    expect(manifest.channels).toEqual(["rocketchat"]);
    expect(manifest.configSchema).toBeTruthy();
  });

  it("keeps the npm package name aligned with the manifest id", async () => {
    const manifestRaw = await readFile(new URL("../openclaw.plugin.json", import.meta.url), "utf8");
    const packageRaw = await readFile(new URL("../package.json", import.meta.url), "utf8");
    const manifest = JSON.parse(manifestRaw) as { id?: string };
    const packageJson = JSON.parse(packageRaw) as { name?: string };

    expect(packageJson.name).toBe(manifest.id);
  });

  it("keeps the install npm spec aligned with the manifest id", async () => {
    const manifestRaw = await readFile(new URL("../openclaw.plugin.json", import.meta.url), "utf8");
    const packageRaw = await readFile(new URL("../package.json", import.meta.url), "utf8");
    const manifest = JSON.parse(manifestRaw) as { id?: string };
    const packageJson = JSON.parse(packageRaw) as {
      openclaw?: {
        install?: {
          npmSpec?: string;
        };
      };
    };

    expect(packageJson.openclaw?.install?.npmSpec).toBe(manifest.id);
  });
});
