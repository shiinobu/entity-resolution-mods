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
    type Ending,
} from "../../src/domain/ending/index.js";
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

const quest: Quest = {
    id: asId("quest.integration"),
    chapterId: "01",
    title: "Integration Quest",
    description: "Exercise the canonical runtime state across services.",
    objectives: [
        {
            id: "objective.integration",
            description: "Start the mission.",
            condition: flagEquals("mission_started", true),
        },
    ],
};

const actorId: CharacterId = asId("character.marcus");

test("GameRuntime integrates quest, access, reward, economy, and persistence through canonical state", () => {
    const storage = new SharedSaveStorage();
    const first = new GameRuntime(undefined, undefined, storage);

    first.flagStore.set("mission_started", true);
    first.quest.start(quest);
    assert.equal(first.quest.complete(quest), true);

    first.reward.claim({
        id: asId("reward.integration"),
        kind: "experience",
        amount: 100,
    });

    first.economy.applyMissionReward(
        {
            id: asId("mission-reward.integration"),
            questId: quest.id,
            amount: 500,
            rewardIndex: 0,
        },
        "completion.integration",
        "2026-09-11T00:00:00.000Z",
    );

    first.access.grant({
        id: asId("access.integration"),
        actorId,
        capability: "OVERRIDE_OPERATOR",
    });

    assert.equal(first.persistence.save().state.flags.mission_started, true);
    assert.equal(first.economy.getBalance(), 500);
    assert.equal(first.reward.hasClaimed(asId("reward.integration")), true);
    assert.equal(first.access.hasCapability(actorId, "OVERRIDE_OPERATOR"), true);

    const second = new GameRuntime(undefined, undefined, storage);

    assert.notEqual(second.stateStore.getState(), first.stateStore.getState());
    assert.equal(second.persistence.load(), true);

    assert.deepEqual(second.stateStore.getState(), first.stateStore.getState());
    assert.equal(second.quest.isCompleted(quest), true);
    assert.equal(second.economy.getBalance(), 500);
    assert.equal(second.reward.hasClaimed(asId("reward.integration")), true);
    assert.equal(second.access.hasCapability(actorId, "OVERRIDE_OPERATOR"), true);
    assert.equal(second.flagStore.get("mission_started"), true);
});

test("failed quest remains failed after save and load and cannot complete later", () => {
    const storage = new SharedSaveStorage();
    const first = new GameRuntime(undefined, undefined, storage);

    first.quest.start(quest);
    assert.equal(first.quest.fail(quest), true);
    first.persistence.save();

    const second = new GameRuntime(undefined, undefined, storage);
    assert.equal(second.persistence.load(), true);

    assert.equal(second.quest.isFailed(quest), true);
    assert.equal(second.quest.isActive(quest), false);
    assert.equal(second.quest.complete(quest), false);
});

test("cross-service updates preserve sibling state in the canonical StateStore", () => {
    const runtime = new GameRuntime();
    const ending: Ending = {
        id: "ending.cross-service",
        condition: flagEquals("ending_ready", true),
    };

    runtime.flagStore.set("mission_started", true);
    runtime.quest.start(quest);
    runtime.narrativeState.setChapter("01");
    runtime.narrativeState.setScene("investigation");
    runtime.narrativeState.startDialogue("dialogue.integration", "node.start");
    runtime.narrativeState.advanceDialogue("node.clue");

    runtime.reward.claim({
        id: asId("reward.cross-service"),
        kind: "experience",
        amount: 75,
    });
    runtime.economy.credit(
        300,
        "BONUS",
        "cross-service",
        "2026-09-11T00:00:00.000Z",
    );
    runtime.access.grant({
        id: asId("access.cross-service"),
        actorId,
        capability: "OVERRIDE_OPERATOR",
    });

    assert.equal(runtime.quest.isActive(quest), true);
    assert.equal(runtime.flagStore.get("mission_started"), true);
    assert.equal(runtime.narrativeState.getNarrativeState().chapterId, "01");
    assert.equal(runtime.narrativeState.getNarrativeState().sceneId, "investigation");
    assert.equal(runtime.narrativeState.getDialogueState().activeDialogueId, "dialogue.integration");
    assert.equal(runtime.reward.hasClaimed(asId("reward.cross-service")), true);
    assert.equal(runtime.economy.getBalance(), 300);
    assert.equal(runtime.access.hasCapability(actorId, "OVERRIDE_OPERATOR"), true);

    runtime.flagStore.set("ending_ready", true);
    assert.equal(runtime.ending.resolve([ending]), "ending.cross-service");

    const state = runtime.stateStore.getState();
    assert.equal(state.flags.mission_started, true);
    assert.equal(state.flags.ending_ready, true);
    assert.equal(state.domain.quests.activeQuestId, quest.id);
    assert.equal(state.domain.narrative.chapterId, "01");
    assert.equal(state.domain.narrative.sceneId, "investigation");
    assert.equal(state.domain.dialogue.activeNodeId, "node.clue");
    assert.equal(state.domain.progression.experience, 75);
    assert.equal(state.domain.economy.balance, 300);

    const accessGrant = state.domain.access.grants["access.cross-service"];
    assert.ok(accessGrant);
    assert.equal(accessGrant.actorId, actorId);

    assert.equal(state.domain.ending.endingId, "ending.cross-service");
    assert.equal(state.domain.ending.resolved, true);
});

test("cross-service canonical state survives persistence without replaying service operations", () => {
    const storage = new SharedSaveStorage();
    const first = new GameRuntime(undefined, undefined, storage);

    first.flagStore.set("mission_started", true);
    first.quest.start(quest);
    first.narrativeState.setChapter("01");
    first.reward.claim({
        id: asId("reward.replay"),
        kind: "experience",
        amount: 50,
    });
    first.economy.applyMissionReward(
        {
            id: asId("mission-reward.replay"),
            questId: quest.id,
            amount: 400,
            rewardIndex: 0,
        },
        "completion.replay",
        "2026-09-11T00:00:00.000Z",
    );

    const savedState = first.stateStore.getState();
    first.persistence.save();

    const second = new GameRuntime(undefined, undefined, storage);
    assert.equal(second.persistence.load(), true);

    assert.deepEqual(second.stateStore.getState(), savedState);
    assert.equal(second.economy.getBalance(), 400);
    assert.equal(second.economy.getTransactions().length, 1);
    assert.equal(second.reward.hasClaimed(asId("reward.replay")), true);
    assert.equal(second.quest.isActive(quest), true);
    assert.equal(second.flagStore.get("mission_started"), true);
});
