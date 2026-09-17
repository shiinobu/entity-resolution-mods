import type { QuestObjectiveDefinition } from "@hotbunny/hackhub-content-sdk";

// Global switch between focused single-quest dev testing and real production
// behavior. Flip isDev by hand before building; DEV_FOCUS_QUEST picks which
// single quest (if any) actually gets the dev treatment when isDev is on —
// at most one entry may be true, enforced below.
//
// - isDev = true AND DEV_FOCUS_QUEST.qNN = true: that quest's
//   QuestsToComplete and objective unlocksAfter gating are skipped, and its
//   OnComplete reward-granting (XP claims, Bank.transaction, money) is
//   skipped. Lets that one quest be claimed, played, and replayed (via the
//   game's own `mods.reset`) in isolation.
// - Every other quest — its own DEV_FOCUS_QUEST entry is false, or isDev is
//   false — behaves with real production gating/rewards regardless of the
//   global isDev value. A FINAL LOCK quest chain (Q01-Q03) must stay false
//   here even while isDev is true for whatever quest is under active
//   development.
export const isDev = true;

export const DEV_FOCUS_QUEST = {
    q01: false,
    q02: false,
    q03: true,
} as const;

const focusedCount = Object.values(DEV_FOCUS_QUEST).filter(Boolean).length;
if (focusedCount > 1) {
    throw new Error(
        `DEV_FOCUS_QUEST must have at most one quest set to true, found ${focusedCount}.`,
    );
}

export type QuestId = keyof typeof DEV_FOCUS_QUEST;

// True only when isDev is on AND this specific quest is the current dev
// focus. Every qNN-quest.ts gates Objectives/OnComplete reward-granting off
// this, never off the bare `isDev` flag, so a FINAL LOCK quest can never be
// accidentally swept into dev mode by another quest's isDev flip.
export const isQuestDevFocus = (questId: QuestId): boolean =>
    isDev && DEV_FOCUS_QUEST[questId];

const hasActiveFocus = isDev && Object.values(DEV_FOCUS_QUEST).some(Boolean);

// A quest id that never exists, used to permanently fail a quest's
// QuestsToComplete check while another quest holds dev focus.
export const DEV_ISOLATION_LOCK = "__dev_isolation_lock__";

// The QuestsToComplete value for a quest, given its real production
// prerequisites:
// - this quest is the dev focus: no prerequisites, claim it immediately.
// - a DIFFERENT quest is the dev focus: locked behind DEV_ISOLATION_LOCK, so
//   this quest (even one like Q01 with no real prerequisite) stays fully
//   unavailable/unposted for true single-quest isolation.
// - no dev focus active (isDev off, or every DEV_FOCUS_QUEST entry false):
//   the real production prerequisites, unchanged.
export const questGate = (questId: QuestId, productionPrereqs: string[]): string[] => {
    if (isQuestDevFocus(questId)) {
        return [];
    }

    if (hasActiveFocus) {
        return [DEV_ISOLATION_LOCK];
    }

    return productionPrereqs;
};

// Drops unlocksAfter gating from a quest's objectives when that quest is the
// dev focus, so every objective shows/unlocks immediately. Any other quest
// keeps the gating as authored.
export const applyDevGating = (
    objectives: QuestObjectiveDefinition[],
    isFocused: boolean,
): QuestObjectiveDefinition[] =>
    isFocused
        ? objectives.map(({ unlocksAfter: _unlocksAfter, ...objective }) => objective)
        : objectives;
