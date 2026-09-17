import test from "node:test";
import assert from "node:assert/strict";

import { asId } from "../../src/core/index.js";
import type { CharacterId } from "../../src/core/index.js";
import { GameRuntime } from "../../src/application/index.js";
import { flagEquals } from "../../src/domain/shared/index.js";
import type { Ending } from "../../src/domain/ending/index.js";
import type { Quest } from "../../src/domain/quest/index.js";
import type { SaveStorage } from "../../src/state/index.js";

class SharedStorage implements SaveStorage {
    private serializedState: string | null = null;

    write(serializedState: string): void {
        this.serializedState = serializedState;
    }

    read(): string | null {
        return this.serializedState;
    }
}

const actorId: CharacterId = asId("character.marcus");

const quest: Quest = {
    id: asId("quest.full-validation"),
    chapterId: "04",
    title: "Full Validation Quest",
    description: "Exercise the complete runtime integration surface.",
    objectives: [{
        id: "objective.full-validation",
        description: "Enable the final condition.",
        condition: flagEquals("final_condition", true),
    }],
};

const ending: Ending = {
    id: "ending.full-validation",
    condition: flagEquals("final_condition", true),
};

test("full runtime integration preserves all canonical services through save and load", () => {
    const storage = new SharedStorage();
    const source = new GameRuntime(undefined, undefined, storage);

    source.flagStore.set("final_condition", true);
    source.narrativeState.setChapter("04");
    source.narrativeState.startDialogue(
        "dialogue.full-validation",
        "node.start",
    );
    source.narrativeState.advanceDialogue("node.evidence");
    source.narrativeState.completeChapter("04");

    source.quest.start(quest);
    assert.equal(source.quest.complete(quest), true);

    source.reward.claim({
        id: asId("reward.full-validation"),
        kind: "experience",
        amount: 100,
    });

    source.economy.credit(
        700,
        "QUEST_REWARD",
        "quest.full-validation",
        "2026-09-11T00:00:00.000Z",
    );

    source.access.grant({
        id: asId("access.full-validation"),
        actorId,
        capability: "OVERRIDE_OPERATOR",
    });

    assert.equal(source.ending.resolve([ending]), ending.id);

    const expectedState = source.stateStore.getState();
    source.persistence.save();

    const restored = new GameRuntime(undefined, undefined, storage);
    assert.equal(restored.persistence.load(), true);

    assert.deepEqual(restored.stateStore.getState(), expectedState);
    assert.equal(restored.quest.isCompleted(quest), true);
    assert.equal(
        restored.reward.hasClaimed(asId("reward.full-validation")),
        true,
    );
    assert.equal(restored.economy.getBalance(), 700);
    assert.equal(
        restored.access.hasCapability(actorId, "OVERRIDE_OPERATOR"),
        true,
    );
    assert.equal(restored.ending.isResolved(), true);
    assert.equal(restored.ending.getEndingId(), ending.id);
});

test("full runtime integration does not replay rewards, transactions, or ending resolution on restore", () => {
    const storage = new SharedStorage();
    const source = new GameRuntime(undefined, undefined, storage);

    source.flagStore.set("final_condition", true);
    source.quest.start(quest);
    assert.equal(source.quest.complete(quest), true);

    source.reward.claim({
        id: asId("reward.no-replay"),
        kind: "experience",
        amount: 50,
    });
    source.economy.credit(
        400,
        "QUEST_REWARD",
        "no-replay",
        "2026-09-11T00:00:00.000Z",
    );
    assert.equal(source.ending.resolve([ending]), ending.id);
    source.persistence.save();

    const restored = new GameRuntime(undefined, undefined, storage);
    assert.equal(restored.persistence.load(), true);

    const stateAfterLoad = restored.stateStore.getState();
    assert.equal(stateAfterLoad.domain.reward.claimedRewardIds.length, 1);
    assert.equal(stateAfterLoad.domain.economy.transactions.length, 1);
    assert.equal(stateAfterLoad.domain.economy.balance, 400);
    assert.equal(stateAfterLoad.domain.progression.experience, 50);
    assert.equal(stateAfterLoad.domain.ending.endingId, ending.id);
    assert.equal(restored.ending.resolve([ending]), ending.id);

    assert.deepEqual(restored.stateStore.getState(), stateAfterLoad);
});

test("full runtime integration keeps sibling domain state isolated during unrelated service updates", () => {
    const runtime = new GameRuntime();

    runtime.flagStore.set("isolation", true);
    const before = runtime.stateStore.getState();

    runtime.economy.credit(
        200,
        "BONUS",
        "isolation",
        "2026-09-11T00:00:00.000Z",
    );

    const afterEconomy = runtime.stateStore.getState();
    assert.equal(afterEconomy.flags.isolation, true);
    assert.deepEqual(afterEconomy.domain.quests, before.domain.quests);
    assert.deepEqual(afterEconomy.domain.investigation, before.domain.investigation);
    assert.deepEqual(afterEconomy.domain.evidence, before.domain.evidence);
    assert.deepEqual(afterEconomy.domain.entity, before.domain.entity);
    assert.deepEqual(afterEconomy.domain.character, before.domain.character);
    assert.deepEqual(afterEconomy.domain.relationships, before.domain.relationships);
    assert.deepEqual(afterEconomy.domain.dialogue, before.domain.dialogue);
    assert.deepEqual(afterEconomy.domain.terminal, before.domain.terminal);
    assert.deepEqual(afterEconomy.domain.database, before.domain.database);
    assert.deepEqual(afterEconomy.domain.hacking, before.domain.hacking);
    assert.deepEqual(afterEconomy.domain.access, before.domain.access);
    assert.deepEqual(afterEconomy.domain.progression, before.domain.progression);
    assert.deepEqual(afterEconomy.domain.narrative, before.domain.narrative);
    assert.deepEqual(afterEconomy.domain.reward, before.domain.reward);
    assert.deepEqual(afterEconomy.domain.ending, before.domain.ending);
});

test("full runtime integration keeps failed and completed quest lifecycle states mutually consistent", () => {
    const runtime = new GameRuntime();

    const failedQuest: Quest = {
        ...quest,
        id: asId("quest.full-validation.failed"),
    };

    runtime.quest.start(failedQuest);
    assert.equal(runtime.quest.fail(failedQuest), true);
    assert.equal(runtime.quest.isFailed(failedQuest), true);
    assert.equal(runtime.quest.isCompleted(failedQuest), false);
    assert.equal(runtime.quest.isActive(failedQuest), false);

    runtime.flagStore.set("final_condition", true);
    assert.equal(runtime.quest.complete(failedQuest), false);
    assert.equal(runtime.quest.isFailed(failedQuest), true);
    assert.equal(runtime.quest.isCompleted(failedQuest), false);
});
