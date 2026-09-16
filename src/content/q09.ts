// SKELETON — see docs/source-current.md. Mail, dialogue,
// HackhubPost, network fixtures NOT YET WRITTEN.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

// TODO: target/archive location not yet decided.

// Critical rule (carries into implementation): report/conclusion text must
// never state "no communication occurred" — only "the source cannot
// currently be supported by available records."

export const Q09_OBJECTIVE_IDS = {
    reviewRizkyCase: "q09.objective.01",
    interviewRizky: "q09.objective.02",
    inspectCriClassification: "q09.objective.03",
    verifyCom07: "q09.objective.04",
    checkSource: "q09.objective.04b", // optional
} as const;

export const Q09_OBJECTIVES = [
    { name: Q09_OBJECTIVE_IDS.reviewRizkyCase, description: "Review Rizky's case" }, // tool: sqlmap (native)
    {
        name: Q09_OBJECTIVE_IDS.interviewRizky,
        description: "Interview Rizky", // tool: none (Dialog)
        unlocksAfter: [Q09_OBJECTIVE_IDS.reviewRizkyCase],
    },
    {
        name: Q09_OBJECTIVE_IDS.inspectCriClassification,
        description: "Inspect his CRI classification", // tool: sqlmap (native)
        unlocksAfter: [Q09_OBJECTIVE_IDS.interviewRizky],
    },
    {
        name: Q09_OBJECTIVE_IDS.verifyCom07,
        description: "Verify COM-07-88421 against available phone records", // tool: sqlmap (native)
        unlocksAfter: [Q09_OBJECTIVE_IDS.inspectCriClassification],
    },
    {
        name: Q09_OBJECTIVE_IDS.checkSource,
        description: "Check source metadata", // tool: sqlmap (native)
        unlocksAfter: [Q09_OBJECTIVE_IDS.verifyCom07],
    },
];

export const Q09_REPLAY_OBJECTIVES = Q09_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP breakdown per the design doc, best-effort mapped to objectives (8 XP
// items against 5 objectives — not objective-keyed).
export const Q09_REWARDS = {
    interviewReview: 20, // reviewRizkyCase
    relationshipEvidence: 20, // interviewRizky
    classificationReview: 15, // inspectCriClassification
    manualClearance: 5, // inspectCriClassification
    compareSourceRecords: 20, // verifyCom07
    identifyMissingRecord: 15, // verifyCom07
    correctlyConcludeEvidenceInsufficient: 20, // verifyCom07 — largest line item, the epistemic lesson
    checkMetadata: 10, // checkSource
    money: 600,
} as const;

export const Q09_FINAL_STATE_FLAG = "entity_resolution.q09.completed";
export const Q09_RIZKY_INTERVIEWED_FLAG = "entity_resolution.q09.rizky_interviewed";
export const Q09_RIZKY_CASE_REVIEWED_FLAG = "entity_resolution.q09.rizky_case_reviewed";
export const Q09_SOURCE_CONFLICT_FOUND_FLAG = "entity_resolution.q09.source_conflict_found";
export const Q09_SOURCE_CHECKED_FLAG = "entity_resolution.q09.source_checked";
export const Q09_MANUAL_CLEARANCE_FOUND_FLAG = "entity_resolution.q09.manual_clearance_found";

// Campaign-wide flags: TODO (new, not yet in flags.ts) —
// rizky_false_connection_suspected, cri_data_integrity_questioned.

// No mail content found for Q09 in this pass — the source's "2. Opening"
// (marked LOCKED — FINAL v1.0) is a spoken Maya/player exchange with no
// Subject/mail framing at all, squarely Dialog territory. Q09 IS in the
// dialogue-extraction fork's scope (interviewRizky), so this is likely
// already covered there rather than a genuine gap — not duplicated here.
// No report-template, hold mail, completion mail, or HackhubPost teaser
// found either. TODO when Q09 becomes the active implementation target.

// Pulse — sourced from Phase 6 "Pulse — Integrated" §Q09. Maps onto native
// `Twotter` (see Q05_PULSE_POST_CONTENT's comment in q05.ts). Central lesson
// this quest reinforces: CORRELATION != PROOF — not every public post is
// CRI-caused, matching Q09's own "don't overclaim" critical rule above.
export const Q09_PULSE_POST_CONTENT = [
    "bank review",
    "access renewal delay",
    "additional verification",
].join("\n");

export const Q09_RIZKY_PRATAMA: Quest = {
    id: asId<"Quest">("entity_resolution.q09"),
    chapterId: "chapter-03-false-positive", // provisional, see design doc
    title: "RIZKY PRATAMA",
    description:
        "The player interviews Rizky directly — his cited evidence record cannot be found in available phone records.",
    objectives: [
        {
            id: "q09.runtime.completion",
            description: "Q09 canonical completion boundary.",
            condition: flagEquals(Q09_FINAL_STATE_FLAG, true),
        },
    ],
};
