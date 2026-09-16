// SKELETON — see docs/source-current.md. Mail, dialogue,
// HackhubPost, network fixtures NOT YET WRITTEN.
//
// UPDATED 2026-09-16 (Unknown-focused re-pass): the source has a full
// "Q16 v1.2" final-lock-candidate revision (superseding the "v1.1" the
// original dialogue-extraction pass condensed from) with 28 numbered
// scenes, a complete persistent-state list, and an explicit "not created"
// negative list — richer than what this file/q16-quest.ts's Dialog
// originally captured. Reconciled below; nothing here contradicts the
// original pass, it's additive/more-detailed.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

// TODO: target/archive location not yet decided.

export const Q16_OBJECTIVE_IDS = {
    traceArkaOps0441: "q16.objective.01",
    compareInterventionSessions: "q16.objective.02",
    findInternalConcern: "q16.objective.03",
    establishFirstIntervention: "q16.objective.04",
    reconstructInterventionPattern: "q16.objective.05",
    confrontUnknown: "q16.objective.06",
    evaluateFinalEvidence: "q16.objective.07",
    obtainGovernanceAuthorization: "q16.objective.08",
    makeFinalDecision: "q16.objective.09",
} as const;

// 9 mandatory objectives, no optional — the finale, every thread converges.
export const Q16_OBJECTIVES = [
    { name: Q16_OBJECTIVE_IDS.traceArkaOps0441, description: "Trace ARKA-OPS-0441" }, // tool: sqlmap (native)
    {
        name: Q16_OBJECTIVE_IDS.compareInterventionSessions,
        description: "Compare historical intervention sessions", // tool: sqlmap (native)
        unlocksAfter: [Q16_OBJECTIVE_IDS.traceArkaOps0441],
    },
    {
        name: Q16_OBJECTIVE_IDS.findInternalConcern,
        description: "Find the official internal concern (OPS-CONCERN-1847, closed with no action)", // tool: sqlmap (native)
        unlocksAfter: [Q16_OBJECTIVE_IDS.compareInterventionSessions],
    },
    {
        name: Q16_OBJECTIVE_IDS.establishFirstIntervention,
        description: "Establish the first unauthorized intervention", // tool: sqlmap (native)
        unlocksAfter: [Q16_OBJECTIVE_IDS.findInternalConcern],
    },
    {
        name: Q16_OBJECTIVE_IDS.reconstructInterventionPattern,
        description: "Reconstruct the full intervention pattern", // tool: interventiontrace (custom)
        unlocksAfter: [Q16_OBJECTIVE_IDS.establishFirstIntervention],
    },
    {
        name: Q16_OBJECTIVE_IDS.confrontUnknown,
        description: "Confront Unknown (reveals identity = ARKA-OPS-0441 / OVERRIDE_OPERATOR)", // tool: none (Dialog)
        unlocksAfter: [Q16_OBJECTIVE_IDS.reconstructInterventionPattern],
    },
    {
        name: Q16_OBJECTIVE_IDS.evaluateFinalEvidence,
        description: "Evaluate the final evidence package (OPS-REVIEW-0441)", // tool: cat/sqlmap (native)
        unlocksAfter: [Q16_OBJECTIVE_IDS.confrontUnknown],
    },
    {
        name: Q16_OBJECTIVE_IDS.obtainGovernanceAuthorization,
        description: "Obtain Victor's temporary emergency governance authorization", // tool: none (Dialog/Mail)
        unlocksAfter: [Q16_OBJECTIVE_IDS.evaluateFinalEvidence],
    },
    {
        name: Q16_OBJECTIVE_IDS.makeFinalDecision,
        description: "Choose the ending: DESTROY / EXPOSE / OVERRIDE", // tool: none (Dialog options)
        unlocksAfter: [Q16_OBJECTIVE_IDS.obtainGovernanceAuthorization],
    },
];

export const Q16_REPLAY_OBJECTIVES = Q16_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP breakdown per the design doc, best-effort mapped to objectives (11 XP
// items against 9 objectives — not objective-keyed). obtainGovernanceAuthorization
// has no distinct line item in the source; not silently invented here. No
// ending is weighted as more "correct" — all three score identically.
export const Q16_REWARDS = {
    traceArkaOps0441: 15, // traceArkaOps0441
    compareSessions: 15, // compareInterventionSessions
    findInternalConcern: 15, // findInternalConcern
    reconstructFirstIntervention: 15, // establishFirstIntervention
    reconstructPattern: 20, // reconstructInterventionPattern
    revealIdentity: 15, // confrontUnknown
    understandMotivation: 15, // confrontUnknown
    rizkyCriDistinction: 10, // evaluateFinalEvidence
    subject88172Uncertainty: 10, // evaluateFinalEvidence
    evaluateEvidence: 10, // evaluateFinalEvidence
    makeDecision: 10, // makeFinalDecision
    money: 1000,
} as const;

export const Q16_FINAL_STATE_FLAG = "entity_resolution.q16.completed";
export const Q16_ENDING_FLAG = "entity_resolution.ending"; // value: "DESTROY" | "EXPOSE" | "OVERRIDE"

// Full quest-scoped state flag list — sourced verbatim from the source's
// "28. FINAL QUEST STATES" (Q16 v1.2, the final-lock-candidate revision,
// source lines ~39652-39710). Supersedes the earlier "TODO: declare as
// needed" placeholder — this session's Unknown-focused re-pass found the
// complete list.
export const Q16_SESSION_PATTERN_FOUND_FLAG = "entity_resolution.q16.session_pattern_found"; // optional (compareInterventionSessions)
export const Q16_OPERATOR_IDENTITY_REVEALED_FLAG = "entity_resolution.q16.operator_identity_revealed";
export const Q16_OFFICIAL_CONCERN_FOUND_FLAG = "entity_resolution.q16.official_concern_found";
export const Q16_UNAUTHORIZED_INTERVENTION_CONFIRMED_FLAG = "entity_resolution.q16.unauthorized_intervention_confirmed";
export const Q16_INTERVENTION_HISTORY_FOUND_FLAG = "entity_resolution.q16.intervention_history_found";
export const Q16_INTERVENTION_SIDE_EFFECT_FOUND_FLAG = "entity_resolution.q16.intervention_side_effect_found";
export const Q16_UNKNOWN_MOTIVATION_UNDERSTOOD_FLAG = "entity_resolution.q16.unknown_motivation_understood";
export const Q16_UNKNOWN_COMPLICITY_CONFIRMED_FLAG = "entity_resolution.q16.unknown_complicity_confirmed";
export const Q16_UNKNOWN_RIZKY_TARGETING_FLAG = "entity_resolution.q16.unknown_rizky_targeting"; // always false — Unknown did NOT target Rizky
export const Q16_UNKNOWN_DIRECT_SCORE_EDIT_FLAG = "entity_resolution.q16.unknown_direct_score_edit"; // always false
export const Q16_SUBJECT_88172_IDENTITY_REVEALED_FLAG = "entity_resolution.q16.subject_88172_identity_revealed"; // always false — deliberately left unresolved
export const Q16_SUBJECT_88172_STATUS_CONFIRMED_FLAG = "entity_resolution.q16.subject_88172_status_confirmed"; // always false
export const Q16_FINAL_EVIDENCE_COMPLETE_FLAG = "entity_resolution.q16.final_evidence_complete";

// Campaign-wide flags this quest sets (TODO, not yet in flags.ts):
// unknown_identity_revealed, unknown_intervention_confirmed,
// unknown_intent_partially_understood, evidence_chain_complete (this last
// one was already noted as a Q15-set flag in content/q15.ts — the source
// sets it again at Q16's completion; same flag, not a conflict).

// Explicitly NEVER set by this quest (source's own "29. EXPLICITLY NOT
// CREATED" list) — do not invent these flags when Q16 is implemented:
// unknown_created_cri, unknown_created_rizky_connection,
// unknown_targeted_rizky, unknown_manipulated_rizky_score,
// unknown_created_subject_88172, subject_88172_guilty,
// subject_88172_innocent, marcus_operated_override,
// marcus_ordered_intervention, victor_operated_override,
// daniel_operated_override, arka_institutional_conspiracy_confirmed,
// cri_entirely_fake, player_owns_cri.

// OPS-CONCERN-1847 — the internal concern Unknown filed BEFORE going
// rogue (findInternalConcern objective), sourced verbatim. Establishes
// Unknown tried the official process first and it failed them, not that
// they immediately bypassed it.
export const Q16_OPS_CONCERN_1847_CONTENT = [
    "OPS-CONCERN-1847",
    "SUBJECT: Relationship acceptance behavior after policy transition",
    "",
    "OBSERVED:",
    "- automated relationship acceptance increased",
    "- manual review volume decreased",
    "- low-confidence relationships were being accepted from approved sources",
    "- downstream classification was affected",
    "",
    "STATUS: CLOSED — NO FURTHER ACTION",
    "CLOSURE REASON: Behavior consistent with approved policy configuration.",
    "SUBMITTED BY: ARKA-OPS-0441",
].join("\n");

// Relay — LOCKED source, "2. OPENING — THE LAST TRAIL" ("Maya contacts the
// player through Relay"). Relay is Mail-adjacent per this project's Q01
// precedent (see content/q14.ts's/q15.ts's own Relay comments) — NOT
// Dialog, even though it's a back-and-forth exchange.
export const Q16_RELAY_OPENING_CONTENT = [
    'Maya: "The operator reference is ARKA-OPS-0441."',
    "",
    'Player: "It\'s restricted."',
    "",
    'Maya: "Yes."',
    "",
    'Player: "Then how did you get it?"',
    "",
    'Maya: "I didn\'t."',
    "",
    'Maya: "You did."',
].join("\n");

// Relay — LOCKED source, "9. THE SECOND CONTACT" ("an encrypted Relay
// message arrives" from Unknown, after establishFirstIntervention /
// reconstructInterventionPattern). Also Mail-adjacent, not Dialog.
export const Q16_RELAY_SECOND_CONTACT_CONTENT = [
    'Unknown: "You found the first exception."',
    "",
    'Player: "You were watching."',
    "",
    'Unknown: "Yes."',
    "",
    'Player: "Why contact me now?"',
    "",
    'Unknown: "Because you already know enough to ask the right question."',
    "",
    'Player: "Which is?"',
    "",
    'Unknown: "Why I kept doing it."',
].join("\n");

// No mail (Email-system) content found for Q16 — only the two Relay
// exchanges above. No report-template, hold mail, completion mail, or
// HackhubPost teaser found. TODO when Q16 becomes the active
// implementation target.

// Pulse — sourced from Phase 6 "Pulse — Integrated" §Q16. Maps onto native
// `Twotter` (see Q05_PULSE_POST_CONTENT's comment in q05.ts). NOT used to
// determine the ending. Only relevant if the player picks EXPOSE: Maya may
// use it as a public communication channel / early public signal — never to
// leak raw CRI data.
export const Q16_PULSE_USED_FOR_ENDING = false;

export const Q16_THE_DECISION: Quest = {
    id: asId<"Quest">("entity_resolution.q16"),
    chapterId: "chapter-04-the-override", // provisional, see design doc
    title: "THE DECISION",
    description:
        "The finale — confronts Unknown (ARKA-OPS-0441), then the player chooses: DESTROY, EXPOSE, or OVERRIDE.",
    objectives: [
        {
            id: "q16.runtime.completion",
            description: "Q16 canonical completion boundary.",
            condition: flagEquals(Q16_FINAL_STATE_FLAG, true),
        },
    ],
};
