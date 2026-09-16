// Global, campaign-wide character-state flags — NOT scoped to any single
// quest (unlike e.g. Q02_FINAL_STATE_FLAG). Q03's recovered source proves
// `adrian_suspicious` and `adrian_warned_player` track Adrian's arc
// (Complicity → Responsibility) across the whole campaign, not a single
// quest's persistent state. First written by Q03 — see docs/source-current.md's
// Q02/Q03 "Changes from original source" tables for why these ended up
// global instead of quest-scoped — later quests may read or extend them.
export const ENTITY_RESOLUTION_FLAGS = {
    adrianSuspicious: "entity_resolution.adrian_suspicious",
    adrianWarnedPlayer: "entity_resolution.adrian_warned_player",
    // Declared, never written. The source is explicit that CRI must not be
    // unlocked as known terminology this early in the campaign — this
    // constant exists so a future quest that DOES unlock it has the
    // canonical name ready, not so Q03 (or any quest before the one that
    // actually reveals CRI) sets it.
    criKnown: "entity_resolution.cri_known",
} as const;
