// SKELETON — see docs/phase13-q04-q16-design-recovered.md. Mail, dialogue,
// HackhubPost, network fixtures NOT YET WRITTEN.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

export { Q11_ROOT_FILES } from "./q11-filesystem.js";

// TODO: target/archive location not yet decided.

export const Q11_OBJECTIVE_IDS = {
    inspectHistoricalArchitecture: "q11.objective.01",
    compareResolvers: "q11.objective.02",
    identifyReviewException: "q11.objective.03",
    inspectDanielsChange: "q11.objective.04",
    checkTheChange: "q11.objective.04b", // optional
} as const;

export const Q11_OBJECTIVES = [
    { name: Q11_OBJECTIVE_IDS.inspectHistoricalArchitecture, description: "Inspect historical architecture" }, // tool: ssh + cat (native)
    {
        name: Q11_OBJECTIVE_IDS.compareResolvers,
        description: "Compare old vs. current resolver (review not removed — made conditional)", // tool: cat (native)
        unlocksAfter: [Q11_OBJECTIVE_IDS.inspectHistoricalArchitecture],
    },
    {
        name: Q11_OBJECTIVE_IDS.identifyReviewException,
        description: "Identify the human-review exception behavior", // tool: cat (native)
        unlocksAfter: [Q11_OBJECTIVE_IDS.compareResolvers],
    },
    {
        name: Q11_OBJECTIVE_IDS.inspectDanielsChange,
        description: "Inspect Daniel's engineering change (resolver-service, 2026-01-18)", // tool: sqlmap (native)
        unlocksAfter: [Q11_OBJECTIVE_IDS.identifyReviewException],
    },
    {
        name: Q11_OBJECTIVE_IDS.checkTheChange,
        description: "Check the change details further, then question Daniel directly", // tool: sqlmap (native) + Dialog
        unlocksAfter: [Q11_OBJECTIVE_IDS.inspectDanielsChange],
    },
];

export const Q11_REPLAY_OBJECTIVES = Q11_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP breakdown per the design doc, best-effort mapped to objectives (9 XP
// items against 5 objectives — not objective-keyed). Explicitly no XP for
// accusing Daniel of being the manipulator.
export const Q11_REWARDS = {
    locateArchive: 15, // inspectHistoricalArchitecture
    reconstructLegacyPipeline: 20, // inspectHistoricalArchitecture
    reconstructCurrentPipeline: 20, // compareResolvers
    conditionalReview: 15, // compareResolvers
    automaticAcceptance: 15, // identifyReviewException
    reviewException: 10, // identifyReviewException
    danielsComponentChange: 10, // inspectDanielsChange
    correctlyIdentifyReducedReviewCoverage: 10, // inspectDanielsChange
    checkChange: 5, // checkTheChange
    money: 650,
} as const;

export const Q11_FINAL_STATE_FLAG = "entity_resolution.q11.completed";
export const Q11_HISTORICAL_PIPELINE_FOUND_FLAG = "entity_resolution.q11.historical_pipeline_found";
export const Q11_OLD_REVIEW_FLOW_FOUND_FLAG = "entity_resolution.q11.old_review_flow_found";
export const Q11_CURRENT_REVIEW_FLOW_FOUND_FLAG = "entity_resolution.q11.current_review_flow_found";
export const Q11_AUTOMATED_ACCEPTANCE_FOUND_FLAG = "entity_resolution.q11.automated_acceptance_found";
export const Q11_HUMAN_REVIEW_EXCEPTION_FOUND_FLAG = "entity_resolution.q11.human_review_exception_found";
export const Q11_DANIEL_COMPONENT_CONFIRMED_FLAG = "entity_resolution.q11.daniel_component_confirmed";
export const Q11_DANIEL_CHANGE_FOUND_FLAG = "entity_resolution.q11.daniel_change_found";
export const Q11_REVIEW_COVERAGE_REDUCED_FLAG = "entity_resolution.q11.review_coverage_reduced";

// Campaign-wide flags: TODO (new, not yet in flags.ts) —
// daniel_complicity_confirmed. daniel_accountability_increased is reused
// from Q10 (see content/q10.ts).

// No mail content found for Q11 in this pass — the source's Q11 content is
// dominated by its "Revised Core Dialogue" (Player/Daniel exchange) and
// resolver-flow diagrams, no Subject/mail-framed text. Q11 IS in the
// dialogue-extraction fork's scope (checkTheChange), so the interview
// content is likely already covered there. No report-template, hold mail,
// completion mail, or HackhubPost teaser found. TODO when Q11 becomes the
// active implementation target.

export const Q11_DANIEL: Quest = {
    id: asId<"Quest">("entity_resolution.q11"),
    chapterId: "chapter-03-false-positive", // provisional, see design doc
    title: "DANIEL",
    description:
        "Compares the legacy and current resolver pipelines and identifies Daniel's engineering change as a contributing technical cause.",
    objectives: [
        {
            id: "q11.runtime.completion",
            description: "Q11 canonical completion boundary.",
            condition: flagEquals(Q11_FINAL_STATE_FLAG, true),
        },
    ],
};
