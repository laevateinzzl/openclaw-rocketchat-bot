export function defineSetupPluginEntry(plugin: unknown) {
  return plugin;
}

export function defineBundledChannelSetupEntry(config: { plugin: unknown; resolveAccount(cfg: unknown, accountId?: string): unknown }) {
  return config;
}
