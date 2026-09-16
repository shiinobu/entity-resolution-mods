import assert from "node:assert/strict";
import test from "node:test";

import {
    GameRuntime,
} from "../../src/application/index.js";

import type {
    Quest,
} from "../../src/domain/quest/index.js";

test("GameRuntime creates canonical runtime state", () => {
    const runtime = new GameRuntime();

    assert.deepEqual(runtime.stateStore.getState().flags, {});
    assert.deepEqual(
        runtime.stateStore.getState().domain.quests,
        {
            activeQuestId: null,
            completedQuestIds: [],
            failedQuestIds: [],
        },
    );
});

test("GameRuntime wires FlagStore to the canonical StateStore", () => {
    const runtime = new GameRuntime();

    runtime.flagStore.set("test.flag", true);

    assert.equal(
        runtime.stateStore.getState().flags["test.flag"],
        true,
    );
});

test("GameRuntime exposes the canonical ConditionEvaluator", () => {
    const runtime = new GameRuntime();

    runtime.flagStore.set("test.flag", true);

    assert.equal(
        runtime.conditionEvaluator.evaluate({
            kind: "flag",
            key: "test.flag",
            equals: true,
        }),
        true,
    );
});

test("GameRuntime owns a functional NarrativeStateService", () => {
    const runtime = new GameRuntime();

    runtime.narrativeState.setChapter("chapter-01");
    runtime.narrativeState.setScene("scene-01");

    assert.deepEqual(
        runtime.narrativeState.getNarrativeState(),
        {
            chapterId: "chapter-01",
            sceneId: "scene-01",
            completedChapterIds: [],
        },
    );
});

test("NarrativeStateService persists through the canonical StateStore", () => {
    const runtime = new GameRuntime();

    runtime.narrativeState.setChapter("chapter-01");
    runtime.narrativeState.setScene("scene-01");

    const state = runtime.stateStore.getState();

    assert.equal(
        state.domain.narrative.chapterId,
        "chapter-01",
    );

    assert.equal(
        state.domain.narrative.sceneId,
        "scene-01",
    );
});

test("NarrativeStateService manages dialogue state", () => {
    const runtime = new GameRuntime();

    runtime.narrativeState.startDialogue(
        "dialogue-01",
        "node-01",
    );

    runtime.narrativeState.advanceDialogue(
        "node-02",
    );

    assert.deepEqual(
        runtime.narrativeState.getDialogueState(),
        {
            activeDialogueId: "dialogue-01",
            activeNodeId: "node-02",
            history: [
                {
                    dialogueId: "dialogue-01",
                    nodeId: "node-02",
                },
            ],
        },
    );

    runtime.narrativeState.endDialogue();

    assert.equal(
        runtime.narrativeState.getDialogueState()
            .activeDialogueId,
        null,
    );

    assert.equal(
        runtime.narrativeState.getDialogueState()
            .activeNodeId,
        null,
    );
});

test("NarrativeStateService tracks completed chapters", () => {
    const runtime = new GameRuntime();

    runtime.narrativeState.completeChapter(
        "chapter-01",
    );

    runtime.narrativeState.completeChapter(
        "chapter-01",
    );

    assert.deepEqual(
        runtime.narrativeState
            .getNarrativeState()
            .completedChapterIds,
        ["chapter-01"],
    );
});

test("GameRuntime owns a functional QuestService", () => {
    const runtime = new GameRuntime();

    const quest: Quest = {
        id: "quest-001" as Quest["id"],
        chapterId: "chapter-01",
        title: "Test Quest",
        description: "Test quest description.",
        objectives: [
            {
                id: "objective-001",
                description: "Complete objective.",
                condition: {
                    kind: "always",
                },
            },
        ],
    };

    runtime.quest.start(quest);

    assert.equal(
        runtime.quest.isActive(quest),
        true,
    );

    assert.equal(
        runtime.stateStore.getState()
            .domain.quests.activeQuestId,
        quest.id,
    );

    assert.equal(
        runtime.quest.complete(quest),
        true,
    );

    assert.equal(
        runtime.quest.isCompleted(quest),
        true,
    );

    assert.deepEqual(
        runtime.stateStore.getState()
            .domain.quests.completedQuestIds,
        [quest.id],
    );
});
