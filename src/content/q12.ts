// SKELETON — see docs/phase13-q04-q16-design-recovered.md. Mail, dialogue,
// HackhubPost, network fixtures NOT YET WRITTEN.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

export { Q12_ROOT_FILES } from "./q12-filesystem.js";

// TODO: target/archive location not yet decided.

export const Q12_OBJECTIVE_IDS = {
    inspectPolicyHistory: "q12.objective.01",
    compareConfigurations: "q12.objective.02",
    identifyReviewBehaviorChange: "q12.objective.03",
    determineCom07Behavior: "q12.objective.04",
    checkChangeHistory: "q12.objective.04b", // optional
} as const;

export const Q12_OBJECTIVES = [
    { name: Q12_OBJECTIVE_IDS.inspectPolicyHistory, description: "Inspect policy history (POL-1847)" }, // tool: sqlmap (native)
    {
        name: Q12_OBJECTIVE_IDS.compareConfigurations,
        description: "Compare legacy vs. current configuration", // tool: sqlmap (native)
        unlocksAfter: [Q12_OBJECTIVE_IDS.inspectPolicyHistory],
    },
    {
        name: Q12_OBJECTIVE_IDS.identifyReviewBehaviorChange,
        description: "Identify the changed review behavior (REQUIRED -> CONDITIONAL, bypass enabled)", // tool: sqlmap (native)
        unlocksAfter: [Q12_OBJECTIVE_IDS.compareConfigurations],
    },
    {
        name: Q12_OBJECTIVE_IDS.determineCom07Behavior,
        description: "Determine how COM-07 sources are processed under the new policy", // tool: sqlmap (native)
        unlocksAfter: [Q12_OBJECTIVE_IDS.identifyReviewBehaviorChange],
    },
    {
        name: Q12_OBJECTIVE_IDS.checkChangeHistory,
        description: "Check the policy's change history for the approval trail", // tool: sqlmap (native)
        unlocksAfter: [Q12_OBJECTIVE_IDS.determineCom07Behavior],
    },
];

export const Q12_REPLAY_OBJECTIVES = Q12_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP breakdown per the design doc, best-effort mapped to objectives (base 8
// items + 1 optional item against 5 objectives — not objective-keyed).
// Money is base $650 + $50 optional per the source (not a flat total).
export const Q12_REWARDS = {
    locateArchive: 15, // inspectPolicyHistory
    identifyPol1847: 10, // inspectPolicyHistory
    comparePolicy: 25, // compareConfigurations
    deploymentDate: 5, // compareConfigurations
    conditionalReview: 20, // identifyReviewBehaviorChange
    correctInterpretation: 10, // identifyReviewBehaviorChange
    approvedSourceBypass: 20, // determineCom07Behavior
    traceCom07: 15, // determineCom07Behavior
    checkChangeHistory: 20, // checkChangeHistory (optional)
    moneyBase: 650,
    moneyOptional: 50,
} as const;

export const Q12_FINAL_STATE_FLAG = "entity_resolution.q12.completed";
export const Q12_POLICY_FOUND_FLAG = "entity_resolution.q12.policy_found";
export const Q12_LEGACY_POLICY_FOUND_FLAG = "entity_resolution.q12.legacy_policy_found";
export const Q12_CURRENT_POLICY_FOUND_FLAG = "entity_resolution.q12.current_policy_found";
export const Q12_CONDITIONAL_REVIEW_FOUND_FLAG = "entity_resolution.q12.conditional_review_found";
export const Q12_APPROVED_SOURCE_BYPASS_FOUND_FLAG = "entity_resolution.q12.approved_source_bypass_found";
export const Q12_COM07_REVIEW_NOT_REQUIRED_FLAG = "entity_resolution.q12.com07_review_not_required";
export const Q12_POLICY_CHANGE_FOUND_FLAG = "entity_resolution.q12.policy_change_found";
export const Q12_POLICY_HISTORY_FOUND_FLAG = "entity_resolution.q12.policy_history_found";
export const Q12_POLICY_DEPLOYMENT_DATE_FOUND_FLAG = "entity_resolution.q12.policy_deployment_date_found";
export const Q12_APPROVAL_IDENTITY_REDACTED_FLAG = "entity_resolution.q12.approval_identity_redacted";

// Campaign-wide flags: TODO (new, not yet in flags.ts) —
// cri_policy_change_confirmed, cri_automation_expanded.

// No mail content found for Q12 in this pass — its content is pure
// artifact/policy data (POL-1847, review-flow diagrams), already covered by
// the filesystem-extraction fork. No opening mail, report-template, hold
// mail, completion mail, or HackhubPost teaser text found. TODO when Q12
// becomes the active implementation target.

export const Q12_THE_PIPELINE: Quest = {
    id: asId<"Quest">("entity_resolution.q12"),
    chapterId: "chapter-03-false-positive", // provisional, see design doc
    title: "THE PIPELINE",
    description:
        "Comparing legacy vs. current policy configuration (POL-1847) explains why COM-07-class sources skip review.",
    objectives: [
        {
            id: "q12.runtime.completion",
            description: "Q12 canonical completion boundary.",
            condition: flagEquals(Q12_FINAL_STATE_FLAG, true),
        },
    ],
};
