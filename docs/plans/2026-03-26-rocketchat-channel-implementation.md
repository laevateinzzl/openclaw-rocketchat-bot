# Rocket.Chat Channel Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-usable OpenClaw Rocket.Chat channel plugin from an empty repository with REST polling, mention gating, placeholder updates, tests, and installable packaging.

**Architecture:** Use a native TypeScript plugin package. Keep Rocket.Chat REST access, transport polling, checkpoint state, formatting, and OpenClaw channel wiring in separate modules. Design the inbound path behind a stable `InboundTransport` interface so WebSocket/DDP can be added later without changing message handling logic.

**Tech Stack:** TypeScript, Node.js, Vitest, zod, OpenClaw plugin manifest/package layout.

---

### Task 1: Bootstrap Package And Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/index.ts`

**Step 1: Write the failing test**

Create a smoke test that imports the plugin entry and expects a default export to exist.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/index.test.ts`
Expected: FAIL because project files do not exist.

**Step 3: Write minimal implementation**

Add package scripts, TypeScript config, Vitest config, and a minimal plugin entry export.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .gitignore src/index.ts tests/index.test.ts
git commit -m "chore: bootstrap plugin package"
```

### Task 2: Add Plugin Manifest And Metadata

**Files:**
- Create: `openclaw.plugin.json`
- Modify: `package.json`
- Test: `tests/manifest.test.ts`

**Step 1: Write the failing test**

Add a test that reads `openclaw.plugin.json` and verifies required fields and entry path.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/manifest.test.ts`
Expected: FAIL because manifest is missing.

**Step 3: Write minimal implementation**

Create a valid plugin manifest and package metadata for installability.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/manifest.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add openclaw.plugin.json package.json tests/manifest.test.ts
git commit -m "feat: add plugin manifest metadata"
```

### Task 3: Implement Config Validation

**Files:**
- Create: `src/config.ts`
- Test: `tests/config.test.ts`

**Step 1: Write the failing test**

Cover:
- token mode accepts `serverUrl`, `userId`, `accessToken`
- password mode accepts `serverUrl`, `username`, `password`
- invalid mixed/incomplete config is rejected

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/config.test.ts`
Expected: FAIL because config parser is missing.

**Step 3: Write minimal implementation**

Use zod to parse top-level channel config and account config.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/config.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/config.ts tests/config.test.ts package.json
git commit -m "feat: validate channel config"
```

### Task 4: Implement Reply Formatting

**Files:**
- Create: `src/format.ts`
- Test: `tests/format.test.ts`

**Step 1: Write the failing test**

Cover:
- placeholder text is `思考中...`
- fenced code blocks are preserved
- empty output falls back to concise text

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/format.test.ts`
Expected: FAIL because formatter is missing.

**Step 3: Write minimal implementation**

Add placeholder constant and final reply formatter helpers.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/format.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/format.ts tests/format.test.ts
git commit -m "feat: add reply formatting helpers"
```

### Task 5: Implement Checkpoint Store

**Files:**
- Create: `src/checkpoints.ts`
- Test: `tests/checkpoints.test.ts`

**Step 1: Write the failing test**

Cover:
- default empty state
- save/load `updatedSince`
- recent message id dedupe window

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/checkpoints.test.ts`
Expected: FAIL because checkpoint store is missing.

**Step 3: Write minimal implementation**

Persist per-account state in a JSON file-backed store.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/checkpoints.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/checkpoints.ts tests/checkpoints.test.ts
git commit -m "feat: persist polling checkpoints"
```

### Task 6: Implement Rocket.Chat REST Client

**Files:**
- Create: `src/types.ts`
- Create: `src/client.ts`
- Test: `tests/client.test.ts`

**Step 1: Write the failing test**

Cover:
- password login exchanges credentials for user/token
- token mode uses provided headers
- request helper attaches required headers
- API errors are normalized

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/client.test.ts`
Expected: FAIL because client is missing.

**Step 3: Write minimal implementation**

Implement fetch-based REST client with auth state management.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types.ts src/client.ts tests/client.test.ts
git commit -m "feat: add rocketchat rest client"
```

### Task 7: Implement Inbound Transport Contracts

**Files:**
- Create: `src/inbound/types.ts`
- Create: `src/inbound/websocket.ts`
- Test: `tests/inbound-types.test.ts`

**Step 1: Write the failing test**

Cover:
- exported transport types are importable
- websocket transport placeholder throws a clear not-implemented error

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/inbound-types.test.ts`
Expected: FAIL because transport modules are missing.

**Step 3: Write minimal implementation**

Define contracts and add a stub websocket transport.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/inbound-types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/inbound/types.ts src/inbound/websocket.ts tests/inbound-types.test.ts
git commit -m "feat: add inbound transport contracts"
```

### Task 8: Implement REST Polling Transport

**Files:**
- Create: `src/inbound/polling.ts`
- Test: `tests/polling.test.ts`

**Step 1: Write the failing test**

Cover:
- polling uses checkpoint timestamp
- room activity lookup narrows sync targets
- duplicate/self/system messages are filtered
- checkpoint advances only after successful handling

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/polling.test.ts`
Expected: FAIL because polling transport is missing.

**Step 3: Write minimal implementation**

Implement one poll cycle and transport start/stop behavior.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/polling.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/inbound/polling.ts tests/polling.test.ts
git commit -m "feat: add rest polling transport"
```

### Task 9: Implement Channel Message Rules

**Files:**
- Create: `src/channel.ts`
- Test: `tests/channel.test.ts`

**Step 1: Write the failing test**

Cover:
- DM messages are accepted
- group messages require mention
- mention metadata and alias fallback both work
- self messages are ignored

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/channel.test.ts`
Expected: FAIL because channel logic is missing.

**Step 3: Write minimal implementation**

Implement event acceptance rules and outbound placeholder/update flow adapters.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/channel.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/channel.ts tests/channel.test.ts
git commit -m "feat: add channel message routing rules"
```

### Task 10: Wire Plugin Entry

**Files:**
- Modify: `src/index.ts`
- Test: `tests/index.test.ts`

**Step 1: Write the failing test**

Extend the entry smoke test so it asserts the exported plugin registers the `rocketchat` channel and exposes metadata.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/index.test.ts`
Expected: FAIL because entry wiring is incomplete.

**Step 3: Write minimal implementation**

Wire config parsing, channel creation, and plugin registration in the entry module.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/index.ts tests/index.test.ts
git commit -m "feat: wire rocketchat plugin entry"
```

### Task 11: Document Usage

**Files:**
- Modify: `README.md`

**Step 1: Write the failing test**

Not required for docs-only changes.

**Step 2: Run test to verify it fails**

Not required.

**Step 3: Write minimal implementation**

Document installation, config examples, auth modes, and current REST polling limitations.

**Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add plugin usage guide"
```

### Task 12: Verify Full Project

**Files:**
- Verify all created files

**Step 1: Run test suite**

Run: `npm test`
Expected: all tests pass

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: exit 0

**Step 3: Run build**

Run: `npm run build`
Expected: exit 0

**Step 4: Inspect package contents**

Run: `npm pack --dry-run`
Expected: manifest, dist output, and docs present

**Step 5: Commit**

```bash
git add .
git commit -m "feat: implement rocketchat channel plugin"
```
