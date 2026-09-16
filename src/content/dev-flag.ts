import type { QuestObjectiveDefinition } from "@hotbunny/hackhub-content-sdk";

// Single global switch between focused single-quest testing and real
// production behavior. Flip this by hand before building:
//
// - true:  QuestsToComplete and objective unlocksAfter gating are skipped,
//   and OnComplete's reward-granting (XP claims, Bank.transaction, money)
//   is skipped. Lets one quest be claimed, played, and replayed (via the
//   game's own `mods.reset`) in isolation, without the earlier quests in
//   the chain needing to exist or be imported in src/index.ts.
// - false: real production behavior — used for full-chapter sequential
//   validation (all of that chapter's quests imported and played in real
//   order) and for actual releases.
export const isDev = true;

// Drops unlocksAfter gating from a quest's objectives when isDev is on, so
// every objective shows/unlocks immediately. Production (isDev = false)
// keeps the gating as authored.
export const applyDevGating = (
    objectives: QuestObjectiveDefinition[],
): QuestObjectiveDefinition[] =>
    isDev
        ? objectives.map(({ unlocksAfter: _unlocksAfter, ...objective }) => objective)
        : objectives;
