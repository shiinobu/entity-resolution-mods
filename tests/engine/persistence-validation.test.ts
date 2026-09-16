import test from "node:test";
import assert from "node:assert/strict";

import {
    createDefaultRuntimeState,
    SaveLoadService,
    StateSerializer,
    StateStore,
    type SaveStorage,
} from "../../src/state/index.js";

class TestSaveStorage implements SaveStorage {
    private serializedState: string | null = null;

    write(serializedState: string): void {
        this.serializedState = serializedState;
    }

    read(): string | null {
        return this.serializedState;
    }
}

const createPayload = () =>
    JSON.parse(
        JSON.stringify({
            schemaVersion: 1,
            state: createDefaultRuntimeState(),
        }),
    ) as {
        schemaVersion: number;
        state: ReturnType<typeof createDefaultRuntimeState>;
    };

test("serializer rejects an unsupported save schema version", () => {
    const serializer = new StateSerializer();
    const payload = createPayload();
    payload.schemaVersion = 999;

    assert.throws(
        () => serializer.deserialize(JSON.stringify(payload)),
        /Unsupported persisted state schema version/,
    );
});

test("serializer rejects a missing runtime state", () => {
    const serializer = new StateSerializer();

    assert.throws(
        () => serializer.deserialize(JSON.stringify({ schemaVersion: 1 })),
        /Invalid runtime state payload|Invalid persisted state payload/,
    );
});

test("serializer rejects invalid flag values", () => {
    const serializer = new StateSerializer();
    const payload = createPayload();
    const mutableState = payload.state as unknown as {
        flags: Record<string, unknown>;
    };
    mutableState.flags.invalid = { nested: true };

    assert.throws(
        () => serializer.deserialize(JSON.stringify(payload)),
        /Invalid runtime state payload/,
    );
});

test("serializer rejects incomplete domain state", () => {
    const serializer = new StateSerializer();
    const payload = createPayload();
    const mutableDomain = payload.state.domain as unknown as Record<
        string,
        unknown
    >;
    delete mutableDomain.quests;

    assert.throws(
        () => serializer.deserialize(JSON.stringify(payload)),
        /Invalid runtime state payload/,
    );
});

test("serializer rejects invalid economy balance", () => {
    const serializer = new StateSerializer();
    const payload = createPayload();
    const mutableEconomy = payload.state.domain.economy as unknown as Record<
        string,
        unknown
    >;
    mutableEconomy.balance = -1;

    assert.throws(
        () => serializer.deserialize(JSON.stringify(payload)),
        /Invalid runtime state payload/,
    );
});

test("serializer accepts a pending ending ID before resolution", () => {
    const serializer = new StateSerializer();
    const payload = createPayload();
    const mutableEnding = payload.state.domain.ending as unknown as Record<
        string,
        unknown
    >;
    mutableEnding.endingId = "ending.test";
    mutableEnding.resolved = false;

    assert.doesNotThrow(() => serializer.deserialize(JSON.stringify(payload)));
});

test("serializer rejects a resolved ending without an ending ID", () => {
    const serializer = new StateSerializer();
    const payload = createPayload();
    const mutableEnding = payload.state.domain.ending as unknown as Record<
        string,
        unknown
    >;
    mutableEnding.endingId = null;
    mutableEnding.resolved = true;

    assert.throws(
        () => serializer.deserialize(JSON.stringify(payload)),
        /Invalid runtime state payload/,
    );
});

test("load rejects an invalid save without replacing canonical state", () => {
    const stateStore = new StateStore(createDefaultRuntimeState());
    const storage = new TestSaveStorage();
    const service = new SaveLoadService(
        stateStore,
        new StateSerializer(),
        storage,
    );

    stateStore.updateState((state) => ({
        ...state,
        flags: {
            mission_started: true,
        },
    }));

    const before = stateStore.getState();
    const invalidPayload = createPayload();
    const mutableEconomy = invalidPayload.state.domain.economy as unknown as Record<
        string,
        unknown
    >;
    mutableEconomy.balance = -500;
    storage.write(JSON.stringify(invalidPayload));

    assert.throws(
        () => service.load(),
        /Invalid runtime state payload/,
    );
    assert.strictEqual(stateStore.getState(), before);
});
