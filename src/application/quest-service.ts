import type { Quest } from "../domain/quest/index.js";
import type { ConditionEvaluator } from "../domain/shared/index.js";
import type { DomainStateAccess } from "../state/index.js";

export class QuestService {
    constructor(
        private readonly domainState: DomainStateAccess,
        private readonly conditionEvaluator: ConditionEvaluator,
    ) {}

    start(quest: Quest): void {
        const state = this.domainState.get().quests;

        if (state.completedQuestIds.includes(quest.id)) {
            throw new Error(
                `Cannot start quest "${quest.id}": quest is already completed.`,
            );
        }

        if (state.failedQuestIds.includes(quest.id)) {
            throw new Error(
                `Cannot start quest "${quest.id}": quest has already failed.`,
            );
        }

        this.domainState.update((domain) => ({
            ...domain,
            quests: {
                ...domain.quests,
                activeQuestId: quest.id,
            },
        }));
    }

    complete(quest: Quest): boolean {
        const state = this.domainState.get().quests;

        if (state.activeQuestId !== quest.id) {
            return false;
        }

        if (!this.areObjectivesComplete(quest)) {
            return false;
        }

        this.domainState.update((domain) => ({
            ...domain,
            quests: {
                ...domain.quests,
                activeQuestId: null,
                completedQuestIds: [
                    ...domain.quests.completedQuestIds,
                    quest.id,
                ],
            },
        }));

        return true;
    }

    fail(quest: Quest): boolean {
        const state = this.domainState.get().quests;

        if (state.activeQuestId !== quest.id) {
            return false;
        }

        this.domainState.update((domain) => ({
            ...domain,
            quests: {
                ...domain.quests,
                activeQuestId: null,
                failedQuestIds: [
                    ...domain.quests.failedQuestIds,
                    quest.id,
                ],
            },
        }));

        return true;
    }

    isActive(quest: Quest): boolean {
        return this.domainState.get().quests.activeQuestId === quest.id;
    }

    isCompleted(quest: Quest): boolean {
        return this.domainState
            .get()
            .quests
            .completedQuestIds
            .includes(quest.id);
    }

    isFailed(quest: Quest): boolean {
        return this.domainState
            .get()
            .quests
            .failedQuestIds
            .includes(quest.id);
    }

    areObjectivesComplete(quest: Quest): boolean {
        return quest.objectives
            .filter((objective) => !objective.optional)
            .every((objective) =>
                this.conditionEvaluator.evaluate(
                    objective.condition,
                ),
            );
    }
}
