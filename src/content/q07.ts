// SKELETON — see docs/source-current.md. Mail, dialogue,
// HackhubPost, network fixtures NOT YET WRITTEN.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

// TODO: target/archive location not yet decided.

export const Q07_OBJECTIVE_IDS = {
    inspectRelationshipData: "q07.objective.01",
    identifyAssociationWeighting: "q07.objective.02",
    compareSubjects: "q07.objective.03",
    mapNetwork: "q07.objective.03b", // optional
} as const;

export const Q07_OBJECTIVES = [
    { name: Q07_OBJECTIVE_IDS.inspectRelationshipData, description: "Inspect relationship data" }, // tool: sqlmap (native)
    {
        name: Q07_OBJECTIVE_IDS.identifyAssociationWeighting,
        description: "Identify the association_weight mechanism and how it contributes to risk", // tool: sqlmap (native)
        unlocksAfter: [Q07_OBJECTIVE_IDS.inspectRelationshipData],
    },
    {
        name: Q07_OBJECTIVE_IDS.compareSubjects,
        description: "Compare Rizky/Dimas/Naufal and trace the relationship network", // tool: sqlmap (native)
        unlocksAfter: [Q07_OBJECTIVE_IDS.identifyAssociationWeighting],
    },
    {
        name: Q07_OBJECTIVE_IDS.mapNetwork,
        description: "Map the network to find SUBJECT-88172", // tool: netgraph (custom)
        unlocksAfter: [Q07_OBJECTIVE_IDS.compareSubjects],
    },
];

export const Q07_REPLAY_OBJECTIVES = Q07_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP breakdown per the design doc, best-effort mapped to objectives (8 XP
// items against 4 objectives — not objective-keyed).
export const Q07_REWARDS = {
    relationshipModel: 20, // inspectRelationshipData
    understandMechanism: 20, // inspectRelationshipData
    associationWeightId: 15, // identifyAssociationWeighting
    riskContribution: 15, // identifyAssociationWeighting
    networkAnalysis: 20, // compareSubjects
    correctInterpretation: 10, // compareSubjects
    mapGraph: 15, // mapNetwork
    restrictedSubject: 5, // mapNetwork
    money: 500,
} as const;

export const Q07_FINAL_STATE_FLAG = "entity_resolution.q07.completed";
export const Q07_RELATIONSHIP_SYSTEM_FOUND_FLAG = "entity_resolution.q07.relationship_system_found";
export const Q07_ASSOCIATION_WEIGHT_FOUND_FLAG = "entity_resolution.q07.association_weight_found";
export const Q07_RISK_CONTRIBUTION_FOUND_FLAG = "entity_resolution.q07.risk_contribution_found";
export const Q07_NETWORK_MAPPED_FLAG = "entity_resolution.q07.network_mapped";
export const Q07_RESTRICTED_SUBJECT_FOUND_FLAG = "entity_resolution.q07.restricted_subject_found";

// Campaign-wide flags: TODO (new, not yet in flags.ts) — daniel_introduced,
// daniel_pipeline_confirmed, daniel_trust, adrian_knows_network_analysis,
// adrian_complicity_increased, maya_player_record_found, cri_uses_relationships.

// Mail content — sourced from Q07's design-doc "1. Opening" subsection.
// Sent by Maya (not Adrian) continuing directly from Q06's ending line.
// Confirms Daniel's surname is "Ward" (matches the filesystem fork's finding
// from Q11 — src/content/characters.ts still needs updating).
export const Q07_INCOMING_MAIL_SUBJECT = "Three names";
export const Q07_INCOMING_MAIL_CONTENT = [
    "I think they're being evaluated by who they're connected to.",
    "",
    "Not enough evidence yet. But I found three people.",
    "",
    "NAME              CITY        STATUS",
    "Rizky Pratama     Jakarta     Financial review",
    "Dimas Saputra     Bandung     Access suspended",
    "Naufal Ramadhan   Yogyakarta  Account review",
    "",
    "They don't know each other directly. Different jobs, no criminal",
    "record — but a similar classification pattern.",
    "",
    "I need to know what connects them.",
    "",
    "— Maya",
].join("\n");

// Relationship-graph data (Rizky/Dimas/Naufal weak-tie structure via
// EVENT_ATTENDEE/COMMUNICATION/ORGANIZATION edges, per the source's "3. Why
// Are They Connected?" section) is sqlmap/netgraph fixture data, not mail —
// out of this pass's scope. Flagging for whoever implements the `netgraph`
// custom command or a future Q07 filesystem/fixture pass.
//
// No report-template, hold mail, completion mail, or HackhubPost teaser
// found in this pass for Q07 — TODO when Q07 becomes the active
// implementation target.

export const Q07_CONNECTIONS: Quest = {
    id: asId<"Quest">("entity_resolution.q07"),
    chapterId: "chapter-02-the-list", // provisional, see design doc
    title: "CONNECTIONS",
    description:
        "Establishes the association-weighting mechanism CRI uses to compute risk. Introduces Daniel.",
    objectives: [
        {
            id: "q07.runtime.completion",
            description: "Q07 canonical completion boundary.",
            condition: flagEquals(Q07_FINAL_STATE_FLAG, true),
        },
    ],
};
