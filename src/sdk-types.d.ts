declare module "openclaw/plugin-sdk/channel-core" {
  export interface ChannelPluginEntryConfig<TPlugin = unknown> {
    id: string;
    name: string;
    description: string;
    plugin: TPlugin;
    registerCliMetadata?(api: ChannelPluginCliApi): void;
    registerFull?(api: ChannelPluginRuntimeApi): void;
  }

  export interface ChannelPluginCliApi {
    registerGatewayMethod(name: string, handler: (ctx: unknown) => Promise<void>): void;
    registerChannelCommand(name: string, handler: (args: unknown) => Promise<void>): void;
  }

  export interface ChannelPluginRuntimeApi {
    registerGatewayMethod(name: string, handler: (ctx: GatewayStartAccountCtx) => Promise<void>): void;
  }

  export interface GatewayStartAccountCtx {
    accountId: string;
    account?: unknown;
    cfg?: unknown;
    abortSignal?: AbortSignal;
    setStatus?(status: string): void;
    channelRuntime?: unknown;
  }

  export function defineChannelPluginEntry<TPlugin = unknown>(
    config: ChannelPluginEntryConfig<TPlugin>
  ): ChannelPluginEntryConfig<TPlugin>;

  export interface ChannelPluginBaseSetup<TAccount> {
    resolveAccount(cfg: unknown, accountId?: string): TAccount | null;
    inspectAccount?(cfg: unknown, accountId?: string): unknown;
  }

  export interface ChannelPluginBaseConfig<TAccount> {
    id: string;
    setup: ChannelPluginBaseSetup<TAccount>;
  }

  export interface ChannelPluginConfig<TAccount> {
    base: ChannelPluginBaseConfig<TAccount>;
    security?: {
      dm?: {
        channelKey: string;
        resolvePolicy?(account: TAccount): string;
        resolveAllowFrom?(account: TAccount): string[];
        defaultPolicy?: string;
      };
    };
    threading?: {
      topLevelReplyToMode?: "reply" | "thread" | "custom";
    };
    outbound?: {
      deliveryMode?: "direct";
      attachedResults?: {
        sendText?(params: {
          cfg?: unknown;
          accountId: string;
          to: string;
          text: string;
        }): Promise<{ ok: boolean; messageId: string }>;
      };
      base?: {
        sendMedia?(params: unknown): Promise<unknown>;
      };
    };
    pairing?: {
      text?: {
        idLabel?: string;
        message?: string;
        notify?(params: { target: string; code: string }): Promise<void>;
      };
    };
  }

  export function createChannelPluginBase<TAccount>(
    config: ChannelPluginConfig<TAccount>
  ): unknown;

  export function createChatChannelPlugin<TAccount>(
    config: ChannelPluginConfig<TAccount>
  ): unknown;
}

declare module "openclaw/plugin-sdk/channel-entry-contract" {
  export function defineSetupPluginEntry(plugin: unknown): unknown;
  export function defineBundledChannelSetupEntry(config: {
    plugin: unknown;
    resolveAccount(cfg: unknown, accountId?: string): unknown;
  }): unknown;
}

declare module "openclaw/plugin-sdk/channel-mention-gating" {
  export interface MentionFacts {
    isDirectMessage: boolean;
    explicitMentions: string[];
    mentionNames: string[];
    botUserId: string;
    senderId: string;
    text: string;
  }

  export interface MentionPolicy {
    mode?: "mention-gated" | "allow-all";
  }

  export interface MentionDecision {
    effectiveWasMentioned: boolean;
    shouldBypassMention: boolean;
    shouldSkip: boolean;
  }

  export function resolveInboundMentionDecision(params: {
    facts: MentionFacts;
    policy: MentionPolicy;
  }): MentionDecision;

  export function implicitMentionKindWhen(condition: unknown): unknown;
}

declare module "openclaw/plugin-sdk/channel-message" {
  export interface MessageReceipt {
    messageId: string;
    platformId?: string;
  }

  export function defineChannelMessageAdapter(adapter: unknown): unknown;
  export function createChannelMessageAdapterFromOutbound(outbound: unknown): unknown;
  export function listMessageReceiptPlatformIds(receipt: MessageReceipt): string[];
  export function resolveMessageReceiptPrimaryId(receipt: MessageReceipt): string;
}
