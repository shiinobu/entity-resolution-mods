// REBUILT from the authoritative locked source `DEAD_SIGNAL_Q15_THE_
// EVIDENCE_LOCKED_v1.0.docx` (user-supplied 2026-09-16), which supersedes
// the Phase 8 "COMPLETE TECHNICAL QUEST SPEC" summary this skeleton was
// originally built from — see content/q14.ts's header comment for the
// full provenance note (Q14/Q15 are the only two quests with a dedicated
// LOCKED v1.0 spec; every other quest still relies on the terser Phase 8
// summary). Mail/Dialogue content NOT YET WRITTEN beyond what's below —
// HackhubPost and network fixtures still TODO.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

export { Q15_ROOT_FILES } from "./q15-filesystem.js";

// CORRECTED 2026-09-16: NOT an SSH/network target — see content/q14.ts's
// header comment for the full reasoning (cross-checked against git commit
// `434e7a4`'s Q14 implementation, which used local `Files.*` calls with no
// `Network.createSubnetNetwork`). LOCKED source path:
// /exports/operations/operations_audit_2026-08-18.enc (encrypted forensic
// export), then /actions/A-77402.log inside the decrypted archive — local
// `Files.*` access + an `openssl` decrypt step, matching
// `q15-filesystem.ts`'s `Q15_ROOT_FILES` tree.

// The LOCKED source's real structure is 7 mandatory + 1 optional (NOT the
// 5+1 this skeleton originally guessed from the terser Phase 8 summary —
// "RECONSTRUCT SESSION A-77402" (metadata) and "TRACE THE USER REFERENCE"
// (hash correlation) were missing as their own objectives; the original
// "reconstructSession" conflated three separate LOCKED objectives into
// one).
export const Q15_OBJECTIVE_IDS = {
    retrievePrimaryAuditExport: "q15.objective.01",
    reconstructSessionA77402: "q15.objective.02",
    traceUserReference: "q15.objective.03",
    reconstructSessionTimeline: "q15.objective.04",
    comparePolicyVersions: "q15.objective.05",
    traceRizkyPipeline: "q15.objective.06",
    // Optional — LOCKED source: "Reward: +25 XP". Positioned after
    // comparePolicyVersions thematically (same before/after policy
    // comparison, just the historical COM-07-specific record) — does not
    // gate correlateOperatorIdentity, mirroring Q03's checkBackup pattern.
    checkPreviousPolicy: "q15.objective.05b",
    correlateOperatorIdentity: "q15.objective.07",
} as const;

export const Q15_OBJECTIVES = [
    {
        name: Q15_OBJECTIVE_IDS.retrievePrimaryAuditExport,
        description: "Retrieve the primary audit export (operations_audit_2026-08-18.enc)",
        // tool: Files.* local access + openssl decrypt (native, no network target)
    },
    {
        name: Q15_OBJECTIVE_IDS.reconstructSessionA77402,
        description: "Reconstruct session A-77402's metadata record",
        // tool: Files.* local access (native, no network target)
        unlocksAfter: [Q15_OBJECTIVE_IDS.retrievePrimaryAuditExport],
    },
    {
        name: Q15_OBJECTIVE_IDS.traceUserReference,
        description: "Trace the user reference (USR-REDACTED-17) to an identity hash",
        // tool: Files.* local access (native, no network target)
        unlocksAfter: [Q15_OBJECTIVE_IDS.reconstructSessionA77402],
    },
    {
        name: Q15_OBJECTIVE_IDS.reconstructSessionTimeline,
        description: "Reconstruct the full A-77402 action timeline (login -> CONFIGURATION_OVERRIDE -> logout)",
        // tool: reconstructSession (custom "timeline"-style command, see original skeleton note)
        unlocksAfter: [Q15_OBJECTIVE_IDS.traceUserReference],
    },
    {
        name: Q15_OBJECTIVE_IDS.comparePolicyVersions,
        description: "Compare policy before (REQUIRED/bypass disabled) vs. after (CONDITIONAL/bypass enabled)",
        // tool: Files.* local access (native, no network target)
        unlocksAfter: [Q15_OBJECTIVE_IDS.reconstructSessionTimeline],
    },
    {
        name: Q15_OBJECTIVE_IDS.traceRizkyPipeline,
        description: "Trace Rizky's full processing chain through the pipeline to CRI risk_score 74",
        // tool: chaintrace (custom)
        unlocksAfter: [Q15_OBJECTIVE_IDS.comparePolicyVersions],
    },
    {
        name: Q15_OBJECTIVE_IDS.checkPreviousPolicy,
        description: "Check the historical COM-07 policy record (confidence unchanged, review_required flipped)",
        // tool: Files.* local access (native, no network target)
        unlocksAfter: [Q15_OBJECTIVE_IDS.comparePolicyVersions],
    },
    {
        name: Q15_OBJECTIVE_IDS.correlateOperatorIdentity,
        description: "Correlate the operator identity through to ARKA-OPS-0441 and assemble the evidence package",
        // tool: Files.* local access (native, no network target)
        unlocksAfter: [Q15_OBJECTIVE_IDS.traceRizkyPipeline],
    },
];

export const Q15_REPLAY_OBJECTIVES = Q15_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// LOCKED-confirmed exact figures ("16. Rewards": Main Reward $700, Main XP
// +90, Optional +25, Maximum 115) — supersedes the Phase 8 summary's
// guessed $700 base + $200 optional / 130ish-XP split entirely. The 90 XP
// mandatory total is spread evenly-ish across the 7 objectives below
// (NOT itemized per-objective in the LOCKED source, same caveat as Q14);
// only the total (90) and the optional value (25) are LOCKED-confirmed.
export const Q15_REWARDS = {
    retrievePrimaryAuditExport: 10,
    reconstructSessionA77402: 10,
    traceUserReference: 10,
    reconstructSessionTimeline: 15,
    comparePolicyVersions: 15,
    traceRizkyPipeline: 15,
    correlateOperatorIdentity: 15,
    checkPreviousPolicy: 25, // LOCKED-confirmed exact value
    money: 700, // LOCKED-confirmed flat total, no optional split
} as const;

export const Q15_FINAL_STATE_FLAG = "entity_resolution.q15.completed";
export const Q15_PRIMARY_AUDIT_ACCESSED_FLAG = "entity_resolution.q15.primary_audit_accessed";
export const Q15_OPERATOR_SESSION_FOUND_FLAG = "entity_resolution.q15.operator_session_found";
export const Q15_OPERATOR_IDENTITY_HASH_FOUND_FLAG = "entity_resolution.q15.operator_identity_hash_found";
export const Q15_OPERATOR_IDENTITY_CORRELATED_FLAG = "entity_resolution.q15.operator_identity_correlated";
export const Q15_POLICY_CHANGE_RECONSTRUCTED_FLAG = "entity_resolution.q15.policy_change_reconstructed";
export const Q15_RELATIONSHIP_POLICY_MODIFIED_FLAG = "entity_resolution.q15.relationship_policy_modified";
export const Q15_COM07_POLICY_PATH_CONFIRMED_FLAG = "entity_resolution.q15.com07_policy_path_confirmed";
export const Q15_RIZKY_PROCESSING_CHAIN_RECONSTRUCTED_FLAG =
    "entity_resolution.q15.rizky_processing_chain_reconstructed";
export const Q15_BEFORE_AFTER_POLICY_VERIFIED_FLAG = "entity_resolution.q15.before_after_policy_verified"; // set by checkPreviousPolicy (optional)
export const Q15_REVIEW_BEHAVIOR_CHANGED_CONFIRMED_FLAG =
    "entity_resolution.q15.review_behavior_changed_confirmed"; // set by checkPreviousPolicy (optional)
export const Q15_OPERATOR_IDENTITY_RESTRICTED_FLAG = "entity_resolution.q15.operator_identity_restricted";
export const Q15_OPERATOR_EMPLOYMENT_ARKA_FLAG = "entity_resolution.q15.operator_employment_arka";

// Campaign-wide flags this quest sets (TODO, not yet in flags.ts):
// evidence_chain_complete, operator_identity_known_to_system.

// Explicitly NEVER set by this quest (LOCKED source's own "Explicitly NOT
// created" list) — do not invent these flags when Q15 is implemented:
// operator_identity_revealed, operator_intent_confirmed,
// operator_targeted_rizky, operator_created_false_connection,
// marcus_ordered_manipulation, marcus_operated_account,
// arka_institutional_manipulation_confirmed, cri_manually_manipulated.

// Relay — LOCKED source, "2. Opening". Relay is a distinct private-
// messaging system in the source's story bible, separate from the
// phone-call `Dialog` mechanic — no native Relay SDK primitive exists, so
// per this project's Q01 precedent (Relay -> Mail substitution, see
// docs/implementation-rules.md §0 (Relay -> Mail substitution)) this is
// Mail-adjacent content. Re-verified against the LOCKED docx — unchanged
// from the earlier relay-extraction pass.
export const Q15_RELAY_OPENING_CONTENT = [
    'Daniel: "I found the primary audit export process."',
    "",
    'Player: "Can we access it?"',
    "",
    'Daniel: "A sanitized export."',
    "",
    'Player: "Not the identity?"',
    "",
    'Daniel: "The export removes personnel names."',
    "",
    'Daniel: "But it keeps session and action history."',
    "",
    'Maya: "That\'s enough to reconstruct what happened."',
    "",
    'Daniel: "Maybe."',
    "",
    'Daniel: "If the logs are complete."',
].join("\n");

// No report-template, hold mail, completion mail, or HackhubPost teaser
// found in the LOCKED source — Q15 has no mail-based report objective at
// all (it ends on a Dialog scene, see the quest file's Dialog field).

export const Q15_THE_EVIDENCE: Quest = {
    id: asId<"Quest">("entity_resolution.q15"),
    chapterId: "chapter-04-the-override", // provisional, see design doc
    title: "THE EVIDENCE",
    description:
        "The technical climax — reconstructs the full A-77402 timeline and correlates the operator identity to ARKA-OPS-0441.",
    objectives: [
        {
            id: "q15.runtime.completion",
            description: "Q15 canonical completion boundary.",
            condition: flagEquals(Q15_FINAL_STATE_FLAG, true),
        },
    ],
};
