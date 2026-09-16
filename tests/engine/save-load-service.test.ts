import test from "node:test";
import assert from "node:assert/strict";

import {
    asId,
} from "../../src/core/index.js";
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

const createService = () => {
    const stateStore = new StateStore(createDefaultRuntimeState());
    const storage = new TestSaveStorage();
    const service = new SaveLoadService(
        stateStore,
        new StateSerializer(),
        storage,
    );

    return { service, stateStore, storage };
};

test("save serializes and writes the canonical runtime state", () => {
    const { service, stateStore, storage } = createService();

    stateStore.updateState((state) => ({
        ...state,
        flags: {
            mission_started: true,
        },
    }));

    const saved = service.save();

    assert.equal(saved.schemaVersion, 1);
    assert.deepEqual(saved.state, stateStore.getState());
    assert.equal(storage.read(), JSON.stringify(saved));
});

test("load returns false when storage is empty", () => {
    const { service, stateStore } = createService();

    const before = stateStore.getState();

    assert.equal(service.load(), false);
    assert.strictEqual(stateStore.getState(), before);
});

test("load replaces canonical state from persisted storage", () => {
    const first = createService();
    first.stateStore.updateState((state) => ({
        ...state,
        flags: {
            mission_started: true,
            evidence_found: 2,
        },
    }));
    first.service.save();

    const second = createService();
    assert.notDeepEqual(
        second.stateStore.getState(),
        first.stateStore.getState(),
    );

    second.storage.write(first.storage.read() as string);

    assert.equal(second.service.load(), true);
    assert.deepEqual(
        second.stateStore.getState(),
        first.stateStore.getState(),
    );
});

test("save and load preserve the complete runtime state", () => {
    const { service, stateStore } = createService();

    stateStore.updateState((state) => ({
        ...state,
        flags: {
            chapter: "02",
            investigation_score: 7,
        },
        domain: {
            ...state.domain,
            quests: {
                activeQuestId: asId<"Quest">("quest.test"),
                completedQuestIds: [asId<"Quest">("quest.previous")],
                failedQuestIds: [],
            },
            economy: {
                balance: 500,
                transactions: [
                    {
                        id: asId<"Transaction">("transaction.test"),
                        type: "CREDIT",
                        amount: 500,
                        source: "QUEST_REWARD",
                        reference: "quest.test",
                        timestamp: "2026-09-11T00:00:00.000Z",
                    },
                ],
                appliedMissionRewardKeys: ["quest.test:completion-1:0"],
            },
            ending: {
                endingId: null,
                resolved: false,
            },
        },
    }));

    const before = stateStore.getState();
    service.save();

    stateStore.replaceState(createDefaultRuntimeState());
    assert.notDeepEqual(stateStore.getState(), before);

    assert.equal(service.load(), true);
    assert.deepEqual(stateStore.getState(), before);
});

test("load rejects corrupted persisted payloads", () => {
    const { service, storage, stateStore } = createService();

    const before = stateStore.getState();
    storage.write("not-json");

    assert.throws(
        () => service.load(),
        /Unexpected token|JSON/i,
    );
    assert.strictEqual(stateStore.getState(), before);
});
