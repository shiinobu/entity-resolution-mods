import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
    QuestService,
} from "../../src/application/index.js";

import {
    always,
    flagEquals,
} from "../../src/domain/shared/index.js";

import type {
    Quest,
} from "../../src/domain/quest/index.js";

import {
    DomainStateAccess,
    FlagStore,
    StateStore,
    createDefaultRuntimeState,
} from "../../src/state/index.js";

import {
    ConditionEvaluator,
} from "../../src/domain/shared/index.js";

const createFixture = () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const flagStore = new FlagStore(stateStore);
    const domainState = new DomainStateAccess(stateStore);
    const conditionEvaluator = new ConditionEvaluator(
        flagStore,
    );

    const service = new QuestService(
        domainState,
        conditionEvaluator,
    );

    return {
        stateStore,
        flagStore,
        domainState,
        service,
    };
};

const createQuest = (
    id = "quest-001" as Quest["id"],
): Quest => ({
    id,
    chapterId: "chapter-01",
    title: "Test Quest",
    description: "Test quest description.",
    objectives: [
        {
            id: "objective-001",
            description: "Always complete.",
            condition: always(),
        },
    ],
});

describe("QuestService", () => {
    it("starts a quest", () => {
        const {
            domainState,
            service,
        } = createFixture();

        const quest = createQuest();

        service.start(quest);

        assert.equal(
            domainState.get().quests.activeQuestId,
            quest.id,
        );
    });

    it("self-heals a stale activeQuestId instead of throwing (mods.reset doesn't clear this mod's custom save state)", () => {
        const {
            service,
        } = createFixture();

        const firstQuest = createQuest(
            "quest-001" as Quest["id"],
        );

        const secondQuest = createQuest(
            "quest-002" as Quest["id"],
        );

        service.start(firstQuest);
        service.start(secondQuest);

        assert.equal(service.isActive(firstQuest), false);
        assert.equal(service.isActive(secondQuest), true);
    });

    it("self-heals a stale completedQuestIds entry instead of throwing (mods.reset doesn't clear this mod's custom save state)", () => {
        const {
            domainState,
            service,
        } = createFixture();

        const quest = createQuest();

        service.start(quest);
        service.complete(quest);

        service.start(quest);

        assert.equal(service.isActive(quest), true);
        assert.equal(service.isCompleted(quest), false);
        assert.deepEqual(
            domainState.get().quests.completedQuestIds,
            [],
        );
    });

    it("self-heals a stale failedQuestIds entry instead of throwing", () => {
        const {
            domainState,
            service,
        } = createFixture();

        const quest = createQuest();

        service.start(quest);
        service.fail(quest);

        service.start(quest);

        assert.equal(service.isActive(quest), true);
        assert.equal(service.isFailed(quest), false);
        assert.deepEqual(
            domainState.get().quests.failedQuestIds,
            [],
        );
    });

    it("checks objective completion using ConditionEvaluator", () => {
        const {
            flagStore,
            service,
        } = createFixture();

        const quest: Quest = {
            ...createQuest(),
            objectives: [
                {
                    id: "objective-001",
                    description: "Requires flag.",
                    condition: flagEquals(
                        "quest.ready",
                        true,
                    ),
                },
            ],
        };

        assert.equal(
            service.areObjectivesComplete(quest),
            false,
        );

        flagStore.set("quest.ready", true);

        assert.equal(
            service.areObjectivesComplete(quest),
            true,
        );
    });

    it("completes an active quest when objectives are complete", () => {
        const {
            domainState,
            service,
        } = createFixture();

        const quest = createQuest();

        service.start(quest);

        const result = service.complete(quest);

        assert.equal(result, true);

        assert.equal(
            domainState.get().quests.activeQuestId,
            null,
        );

        assert.deepEqual(
            domainState.get().quests.completedQuestIds,
            [quest.id],
        );
    });

    it("does not complete an active quest when objectives are incomplete", () => {
        const {
            domainState,
            service,
        } = createFixture();

        const quest: Quest = {
            ...createQuest(),
            objectives: [
                {
                    id: "objective-001",
                    description: "Requires flag.",
                    condition: flagEquals(
                        "quest.ready",
                        true,
                    ),
                },
            ],
        };

        service.start(quest);

        const result = service.complete(quest);

        assert.equal(result, false);

        assert.equal(
            domainState.get().quests.activeQuestId,
            quest.id,
        );

        assert.deepEqual(
            domainState.get().quests.completedQuestIds,
            [],
        );
    });

    it("fails an active quest", () => {
        const {
            domainState,
            service,
        } = createFixture();

        const quest = createQuest();

        service.start(quest);

        const result = service.fail(quest);

        assert.equal(result, true);

        assert.equal(
            domainState.get().quests.activeQuestId,
            null,
        );

        assert.deepEqual(
            domainState.get().quests.failedQuestIds,
            [quest.id],
        );
    });

    it("reports quest lifecycle state", () => {
        const {
            service,
        } = createFixture();

        const quest = createQuest();

        assert.equal(
            service.isActive(quest),
            false,
        );

        assert.equal(
            service.isCompleted(quest),
            false,
        );

        assert.equal(
            service.isFailed(quest),
            false,
        );

        service.start(quest);

        assert.equal(
            service.isActive(quest),
            true,
        );

        service.complete(quest);

        assert.equal(
            service.isActive(quest),
            false,
        );

        assert.equal(
            service.isCompleted(quest),
            true,
        );
    });
});