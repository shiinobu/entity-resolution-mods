// SKELETON — see docs/phase13-q04-q16-design-recovered.md. Mail, dialogue,
// HackhubPost, network fixtures NOT YET WRITTEN.

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

// Quest-scoped state flags (see docs/phase13-q04-q16-design-recovered.md
// for the full list) — TODO: declare as needed during real implementation.

// No mail content found for Q16 in this pass — its "2. OPENING — THE LAST
// TRAIL" is a "Maya contacts the player through Relay" spoken exchange, not
// a one-directional mail message. Q16 IS in the dialogue-extraction fork's
// scope (confrontUnknown/obtainGovernanceAuthorization/makeFinalDecision),
// so likely already covered there. Victor's full name is confirmed here:
// "Victor Hale" — src/content/characters.ts still has him as surname
// unconfirmed, needs updating (same finding class as Daniel Ward from the
// filesystem fork). No report-template, hold mail, completion mail, or
// HackhubPost teaser found. TODO when Q16 becomes the active implementation
// target.

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
