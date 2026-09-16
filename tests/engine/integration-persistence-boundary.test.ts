import test from "node:test";
import assert from "node:assert/strict";

import {
    asId,
} from "../../src/core/index.js";
import {
    GameRuntime,
} from "../../src/application/index.js";
import {
    StateSerializer,
} from "../../src/state/index.js";
import type {
    SaveStorage,
} from "../../src/state/index.js";

class CapturingSaveStorage implements SaveStorage {
    private serializedState: string | null = null;
    writes = 0;

    write(serializedState: string): void {
        this.writes += 1;
        this.serializedState = serializedState;
    }

    read(): string | null {
        return this.serializedState;
    }
}

class InspectingSaveStorage implements SaveStorage {
    private serializedState: string | null = null;
    writes = 0;

    write(serializedState: string): void {
        this.writes += 1;
        this.serializedState = serializedState;
    }

    read(): string | null {
        return this.serializedState;
    }

    replace(serializedState: string): void {
        this.serializedState = serializedState;
    }
}

test("save boundary writes one versioned payload derived from canonical runtime state", () => {
    const storage = new CapturingSaveStorage();
    const runtime = new GameRuntime(undefined, undefined, storage);

    runtime.flagStore.set("boundary_test", true);
    runtime.economy.credit(
        250,
        "BONUS",
        "boundary-test",
        "2026-09-11T00:00:00.000Z",
    );

    const saved = runtime.persistence.save();

    assert.equal(storage.writes, 1);
    assert.ok(storage.read());
    assert.equal(saved.schemaVersion, 1);

    const persisted = new StateSerializer().deserialize(storage.read()!);
    assert.deepEqual(persisted.state, runtime.stateStore.getState());
    assert.equal(persisted.state.flags.boundary_test, true);
    assert.equal(persisted.state.domain.economy.balance, 250);
});

test("load boundary validates persisted data before replacing canonical state", () => {
    const storage = new InspectingSaveStorage();
    const runtime = new GameRuntime(undefined, undefined, storage);

    runtime.flagStore.set("boundary_test", true);
    runtime.economy.credit(
        100,
        "BONUS",
        "original",
        "2026-09-11T00:00:00.000Z",
    );
    runtime.persistence.save();

    const originalState = runtime.stateStore.getState();
    const corrupted = JSON.stringify({
        schemaVersion: 1,
        state: {
            ...originalState,
            domain: {
                ...originalState.domain,
                economy: {
                    ...originalState.domain.economy,
                    balance: -1,
                },
            },
        },
    });

    storage.replace(corrupted);

    assert.throws(() => runtime.persistence.load());
    assert.deepEqual(runtime.stateStore.getState(), originalState);
});

test("load boundary replaces only canonical StateStore state after successful validation", () => {
    const storage = new CapturingSaveStorage();
    const first = new GameRuntime(undefined, undefined, storage);

    first.flagStore.set("boundary_test", true);
    first.economy.credit(
        600,
        "BONUS",
        "persisted",
        "2026-09-11T00:00:00.000Z",
    );
    first.persistence.save();

    const second = new GameRuntime(undefined, undefined, storage);
    assert.equal(second.economy.getBalance(), 0);
    assert.equal(second.flagStore.get("boundary_test"), undefined);

    assert.equal(second.persistence.load(), true);

    assert.deepEqual(second.stateStore.getState(), first.stateStore.getState());
    assert.equal(second.economy.getBalance(), 600);
    assert.equal(second.flagStore.get("boundary_test"), true);
});

test("save/load boundary preserves serialized domain state without service-specific persistence state", () => {
    const storage = new CapturingSaveStorage();
    const runtime = new GameRuntime(undefined, undefined, storage);

    runtime.economy.credit(
        300,
        "BONUS",
        "boundary-history",
        "2026-09-11T00:00:00.000Z",
    );
    runtime.reward.claim({
        id: asId("reward.boundary"),
        kind: "experience",
        amount: 40,
    });

    runtime.persistence.save();
    const serialized = storage.read();
    assert.ok(serialized);

    const parsed = new StateSerializer().deserialize(serialized);
    assert.equal(parsed.state.domain.economy.transactions.length, 1);
    assert.equal(parsed.state.domain.reward.claimedRewardIds.length, 1);
    assert.equal(parsed.state.domain.progression.experience, 40);

    const restored = new GameRuntime(undefined, undefined, storage);
    assert.equal(restored.persistence.load(), true);
    assert.deepEqual(restored.stateStore.getState(), parsed.state);
});
