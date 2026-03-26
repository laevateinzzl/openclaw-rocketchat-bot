import { registerRockeChatPlugin } from "./plugin.js";

const plugin = {
  id: "rocketchat",
  name: "OpenClaw Rocket.Chat Plugin",
  register(api: { registerChannel(args: { plugin: unknown }): void }) {
    registerRockeChatPlugin(api);
  }
};

export default plugin;
