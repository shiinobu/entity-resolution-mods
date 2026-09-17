import type { QuestObjectiveDefinition } from "@hotbunny/hackhub-content-sdk";

export const isDev = true;

export const DEV_FOCUS_QUEST = {
    q01: false,
    q02: false,
    q03: false,
    q04: false,
} as const;

const focusedCount = Object.values(DEV_FOCUS_QUEST).filter(Boolean).length;
if (focusedCount > 1) {
    throw new Error(
        `DEV_FOCUS_QUEST must have at most one quest set to true, found ${focusedCount}.`,
    );
}

export type QuestId = keyof typeof DEV_FOCUS_QUEST;

export const isQuestDevFocus = (questId: QuestId): boolean =>
    isDev && DEV_FOCUS_QUEST[questId];

const hasActiveFocus = isDev && Object.values(DEV_FOCUS_QUEST).some(Boolean);

export const DEV_ISOLATION_LOCK = "__dev_isolation_lock__";

export const questGate = (questId: QuestId, productionPrereqs: string[]): string[] => {
    if (isQuestDevFocus(questId)) {
        return [];
    }

    if (hasActiveFocus) {
        return [DEV_ISOLATION_LOCK];
    }

    return productionPrereqs;
};

export const applyDevGating = (
    objectives: QuestObjectiveDefinition[],
    isFocused: boolean,
): QuestObjectiveDefinition[] =>
    isFocused
        ? objectives.map(({ unlocksAfter: _unlocksAfter, ...objective }) => objective)
        : objectives;
