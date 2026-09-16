import test from "node:test";
import assert from "node:assert/strict";

import {
    asId,
} from "../../src/core/index.js";

import {
    flagEquals,
} from "../../src/domain/index.js";

import {
    createDefaultRuntimeState,
} from "../../src/state/index.js";

test(
    "Quest supports typed objectives using ConditionNode",
    () => {
        const quest = {
            id: asId<"Quest">("quest.test"),
            chapterId: "chapter.01",
            title: "Test Quest",
            description: "A test quest.",
            objectives: [
                {
                    id: "objective.signal",
                    description: "Detect the signal.",
                    condition: flagEquals(
                        "signal.detected",
                        true,
                    ),
                },
            ],
        };

        assert.equal(
            quest.id,
            "quest.test",
        );

        assert.equal(
            quest.objectives.length,
            1,
        );

        assert.deepEqual(
            quest.objectives[0]?.condition,
            {
                kind: "flag",
                key: "signal.detected",
                equals: true,
            },
        );
    },
);

test(
    "default runtime state contains an empty QuestState",
    () => {
        const state = createDefaultRuntimeState();

        assert.deepEqual(
            state.domain.quests,
            {
                activeQuestId: null,
                completedQuestIds: [],
                failedQuestIds: [],
            },
        );
    },
);

test(
    "QuestState is part of canonical DomainState",
    () => {
        const state = createDefaultRuntimeState();

        const questState = state.domain.quests;

        assert.equal(
            questState.activeQuestId,
            null,
        );

        assert.deepEqual(
            questState.completedQuestIds,
            [],
        );

        assert.deepEqual(
            questState.failedQuestIds,
            [],
        );
    },
);