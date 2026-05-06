import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { rocketchatPlugin, startGateway } from "./plugin.js";

export default defineChannelPluginEntry({
  id: "rocketchat",
  name: "Rocket.Chat",
  description:
    "Rocket.Chat channel plugin with REST polling, WebSocket inbound support, and mention-gated group replies.",
  plugin: rocketchatPlugin,
  registerFull(api) {
    api.registerGatewayMethod("rocketchat.gateway.startAccount", (ctx) => {
      return startGateway(ctx as Parameters<typeof startGateway>[0]);
    });
  }
});
