# Rocket.Chat Channel Plugin Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan after this design is approved.

**Goal:** Build an installable OpenClaw Rocket.Chat channel plugin that supports DM and mention-gated group replies using Rocket.Chat REST polling.

**Architecture:** The plugin is a native TypeScript OpenClaw channel plugin. It separates Rocket.Chat API access, inbound transport, message mapping, formatting, and checkpoint persistence so a future WebSocket/DDP transport can be added without rewriting business logic.

**Tech Stack:** TypeScript, Node.js, OpenClaw plugin SDK, REST polling transport, Vitest, zod.

---

## Scope

### In scope

- Installable plugin package for OpenClaw.
- Rocket.Chat authentication via:
  - personal access token
  - username/password login
- DM support.
- Group/channel support with reply gating on explicit mention only.
- Friendly reply rendering:
  - initial `思考中...` placeholder
  - final response replaces placeholder
  - fenced code blocks preserved
- REST polling transport with persistent checkpoints.
- Transport abstraction designed for a later WebSocket implementation.
- Automated tests for core logic.

### Out of scope for v1

- WebSocket/DDP inbound transport.
- File upload/download.
- Reactions, threads, edits sync, deletions sync.
- Full end-to-end testing against a live Rocket.Chat workspace.

## Plugin Shape

The repository will build a native OpenClaw plugin package with:

- `package.json`
- `openclaw.plugin.json`
- `src/index.ts`

The plugin registers one channel:

- channel id: `rocketchat`
- config path: `channels.rocketchat`

The package layout is designed to work with local install and future npm publishing so it can be installed via `openclaw plugins install`.

## Module Layout

- `src/index.ts`
  - plugin entry
  - registers the channel and account startup hooks
- `src/channel.ts`
  - bridges OpenClaw runtime/channel behavior to transport and outbound sender
- `src/client.ts`
  - Rocket.Chat REST client
  - login flow
  - authenticated request wrapper
- `src/inbound/types.ts`
  - transport contracts and normalized inbound event model
- `src/inbound/polling.ts`
  - REST polling transport implementation
- `src/inbound/websocket.ts`
  - reserved stub for future transport
- `src/checkpoints.ts`
  - persistent polling cursor and recent message id tracking
- `src/format.ts`
  - thinking placeholder and reply text formatting
- `src/config.ts`
  - zod-based config validation and account resolution
- `src/types.ts`
  - shared Rocket.Chat payload types

## Inbound Transport Design

The transport boundary is stable in v1 even though only polling is implemented.

### Core interfaces

- `InboundTransport`
  - `kind(): "polling" | "websocket"`
  - `start(): Promise<void>`
  - `stop(): Promise<void>`
- `InboundEvent`
  - `accountId`
  - `roomId`
  - `roomType`
  - `messageId`
  - `senderId`
  - `senderName`
  - `text`
  - `mentions`
  - `sentAt`
  - `raw`
- `CheckpointStore`
  - stores per-account `updatedSince`
  - stores a bounded recent message id set for dedupe
- `TransportFactory`
  - reads config `transport.mode`
  - returns polling transport in v1

### Polling strategy

1. Read the last `updatedSince` checkpoint for the account.
2. Call `subscriptions.get` to identify rooms with activity after that timestamp.
3. Call `chat.syncMessages` for candidate rooms to get incremental messages.
4. Normalize events into `InboundEvent`.
5. Filter ignored/system/self/duplicate messages.
6. Hand accepted events to channel logic.
7. Advance checkpoint only after successful handling.

This minimizes room scans and keeps the future transport interface aligned with a push-based model.

## Authentication and Configuration

Two auth modes are supported:

- `token`
  - required: `serverUrl`, `userId`, `accessToken`
- `password`
  - required: `serverUrl`, `username`, `password`

Shared account settings:

- `enabled`
- `displayName`
- `pollIntervalMs`
- `transport.mode`
- `mentionNames`

The plugin validates configuration up front and fails accounts fast on invalid config or failed authentication.

## Message Rules

### Accepted inbound messages

- DMs are always eligible.
- Group/channel messages are eligible only when they explicitly mention the bot.

### Ignored inbound messages

- Messages authored by the bot account itself.
- Rocket.Chat system messages.
- Duplicate messages already seen in recent checkpoint state.
- Empty messages after normalization.

### Mention matching

Mention matching uses Rocket.Chat mention metadata first. A text fallback is allowed for configured aliases to avoid coupling behavior to one server payload shape.

## Outbound Reply Strategy

For each handled message:

1. Post a placeholder message `思考中...`.
2. Let OpenClaw generate the final reply.
3. Update the placeholder in place with the final Markdown response.

Formatting rules:

- Preserve fenced code blocks.
- Avoid aggressive Markdown rewriting.
- Split only when required by platform limits.
- Show concise fallback text for empty/error outcomes.

## Error Handling

- Transient HTTP/network failures: retry a small bounded number of times.
- Authentication failures: stop account processing and emit diagnostic logs.
- Poll cycle failure: log and keep last good checkpoint.
- Message handling failure: do not advance checkpoint for that message batch.

## Testing Strategy

Unit and integration-style tests cover:

- config validation for token/password modes
- formatter behavior
- mention gating
- checkpoint persistence and dedupe
- polling room/message progression
- auth branch behavior in client

No live Rocket.Chat end-to-end tests are required for v1.

## Acceptance Criteria

- Local package exposes a valid OpenClaw plugin manifest.
- A configured token-auth account can poll and receive DM messages.
- Group/channel messages only trigger replies when the bot is mentioned.
- Outbound messages show `思考中...` first and are later updated with the final text.
- Code fences remain intact in final replies.
- The inbound transport boundary allows a future WebSocket implementation without changing channel business logic.
