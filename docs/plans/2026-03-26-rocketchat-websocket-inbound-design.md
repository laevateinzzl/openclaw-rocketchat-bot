# Rocket.Chat WebSocket Inbound Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan after this design is approved.

**Goal:** Add a production-usable Rocket.Chat WebSocket/DDP inbound transport so OpenClaw can receive messages without REST polling rate limits.

**Architecture:** Keep the existing outbound path, message filtering, checkpoint state, and OpenClaw reply lifecycle unchanged. Add a real `websocket` inbound transport behind the existing `InboundTransport` abstraction and make account startup choose between `polling` and `websocket` based on config.

**Tech Stack:** TypeScript, Node.js built-in `WebSocket`, Rocket.Chat DDP/WebSocket protocol, existing REST client for bootstrap room discovery, Vitest, zod.

---

## Scope

### In scope

- Add `transport.mode: "websocket"` account configuration.
- Implement Rocket.Chat DDP connect/login over WebSocket.
- Subscribe to room message streams for currently visible rooms.
- Subscribe to per-user room-change notifications and refresh room subscriptions when rooms change.
- Reuse existing message normalization, mention gating, dedupe, and outbound reply logic.
- Keep REST polling available as a fallback mode.
- Add automated tests for config parsing, DDP handshake, event mapping, and room refresh behavior.

### Out of scope

- Replacing REST outbound sends.
- Thread support, attachments, reactions, or message edit/delete sync.
- WebSocket reconnect persistence beyond process-level reconnect.
- Dual-mode active transport for one account.

## Recommended Approach

### Recommended: WebSocket inbound with REST bootstrap

The transport will:

1. Use the existing REST client to authenticate and resolve the bot identity.
2. Open a DDP WebSocket connection to Rocket.Chat.
3. Send DDP `connect`.
4. Send DDP `login` with `{ resume: authToken }`.
5. Use one REST call to `subscriptions.get` to discover current rooms.
6. Subscribe each room to `stream-room-messages`.
7. Subscribe the user to `stream-notify-user` events:
   - `userId/subscriptions-changed`
   - `userId/rooms-changed`
8. When room-change events arrive, refresh room subscriptions via REST and subscribe newly seen rooms.

This avoids the REST polling hot loop while keeping room discovery and auth reuse simple.

### Rejected: pure WebSocket room discovery

Rocket.Chat realtime docs do not give a cleaner, simpler bootstrap path than using one REST call after auth. Using REST once at startup is lower-risk and keeps the DDP implementation smaller.

### Rejected: adaptive REST-only polling

The current server rate limits REST hard enough that even `30s` polling still produces `429`. This is not a viable real-time path.

## Data Flow

1. OpenClaw starts the Rocket.Chat account.
2. Plugin initializes Rocket.Chat identity via existing client.
3. Transport factory selects `polling` or `websocket`.
4. WebSocket transport opens DDP session and logs in.
5. Transport subscribes to room streams and room-change notifications.
6. Incoming DDP message events are normalized into `InboundEvent`.
7. Existing channel logic applies mention gating and dispatches to OpenClaw.
8. Existing reply lifecycle sends placeholder and final response via REST.

## Transport Contract Changes

The `InboundTransport` contract stays stable:

- `kind(): "polling" | "websocket"`
- `start(): Promise<void>`
- `stop(): Promise<void>`

The new WebSocket transport will also expose one-shot startup behavior compatible with the current plugin lifecycle:

- `start()` opens the socket, completes handshake, and starts background listeners.
- `stop()` closes the socket and cancels reconnect/refresh work.

No changes are needed to `InboundEvent`.

## Configuration

`transport` becomes a discriminated union:

- polling mode
  - `mode: "polling"`
  - `pollIntervalMs`
- websocket mode
  - `mode: "websocket"`
  - optional `reconnectDelayMs`

Default remains polling to preserve compatibility for existing installs.

## DDP Message Handling

### Outbound frames

- `connect`
- `method` for `login`
- `sub` for `stream-room-messages`
- `sub` for `stream-notify-user`
- periodic `ping`

### Inbound frames of interest

- `connected`
- `result` for login and subscription acknowledgements
- `ping`
- `changed` for:
  - `stream-room-messages`
  - `stream-notify-user`

### Event mapping

- `stream-room-messages`
  - extract the Rocket.Chat message record from the first arg
  - infer room id from payload event name or message record
- `stream-notify-user`
  - treat room/subscription change events as resubscribe triggers
  - refresh room list through REST only when these events arrive

## Error Handling

- Handshake/login failure:
  - fail startup so OpenClaw reports the account error clearly
- Room subscription failure:
  - keep the socket alive, log, and retry on next room refresh
- Socket close after startup:
  - reject the lifetime promise so OpenClaw restarts the account
- Duplicate room subscriptions:
  - maintain a subscribed room set and skip repeats

## Testing Strategy

Add focused tests for:

- config parsing accepts websocket mode
- websocket transport sends expected DDP frames
- websocket transport maps room messages into `InboundEvent`
- room-change events trigger room refresh and subscribe only new rooms
- plugin startup selects websocket transport when configured

## Acceptance Criteria

- `transport.mode: "websocket"` is accepted by config validation.
- A websocket-configured account does not use polling timers.
- Incoming room messages reach the existing OpenClaw handling path.
- REST polling rate limits no longer block inbound delivery for websocket accounts.
- Existing polling mode remains available and tested.
