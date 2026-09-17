import type { Quest } from "../domain/quest/index.js";
import type { ConditionEvaluator } from "../domain/shared/index.js";
import type { DomainStateAccess } from "../state/index.js";

export class QuestService {
    constructor(
        private readonly domainState: DomainStateAccess,
        private readonly conditionEvaluator: ConditionEvaluator,
    ) {}

    start(quest: Quest): void {
        this.domainState.update((domain) => ({
            ...domain,
            quests: {
                ...domain.quests,
                activeQuestId: quest.id,
                completedQuestIds: domain.quests.completedQuestIds.filter(
                    (id) => id !== quest.id,
                ),
                failedQuestIds: domain.quests.failedQuestIds.filter(
                    (id) => id !== quest.id,
                ),
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
