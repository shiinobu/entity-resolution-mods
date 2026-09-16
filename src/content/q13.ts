// SKELETON — see docs/source-current.md. Mail, dialogue,
// HackhubPost, network fixtures NOT YET WRITTEN.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

export { Q13_ROOT_FILES } from "./q13-filesystem.js";

// TODO: target/archive location not yet decided.

export const Q13_OBJECTIVE_IDS = {
    searchOperationalAudit: "q13.objective.01",
    identifyPrivilegedIdentity: "q13.objective.02",
    traceActivity: "q13.objective.03",
    correlateOriginNetwork: "q13.objective.04",
    investigateFirstUse: "q13.objective.04b", // optional
} as const;

export const Q13_OBJECTIVES = [
    { name: Q13_OBJECTIVE_IDS.searchOperationalAudit, description: "Search the operational audit trail" }, // tool: sqlmap (native)
    {
        name: Q13_OBJECTIVE_IDS.identifyPrivilegedIdentity,
        description: "Identify the privileged OVERRIDE_OPERATOR identity", // tool: sqlmap (native)
        unlocksAfter: [Q13_OBJECTIVE_IDS.searchOperationalAudit],
    },
    {
        name: Q13_OBJECTIVE_IDS.traceActivity,
        description: "Trace its operational activity (POL-1847 deploy, the 08-18 CONFIGURATION_OVERRIDE)", // tool: sqlmap (native)
        unlocksAfter: [Q13_OBJECTIVE_IDS.identifyPrivilegedIdentity],
    },
    {
        name: Q13_OBJECTIVE_IDS.correlateOriginNetwork,
        description: "Correlate the session origin (10.42.7.31 -> ARKA Administrative Network)", // tool: whois (native)
        unlocksAfter: [Q13_OBJECTIVE_IDS.traceActivity],
    },
    {
        name: Q13_OBJECTIVE_IDS.investigateFirstUse,
        description: "Investigate first use / account origin", // tool: sqlmap (native)
        unlocksAfter: [Q13_OBJECTIVE_IDS.correlateOriginNetwork],
    },
];

export const Q13_REPLAY_OBJECTIVES = Q13_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP breakdown per the design doc, best-effort mapped to objectives (base 8
// items + 1 optional against 5 objectives — not objective-keyed). No XP for
// concluding Marcus is the operator — explicitly wrong at this stage.
// Money is base $700 + $100 optional per the source (not a flat total).
export const Q13_REWARDS = {
    locateAccount: 20, // searchOperationalAudit
    inspectMetadata: 15, // searchOperationalAudit
    confirmPrivilegedIdentity: 15, // identifyPrivilegedIdentity
    traceActivity: 20, // traceActivity
    linkToPolicy: 20, // traceActivity
    analyzeSessionA77402: 20, // traceActivity
    correlateOrigin: 15, // correlateOriginNetwork
    correctlyMaintainUnknownOperatorStatus: 10, // correlateOriginNetwork
    investigateFirstUse: 15, // investigateFirstUse (optional)
    moneyBase: 700,
    moneyOptional: 100,
} as const;

export const Q13_FINAL_STATE_FLAG = "entity_resolution.q13.completed";
export const Q13_OVERRIDE_ACCOUNT_FOUND_FLAG = "entity_resolution.q13.override_account_found";
export const Q13_OVERRIDE_ACCOUNT_ACTIVE_FLAG = "entity_resolution.q13.override_account_active";
export const Q13_POLICY_DEPLOYMENT_LINKED_FLAG = "entity_resolution.q13.policy_deployment_linked";
export const Q13_CONFIGURATION_ACTIVITY_FOUND_FLAG = "entity_resolution.q13.configuration_activity_found";
export const Q13_COM07_POLICY_ACTIVITY_FOUND_FLAG = "entity_resolution.q13.com07_policy_activity_found";
export const Q13_ARKA_NETWORK_ORIGIN_CONFIRMED_FLAG = "entity_resolution.q13.arka_network_origin_confirmed";
export const Q13_FIRST_USE_FOUND_FLAG = "entity_resolution.q13.first_use_found";
export const Q13_OVERRIDE_ACCOUNT_ORIGIN_FOUND_FLAG = "entity_resolution.q13.override_account_origin_found";
export const Q13_OVERRIDE_AUDIT_FOUND_FLAG = "entity_resolution.q13.override_audit_found";
export const Q13_OPERATOR_ACCOUNT_CONFIRMED_FLAG = "entity_resolution.q13.operator_account_confirmed";
export const Q13_OPERATOR_IDENTITY_UNKNOWN_FLAG = "entity_resolution.q13.operator_identity_unknown";

// CORRECTION (relay-extraction pass): Q13's "Opening" (marked "Relay —
// Maya" in the source, ~line 26473) is genuine Relay-system content — a
// distinct private-messaging system in the source's story bible, separate
// from the phone-call `Dialog` mechanic Q03 uses for the separate "Phone"
// system. No native Relay SDK primitive exists, so per this project's Q01
// precedent (Relay -> Mail substitution, see
// docs/implementation-rules.md §0 (Relay -> Mail substitution)), this is
// Mail-adjacent content, not Dialog territory. Sourced verbatim (only one
// draft pass found in this quest's range, no contradiction to resolve).
// TODO: exact delivery mechanism (one Mail.send per line vs. a single
// transcript-style mail) not yet decided.
export const Q13_RELAY_OPENING_CONTENT = [
    'Maya: "Daniel found another reference."',
    "",
    'Player: "To POL-1847?"',
    "",
    'Maya: "The deployment."',
    "",
    'Daniel: "The policy archive redacts the approval identity."',
    "",
    'Player: "But?"',
    "",
    'Daniel: "The operations audit doesn\'t."',
    "",
    'Player: "You can access it?"',
    "",
    'Daniel: "The archived portion."',
    "",
    'Daniel: "If it hasn\'t been purged."',
    "",
    'Maya: "Then that\'s where we look."',
].join("\n");

// No report-template, hold mail, or completion mail found. No HackhubPost
// teaser found. TODO when Q13 becomes the active implementation target.

export const Q13_THE_OPERATOR: Quest = {
    id: asId<"Quest">("entity_resolution.q13"),
    chapterId: "chapter-03-false-positive", // provisional, see design doc
    title: "THE OPERATOR",
    description:
        "Locates the privileged OVERRIDE_OPERATOR account and its activity log, without yet identifying who controls it.",
    objectives: [
        {
            id: "q13.runtime.completion",
            description: "Q13 canonical completion boundary.",
            condition: flagEquals(Q13_FINAL_STATE_FLAG, true),
        },
    ],
};
