import assert from "node:assert/strict";
import test from "node:test";

import {
    GameRuntime,
} from "../../src/application/index.js";

import type {
    Quest,
} from "../../src/domain/quest/index.js";

import type {
    Reward,
} from "../../src/domain/reward/index.js";

const createQuest = (): Quest => ({
    id: "quest-gameplay-001" as Quest["id"],
    chapterId: "chapter-01",
    title: "Recover the Signal",
    description: "Recover the missing signal evidence.",
    objectives: [
        {
            id: "objective-signal",
            description: "Recover the signal evidence.",
            condition: {
                kind: "flag",
                key: "gameplay.signalRecovered",
                equals: true,
            },
        },
    ],
});

const createReward = (): Reward => ({
    id: "reward-gameplay-001" as Reward["id"],
    kind: "experience",
    amount: 100,
});

test("gameplay flow blocks quest completion until the objective condition is satisfied", () => {
    const runtime = new GameRuntime();
    const quest = createQuest();

    runtime.quest.start(quest);

    assert.equal(
        runtime.quest.complete(quest),
        false,
    );

    assert.equal(
        runtime.quest.isActive(quest),
        true,
    );
    assert.equal(
        runtime.quest.isCompleted(quest),
        false,
    );

    runtime.flagStore.set(
        "gameplay.signalRecovered",
        true,
    );

    assert.equal(
        runtime.quest.complete(quest),
        true,
    );
    assert.equal(
        runtime.quest.isCompleted(quest),
        true,
    );
});

test("gameplay flow persists quest completion in canonical runtime state", () => {
    const runtime = new GameRuntime();
    const quest = createQuest();

    runtime.quest.start(quest);
    runtime.flagStore.set(
        "gameplay.signalRecovered",
        true,
    );
    runtime.quest.complete(quest);

    const state = runtime.stateStore.getState();

    assert.equal(
        state.domain.quests.activeQuestId,
        null,
    );
    assert.deepEqual(
        state.domain.quests.completedQuestIds,
        [quest.id],
    );
});

test("gameplay flow can claim a reward after quest completion", () => {
    const runtime = new GameRuntime();
    const quest = createQuest();
    const reward = createReward();

    runtime.quest.start(quest);
    runtime.flagStore.set(
        "gameplay.signalRecovered",
        true,
    );

    assert.equal(
        runtime.quest.complete(quest),
        true,
    );

    assert.equal(
        runtime.reward.claim(reward),
        true,
    );

    assert.equal(
        runtime.reward.hasClaimed(reward.id),
        true,
    );
    assert.equal(
        runtime.stateStore.getState()
            .domain.progression.experience,
        100,
    );
});

test("gameplay flow does not grant a reward when quest completion fails", () => {
    const runtime = new GameRuntime();
    const quest = createQuest();
    const reward = createReward();

    runtime.quest.start(quest);

    assert.equal(
        runtime.quest.complete(quest),
        false,
    );

    assert.equal(
        runtime.reward.hasClaimed(reward.id),
        false,
    );
    assert.equal(
        runtime.stateStore.getState()
            .domain.progression.experience,
        0,
    );
});

test("gameplay flow records quest failure without marking it completed", () => {
    const runtime = new GameRuntime();
    const quest = createQuest();

    runtime.quest.start(quest);

    assert.equal(
        runtime.quest.fail(quest),
        true,
    );

    assert.equal(
        runtime.quest.isActive(quest),
        false,
    );
    assert.equal(
        runtime.quest.isFailed(quest),
        true,
    );
    assert.equal(
        runtime.quest.isCompleted(quest),
        false,
    );

    assert.deepEqual(
        runtime.stateStore.getState()
            .domain.quests.failedQuestIds,
        [quest.id],
    );
});
