// SKELETON — see docs/phase13-q04-q16-design-recovered.md. Mail, dialogue,
// HackhubPost, network fixtures NOT YET WRITTEN.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

// TODO: target/archive location not yet decided.

export const Q08_OBJECTIVE_IDS = {
    locatePlayerRecord: "q08.objective.01",
    inspectPlayerClassification: "q08.objective.02",
    inspectPlayerRelationship: "q08.objective.03",
    identifyRestrictedSubject: "q08.objective.03b", // optional
} as const;

export const Q08_OBJECTIVES = [
    { name: Q08_OBJECTIVE_IDS.locatePlayerRecord, description: "Locate the player's own CRI record" }, // tool: sqlmap (native)
    {
        name: Q08_OBJECTIVE_IDS.inspectPlayerClassification,
        description: "Inspect the classification (LOW/18/0.94/MANUAL, ENTITY_ASSOCIATION)", // tool: sqlmap (native)
        unlocksAfter: [Q08_OBJECTIVE_IDS.locatePlayerRecord],
    },
    {
        name: Q08_OBJECTIVE_IDS.inspectPlayerRelationship,
        description: "Inspect the relationship: player -> SUBJECT-88172", // tool: sqlmap (native)
        unlocksAfter: [Q08_OBJECTIVE_IDS.inspectPlayerClassification],
    },
    {
        name: Q08_OBJECTIVE_IDS.identifyRestrictedSubject,
        description: "Identify the entity-match detail (PROBABILISTIC, confidence 0.67)", // tool: sqlmap (native)
        unlocksAfter: [Q08_OBJECTIVE_IDS.inspectPlayerRelationship],
    },
];

export const Q08_REPLAY_OBJECTIVES = Q08_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP breakdown per the design doc, best-effort mapped to objectives (9 XP
// items against 4 objectives — not objective-keyed).
export const Q08_REWARDS = {
    findRecord: 20, // locatePlayerRecord
    classificationAnalysis: 15, // inspectPlayerClassification
    manualReviewId: 15, // inspectPlayerClassification
    traceRelationship: 15, // inspectPlayerRelationship
    identifySubject88172: 10, // inspectPlayerRelationship
    correlatePlayerRizky: 10, // inspectPlayerRelationship
    entityResolutionInvestigation: 15, // identifyRestrictedSubject
    lowMatchConfidence: 10, // identifyRestrictedSubject
    recognizeEntityResolutionConcern: 10, // identifyRestrictedSubject
    money: 550,
} as const;

export const Q08_FINAL_STATE_FLAG = "entity_resolution.q08.completed";
export const Q08_PLAYER_RECORD_FOUND_FLAG = "entity_resolution.q08.player_record_found";
export const Q08_PLAYER_RECORD_ACTIVE_FLAG = "entity_resolution.q08.player_record_active";
export const Q08_PLAYER_RISK_LEVEL_FLAG = "entity_resolution.q08.player_risk_level"; // value: "LOW"
export const Q08_PLAYER_MANUAL_REVIEW_FLAG = "entity_resolution.q08.player_manual_review";
export const Q08_PLAYER_REVIEW_REASON_FLAG = "entity_resolution.q08.player_review_reason"; // value: "ENTITY_ASSOCIATION"
export const Q08_RESTRICTED_SUBJECT_LINKED_FLAG = "entity_resolution.q08.restricted_subject_linked";
export const Q08_ENTITY_MATCH_CHECKED_FLAG = "entity_resolution.q08.entity_match_checked";
export const Q08_LOW_MATCH_CONFIDENCE_FOUND_FLAG = "entity_resolution.q08.low_match_confidence_found";
export const Q08_PLAYER_LINKED_TO_SUBJECT_FLAG = "entity_resolution.q08.player_linked_to_subject";
export const Q08_RIZKY_LINKED_TO_SUBJECT_FLAG = "entity_resolution.q08.rizky_linked_to_subject";

// Campaign-wide flags: TODO (new, not yet in flags.ts) —
// daniel_entity_resolution_concern, player_in_cri.
// maya_player_record_found is reused from Q07 (see content/q07.ts).

// Mail content — sourced from Q08's design-doc "1. Opening" subsection.
// Source: "Maya mengirim lokasi pertemuan melalui Relay" — per this
// project's own established precedent (Q01's "Relay" substitution, see
// docs/phase13-sequential-campaign-lock.md "Q01 Runtime Notes": the SDK has
// no native Relay API, so this narrative beat is implemented through the
// existing Mail channel), treated as Mail here too, not a new mechanism.
export const Q08_INCOMING_MAIL_SUBJECT = "Your name";
export const Q08_INCOMING_MAIL_CONTENT = [
    "I found something with your name on it.",
    "",
    "I think it's your record.",
    "",
    "We should talk.",
    "",
    "— Maya",
].join("\n");

// CORRECTION (relay-extraction pass): the "Meet Maya" opening exchange is
// explicitly framed as Relay content in the source ("Maya mengirim lokasi
// pertemuan melalui Relay" — Relay is a distinct private-messaging system,
// separate from the phone-call `Dialog` mechanic Q03 uses for its own
// separate "Phone" system). No native Relay SDK primitive exists, so per
// this project's Q01 precedent (Relay -> Mail substitution, see
// docs/phase13-sequential-campaign-lock.md "Q01 Runtime Notes"), this is
// Mail-adjacent content. Sourced verbatim from the source's fuller/later
// pass (~line 14550, which extends an earlier shorter draft at ~14179 with
// the "We should talk." close) — used here as the more complete version.
export const Q08_RELAY_MEET_MAYA_CONTENT = [
    "Maya: I found something with your name on it.",
    "",
    "Player: My record?",
    "",
    "Maya: I think so.",
    "",
    "Maya: We should talk.",
].join("\n");

// No report-template, hold mail, completion mail, or HackhubPost teaser
// found in this pass for Q08 — TODO when Q08 becomes the active
// implementation target.

export const Q08_YOUR_NAME: Quest = {
    id: asId<"Quest">("entity_resolution.q08"),
    chapterId: "chapter-02-the-list", // provisional, see design doc
    title: "YOUR NAME",
    description:
        "The player finds their own CRI record and discovers a low-confidence link to Rizky's subject.",
    objectives: [
        {
            id: "q08.runtime.completion",
            description: "Q08 canonical completion boundary.",
            condition: flagEquals(Q08_FINAL_STATE_FLAG, true),
        },
    ],
};
