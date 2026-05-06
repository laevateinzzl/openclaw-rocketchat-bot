import { describe, expect, it, vi } from "vitest";

import plugin from "../src/index.js";

describe("plugin entry", () => {
  it("exports a channel plugin entry object", () => {
    expect(plugin).toBeTruthy();
    expect(typeof plugin).toBe("object");
    expect(plugin.id).toBe("rocketchat");
    expect(plugin.name).toBe("Rocket.Chat");
    expect(typeof plugin.description).toBe("string");
    expect(plugin.plugin).toBeTruthy();
    expect(typeof plugin.register).toBe("function");
    expect(typeof plugin.activate).toBe("function");
    expect(typeof plugin.registerFull).toBe("function");
    expect(plugin.config).toBeTruthy();
    expect(typeof plugin.config.listAccountIds).toBe("function");
    expect(typeof plugin.config.resolveAccount).toBe("function");
    expect(typeof plugin.config.isConfigured).toBe("function");
  });

  it("uses the same top-level plugin id as the manifest and channel id", () => {
    expect(plugin.id).toBe("rocketchat");
  });

  it("calls registerChannel during register", () => {
    const registerChannel = vi.fn();
    plugin.register({
      registerChannel,
      registerGatewayMethod: vi.fn()
    });
    expect(registerChannel).toHaveBeenCalledWith(
      expect.objectContaining({ plugin: expect.any(Object) })
    );
  });

  it("registers gateway methods via activate", () => {
    const registeredMethods: Array<{ name: string; handler: unknown }> = [];
    const api = {
      registerGatewayMethod(name: string, handler: unknown) {
        registeredMethods.push({ name, handler });
      }
    };

    plugin.activate(api);

    expect(registeredMethods.length).toBe(1);
    expect(registeredMethods[0]!.name).toBe("rocketchat.gateway.startAccount");
    expect(typeof registeredMethods[0]!.handler).toBe("function");
  });
});
