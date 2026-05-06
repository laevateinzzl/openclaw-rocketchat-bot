import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const stubsDir = resolve(__dirname, "tests/__stubs__");

export default defineConfig({
  resolve: {
    alias: {
      "openclaw/plugin-sdk/channel-core": resolve(
        stubsDir,
        "openclaw/plugin-sdk/channel-core.ts"
      ),
      "openclaw/plugin-sdk/channel-entry-contract": resolve(
        stubsDir,
        "openclaw/plugin-sdk/channel-entry-contract.ts"
      )
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  }
});
