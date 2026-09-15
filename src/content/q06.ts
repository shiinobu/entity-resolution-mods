// SKELETON — see docs/phase13-q04-q16-design-recovered.md. Mail, dialogue,
// HackhubPost, network fixtures NOT YET WRITTEN.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

export { Q06_ROOT_FILES } from "./q06-filesystem.js";

// TODO: target/archive location not yet decided.

export const Q06_OBJECTIVE_IDS = {
    inspectDatabase: "q06.objective.01",
    identifySystemMetadata: "q06.objective.02",
    inspectDataSources: "q06.objective.03",
    investigateRizky: "q06.objective.04",
    checkModel: "q06.objective.04b", // optional
    traceRecord: "q06.objective.04c", // optional
} as const;

export const Q06_OBJECTIVES = [
    {
        name: Q06_OBJECTIVE_IDS.inspectDatabase,
        description: "Inspect the classification snapshot database", // tool: sqlmap (native)
    },
    {
        name: Q06_OBJECTIVE_IDS.identifySystemMetadata,
        description: "Identify system metadata (confirms Civic Risk Index / CRI)", // tool: sqlmap (native)
        unlocksAfter: [Q06_OBJECTIVE_IDS.inspectDatabase],
    },
    {
        name: Q06_OBJECTIVE_IDS.inspectDataSources,
        description: "Inspect data sources", // tool: sqlmap (native)
        unlocksAfter: [Q06_OBJECTIVE_IDS.identifySystemMetadata],
    },
    {
        name: Q06_OBJECTIVE_IDS.investigateRizky,
        description: "Find Rizky's record and inspect his classification", // tool: sqlmap (native)
        unlocksAfter: [Q06_OBJECTIVE_IDS.inspectDataSources],
    },
    {
        name: Q06_OBJECTIVE_IDS.checkModel,
        description: "Check the CRI-Core model version", // tool: sqlmap (native)
        unlocksAfter: [Q06_OBJECTIVE_IDS.investigateRizky],
    },
    {
        name: Q06_OBJECTIVE_IDS.traceRecord,
        description: "Trace Rizky's score history", // tool: sqlmap (native)
        unlocksAfter: [Q06_OBJECTIVE_IDS.investigateRizky],
    },
];

export const Q06_REPLAY_OBJECTIVES = Q06_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP breakdown per the design doc, best-effort mapped to objectives (8 XP
// items against 6 objectives — not objective-keyed).
export const Q06_REWARDS = {
    locateArchive: 20, // inspectDatabase
    inspectSchema: 20, // inspectDatabase
    criDefinition: 15, // identifySystemMetadata
    dataSources: 15, // inspectDataSources
    investigateRizky: 20, // investigateRizky
    confidenceHistoryAnalysis: 10, // investigateRizky
    modelMetadata: 10, // checkModel
    traceHistory: 10, // traceRecord
    money: 450,
} as const;

export const Q06_FINAL_STATE_FLAG = "entity_resolution.q06.completed";
export const Q06_CRI_DATABASE_FOUND_FLAG = "entity_resolution.q06.cri_database_found";
export const Q06_CRI_DEFINITION_FOUND_FLAG = "entity_resolution.q06.cri_definition_found";
export const Q06_MODEL_METADATA_FOUND_FLAG = "entity_resolution.q06.model_metadata_found";
export const Q06_DATA_SOURCES_FOUND_FLAG = "entity_resolution.q06.data_sources_found";
export const Q06_RIZKY_FOUND_FLAG = "entity_resolution.q06.rizky_found";
export const Q06_RIZKY_HIGH_RISK_FLAG = "entity_resolution.q06.rizky_high_risk";
export const Q06_RIZKY_LOW_CONFIDENCE_FLAG = "entity_resolution.q06.rizky_low_confidence";
export const Q06_RIZKY_HISTORY_FOUND_FLAG = "entity_resolution.q06.rizky_history_found";
export const Q06_RIZKY_SCORE_JUMP_FOUND_FLAG = "entity_resolution.q06.rizky_score_jump_found";
export const Q06_MAYA_CONTACT_ESTABLISHED_FLAG = "entity_resolution.q06.maya_contact_established";
export const Q06_MAYA_TRUST_INCREASED_FLAG = "entity_resolution.q06.maya_trust_increased";

// TODO (OnComplete): set ENTITY_RESOLUTION_FLAGS.criKnown = true
// (src/content/flags.ts) — first quest where CRI stops being a mystery term.

// Mail content — sourced from Q06's design-doc consistency-audit section
// ("1. Continuity dari Q05" -> "Adjustment"/"Final"). Adrian's opening
// explains the database as a found artifact (a diagnostic archive), not
// deliberate CRI access — this framing is explicit in the source as a fix
// for an earlier, less believable draft.
export const Q06_INCOMING_MAIL_SUBJECT = "Found something";
export const Q06_INCOMING_MAIL_CONTENT = [
    "I found an old diagnostic archive from an ARKA deployment.",
    "",
    "Most of it is useless infrastructure data.",
    "",
    "One database shouldn't be there.",
    "",
    "— Adrian",
].join("\n");

// No report-template/dual-path pattern, hold mail, completion mail, or
// HackhubPost teaser found in this pass for Q06 — the source's Q06 section
// is dominated by design-rationale commentary (consistency-audit notes on
// CRI reveal pacing, database sanitization) rather than further literal
// mail text. TODO when Q06 becomes the active implementation target.

// Pulse — sourced from Phase 6 "Pulse — Integrated" §Q06. Maps onto native
// `Twotter` (see Q05_PULSE_POST_CONTENT's comment in q05.ts for the SDK-
// mapping rationale). Search results deliberately never say "CRI classified
// me as HIGH" (CRI isn't public-facing) — function is corroborating human
// consequences only, never proof.
export const Q06_PULSE_SEARCH_TERMS = ["account review", "access suspended", "additional verification"] as const;
export const Q06_PULSE_RESULT_CONTENT = "multiple unrelated users";

export const Q06_THE_DATABASE: Quest = {
    id: asId<"Quest">("entity_resolution.q06"),
    chapterId: "chapter-02-the-list", // provisional, see design doc
    title: "THE DATABASE",
    description:
        "A diagnostic archive first names the Civic Risk Index and introduces Rizky Pratama's HIGH-risk record.",
    objectives: [
        {
            id: "q06.runtime.completion",
            description: "Q06 canonical completion boundary.",
            condition: flagEquals(Q06_FINAL_STATE_FLAG, true),
        },
    ],
};
