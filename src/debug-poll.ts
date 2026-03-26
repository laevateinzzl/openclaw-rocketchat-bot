import { RocketChatClient } from "./client.js";
import {
  createMemoryCheckpointStore,
  loadDebugEnv,
  resolveDebugAccountConfigFromEnv
} from "./debug.js";
import { RestPollingTransport } from "./inbound/polling.js";
import type { InboundEvent } from "./inbound/types.js";

async function main(): Promise<void> {
  const env = await loadDebugEnv({
    cwd: process.cwd(),
    env: process.env
  });
  const account = resolveDebugAccountConfigFromEnv(env);
  const client = new RocketChatClient({
    serverUrl: account.serverUrl,
    auth: account.auth
  });
  const identity = await client.initialize();
  const initialUpdatedSince = env.ROCKETCHAT_UPDATED_SINCE?.trim() || null;
  const checkpointStore = createMemoryCheckpointStore(initialUpdatedSince);
  const events: InboundEvent[] = [];

  const transport = new RestPollingTransport({
    accountId: account.accountId,
    botUserId: identity.userId,
    client,
    checkpointStore,
    pollIntervalMs: account.transport.pollIntervalMs,
    onEvent: async (event) => {
      events.push(event);
      console.log(
        JSON.stringify(
          {
            type: "inbound-event",
            event
          },
          null,
          2
        )
      );
    }
  });

  await transport.pollOnce();
  const checkpoint = await checkpointStore.read(account.accountId);

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "debug-poll",
        accountId: account.accountId,
        serverUrl: account.serverUrl,
        identity,
        eventCount: events.length,
        checkpoint
      },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        mode: "debug-poll",
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
