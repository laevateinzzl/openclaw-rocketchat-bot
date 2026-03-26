import { describe, expect, it, vi } from "vitest";

import plugin from "../src/index.js";

describe("plugin entry", () => {
  it("registers the rocketchat channel plugin", () => {
    const api = {
      registerChannel: vi.fn()
    };

    expect(plugin).toBeTruthy();
    expect(typeof plugin).toBe("object");
    expect(typeof plugin.register).toBe("function");

    plugin.register(api);

    expect(api.registerChannel).toHaveBeenCalledTimes(1);
    const [[{ plugin: registeredPlugin }]] = api.registerChannel.mock.calls;
    expect(registeredPlugin.id).toBe("rocketchat");
    expect(registeredPlugin.meta.label).toBe("Rocket.Chat");
    expect(typeof registeredPlugin.outbound.sendText).toBe("function");
    expect(typeof registeredPlugin.gateway.startAccount).toBe("function");
  });

  it("uses the same top-level plugin id as the manifest and channel id", () => {
    expect(plugin.id).toBe("rocketchat");
  });
});
