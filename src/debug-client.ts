import { RocketChatClient } from "./client.js";
import { loadDebugEnv, resolveDebugAccountConfigFromEnv } from "./debug.js";

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
  const subscriptions = await client.listSubscriptions(null);

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "debug-client",
        accountId: account.accountId,
        serverUrl: account.serverUrl,
        identity,
        subscriptionCount: subscriptions.length
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
        mode: "debug-client",
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
