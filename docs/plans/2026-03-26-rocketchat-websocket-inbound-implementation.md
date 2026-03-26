# Rocket.Chat WebSocket Inbound Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a WebSocket/DDP inbound transport for Rocket.Chat accounts while keeping existing polling mode and reply behavior intact.

**Architecture:** Extend config to support a transport mode union, implement a real `src/inbound/websocket.ts` transport that uses DDP plus REST room bootstrap, and update plugin startup to select the correct transport. Existing message filtering and outbound REST sends remain unchanged.

**Tech Stack:** TypeScript, Node.js built-in WebSocket, Vitest, zod, existing Rocket.Chat REST client.

---

### Task 1: Document WebSocket transport scope

**Files:**
- Create: `docs/plans/2026-03-26-rocketchat-websocket-inbound-design.md`
- Create: `docs/plans/2026-03-26-rocketchat-websocket-inbound-implementation.md`

**Step 1: Write the design and implementation docs**

Capture bootstrap flow, DDP handshake, room refresh behavior, config changes, and test boundaries.

**Step 2: Commit**

```bash
git add docs/plans/2026-03-26-rocketchat-websocket-inbound-design.md docs/plans/2026-03-26-rocketchat-websocket-inbound-implementation.md
git commit -m "docs: plan websocket inbound transport"
```

### Task 2: Add failing config tests for websocket mode

**Files:**
- Modify: `tests/config.test.ts`
- Modify: `src/config.ts`

**Step 1: Write the failing test**

Add a test that accepts:

```ts
transport: {
  mode: "websocket"
}
```

and rejects websocket-only invalid fields if needed.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/config.test.ts`
Expected: FAIL because config only supports polling.

**Step 3: Write minimal implementation**

Turn `transport` into a discriminated union with polling/websocket variants.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/config.test.ts`
Expected: PASS

### Task 3: Replace websocket stub with failing transport tests

**Files:**
- Modify: `tests/inbound-types.test.ts`
- Create: `tests/websocket.test.ts`
- Modify: `src/inbound/websocket.ts`

**Step 1: Write the failing tests**

Cover:

- `createWebSocketTransport(...).kind()` returns `websocket`
- `start()` sends DDP `connect`, `login`, and room/user subscriptions
- incoming `stream-room-messages` payload is normalized into `InboundEvent`
- incoming `rooms-changed` or `subscriptions-changed` triggers room refresh and only subscribes new rooms

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/websocket.test.ts`
Expected: FAIL because websocket transport is still a stub.

**Step 3: Write minimal implementation**

Implement a testable websocket transport with:

- injected `WebSocket` factory
- injected timer helpers
- DDP frame parser
- room subscription tracking
- room refresh callback via existing REST client

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/websocket.test.ts`
Expected: PASS

### Task 4: Integrate transport selection into plugin startup

**Files:**
- Modify: `src/plugin.ts`
- Modify: `tests/plugin-gateway.test.ts`

**Step 1: Write the failing test**

Add a test that configures `transport.mode: "websocket"` and asserts plugin startup creates the websocket transport instead of polling.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run tests/plugin-gateway.test.ts`
Expected: FAIL because startup always instantiates polling transport.

**Step 3: Write minimal implementation**

Add a small transport factory path in `plugin.ts` that selects polling vs websocket from account config.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run tests/plugin-gateway.test.ts`
Expected: PASS

### Task 5: Update docs and debug guidance

**Files:**
- Modify: `README.md`

**Step 1: Write doc updates**

Update:

- capabilities section
- current limitations
- config examples for websocket mode
- debugging notes calling out REST bootstrap plus websocket inbound

**Step 2: Verify docs**

Check the README snippets against real config shape and script names.

### Task 6: Run full verification

**Files:**
- Modify: none

**Step 1: Run targeted tests**

Run:

```bash
npm test -- --run tests/config.test.ts
npm test -- --run tests/websocket.test.ts
npm test -- --run tests/plugin-gateway.test.ts
```

Expected: PASS

**Step 2: Run full verification**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: PASS
