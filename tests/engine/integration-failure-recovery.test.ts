import test from "node:test";
import assert from "node:assert/strict";

import {
    asId,
} from "../../src/core/index.js";
import type { CharacterId } from "../../src/core/index.js";
import {
    GameRuntime,
} from "../../src/application/index.js";
import {
    flagEquals,
} from "../../src/domain/shared/index.js";
import {
    type Quest,
} from "../../src/domain/quest/index.js";
import {
    type SaveStorage,
} from "../../src/state/index.js";

class SharedSaveStorage implements SaveStorage {
    private serializedState: string | null = null;

    write(serializedState: string): void {
        this.serializedState = serializedState;
    }

    read(): string | null {
        return this.serializedState;
    }
}

class FailingSaveStorage implements SaveStorage {
    write(): void {
        throw new Error("Storage write failed.");
    }

    read(): string | null {
        return null;
    }
}

const actorId: CharacterId = asId("character.marcus");

const quest: Quest = {
    id: asId("quest.failure-recovery"),
    chapterId: "01",
    title: "Failure Recovery Quest",
    description: "Exercise failure and recovery across runtime services.",
    objectives: [
        {
            id: "objective.failure-recovery",
            description: "Enable the recovery condition.",
            condition: flagEquals("recovery_ready", true),
        },
    ],
};

test("failed service operations preserve canonical state and allow recovery", () => {
    const runtime = new GameRuntime();

    runtime.quest.start(quest);
    runtime.economy.credit(
        250,
        "BONUS",
        "initial-balance",
        "2026-09-11T00:00:00.000Z",
    );

    runtime.flagStore.set("recovery_ready", true);
    assert.equal(runtime.quest.complete(quest), true);

    const beforeFailure = runtime.stateStore.getState();

    assert.throws(() => runtime.quest.start(quest));
    assert.throws(() =>
        runtime.economy.debit(
            500,
            "PURCHASE",
            "insufficient-funds",
            "2026-09-11T00:01:00.000Z",
        ),
    );

    assert.deepEqual(runtime.stateStore.getState(), beforeFailure);
    assert.equal(runtime.quest.isCompleted(quest), true);
    assert.equal(runtime.economy.getBalance(), 250);
});

test("failed persistence load does not replace canonical state and valid state remains recoverable", () => {
    const storage = new SharedSaveStorage();
    const runtime = new GameRuntime(undefined, undefined, storage);

    runtime.flagStore.set("recovery_ready", true);
    runtime.quest.start(quest);
    runtime.reward.claim({
        id: asId("reward.failure-recovery"),
        kind: "experience",
        amount: 60,
    });

    const validState = runtime.stateStore.getState();
    runtime.persistence.save();

    storage.write("{\"schemaVersion\":1,\"state\":{\"flags\":{}}}");

    assert.throws(() => runtime.persistence.load());
    assert.deepEqual(runtime.stateStore.getState(), validState);
    assert.equal(runtime.quest.isActive(quest), true);
    assert.equal(runtime.reward.hasClaimed(asId("reward.failure-recovery")), true);

    runtime.flagStore.set("recovery_ready", false);
    assert.equal(runtime.quest.complete(quest), false);
    runtime.flagStore.set("recovery_ready", true);
    assert.equal(runtime.quest.complete(quest), true);
});

test("failed save does not mutate canonical state", () => {
    const runtime = new GameRuntime(
        undefined,
        undefined,
        new FailingSaveStorage(),
    );

    runtime.economy.credit(
        400,
        "BONUS",
        "before-failed-save",
        "2026-09-11T00:00:00.000Z",
    );
    runtime.access.grant({
        id: asId("access.failure-recovery"),
        actorId,
        capability: "OVERRIDE_OPERATOR",
    });

    const beforeFailure = runtime.stateStore.getState();

    assert.throws(() => runtime.persistence.save());
    assert.deepEqual(runtime.stateStore.getState(), beforeFailure);
    assert.equal(runtime.economy.getBalance(), 400);
    assert.equal(runtime.access.hasCapability(actorId, "OVERRIDE_OPERATOR"), true);
});
