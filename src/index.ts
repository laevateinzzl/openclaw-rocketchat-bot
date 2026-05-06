import { rocketchatPlugin, startGateway } from "./plugin.js";

type GatewayApi = {
  registerGatewayMethod(name: string, handler: (ctx: unknown) => Promise<void>): void;
  registerChannel?(args: { plugin: unknown }): void;
};

export default {
  id: "rocketchat",
  name: "Rocket.Chat",
  description:
    "Rocket.Chat channel plugin with REST polling, WebSocket inbound support, and mention-gated group replies.",
  plugin: rocketchatPlugin,

  register(api: GatewayApi) {
    api.registerChannel?.({ plugin: rocketchatPlugin });
  },

  activate(api: GatewayApi) {
    api.registerGatewayMethod("rocketchat.gateway.startAccount", (ctx) => {
      return startGateway(ctx as Parameters<typeof startGateway>[0]);
    });
  },

  registerFull(api: GatewayApi) {
    api.registerGatewayMethod("rocketchat.gateway.startAccount", (ctx) => {
      return startGateway(ctx as Parameters<typeof startGateway>[0]);
    });
  }
};
