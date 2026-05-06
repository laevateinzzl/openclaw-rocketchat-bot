export function defineChannelPluginEntry<TPlugin>(config: {
  id: string;
  name: string;
  description: string;
  plugin: TPlugin;
  registerCliMetadata?(api: unknown): void;
  registerFull?(api: { registerGatewayMethod(name: string, handler: (ctx: unknown) => Promise<void>): void }): void;
}) {
  return config;
}

export function createChannelPluginBase<TAccount>(config: {
  base: { id: string; setup: { resolveAccount(cfg: unknown, accountId?: string): TAccount | null; inspectAccount?(cfg: unknown, accountId?: string): unknown } };
  security?: { dm?: { channelKey: string; resolvePolicy?(account: TAccount): string; resolveAllowFrom?(account: TAccount): string[]; defaultPolicy?: string } };
  threading?: { topLevelReplyToMode?: string };
  outbound?: { deliveryMode?: string; attachedResults?: { sendText?(params: { cfg?: unknown; accountId: string; to: string; text: string }): Promise<{ ok: boolean; messageId: string }> }; base?: { sendMedia?(params: unknown): Promise<unknown> } };
}) {
  return {
    id: config.base.id,
    base: config.base,
    security: config.security,
    threading: config.threading,
    outbound: config.outbound
  };
}

export function createChatChannelPlugin<TAccount>(config: unknown) {
  return createChannelPluginBase(config as Parameters<typeof createChannelPluginBase>[0]);
}
