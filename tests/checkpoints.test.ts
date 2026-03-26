import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { FileCheckpointStore } from "../src/checkpoints.js";

describe("FileCheckpointStore", () => {
  const cleanupPaths: string[] = [];

  afterEach(async () => {
    await Promise.all(cleanupPaths.splice(0).map((path) => rm(path, { force: true, recursive: true })));
  });

  async function createStore() {
    const directory = await mkdtemp(join(tmpdir(), "rocketchat-checkpoints-"));
    cleanupPaths.push(directory);
    return new FileCheckpointStore(join(directory, "state.json"), 3);
  }

  it("starts with an empty state", async () => {
    const store = await createStore();

    await expect(store.read("main")).resolves.toEqual({
      updatedSince: null,
      recentMessageIds: []
    });
  });

  it("persists updatedSince", async () => {
    const store = await createStore();

    await store.write("main", {
      updatedSince: "2026-03-26T11:00:00.000Z",
      recentMessageIds: []
    });

    await expect(store.read("main")).resolves.toEqual({
      updatedSince: "2026-03-26T11:00:00.000Z",
      recentMessageIds: []
    });
  });

  it("enforces a bounded recent message id window", async () => {
    const store = await createStore();

    await store.markSeen("main", "m1");
    await store.markSeen("main", "m2");
    await store.markSeen("main", "m3");
    await store.markSeen("main", "m4");

    await expect(store.read("main")).resolves.toEqual({
      updatedSince: null,
      recentMessageIds: ["m2", "m3", "m4"]
    });
    await expect(store.hasSeen("main", "m1")).resolves.toBe(false);
    await expect(store.hasSeen("main", "m4")).resolves.toBe(true);
  });
});
