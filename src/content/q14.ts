// REBUILT from the authoritative locked source `DEAD_SIGNAL_Q14_THE_OWNER_
// LOCKED_v1.0.docx` (user-supplied 2026-09-16), which supersedes the
// Phase 8 "COMPLETE TECHNICAL QUEST SPEC" summary this skeleton was
// originally built from — Phase 13's own dev transcript confirms Q14/Q15
// are the only two quests in the campaign that ever received a dedicated LOCKED
// v1.0 spec; every other quest (Q01-Q13, Q16) still relies on the terser
// Phase 8 summary. Mail/Dialogue content NOT YET WRITTEN beyond what's
// below — HackhubPost and network fixtures still TODO.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

export { Q14_ROOT_FILES } from "./q14-filesystem.js";

// CORRECTED 2026-09-16: NOT an SSH/network target. Cross-checked against
// the pre-existing (later deferred) Q14 implementation at git commit
// `434e7a4` — its `CreateData()` used `Files.create`/`Files.exists`/
// `Files.getByPath` directly, with no `Network.createSubnetNetwork` call
// anywhere in `OnStart()`. This matches the narrative: Q15's LOCKED source
// explicitly frames the export as "an authorized forensic export, not
// bypassing the primary audit system" — these are files already available
// to the player locally (e.g. via an export/attachment), not a remote host
// to SSH into. The LOCKED source's `/archives/security/access/` path (see
// Q14_OBJECTIVES below) is a local `Files.*` path, matching
// `q14-filesystem.ts`'s `Q14_ROOT_FILES` tree.

// The LOCKED source's real structure is 6 mandatory + 1 optional (NOT the
// 4+1 this skeleton originally guessed from the terser Phase 8 summary —
// "TRACE THE ACCESS WINDOW" and "ASK ABOUT THE SESSION" were missing
// objectives; "traceDelegatedAccess" as originally named was actually
// part of Objective 01's result data, not its own objective).
export const Q14_OBJECTIVE_IDS = {
    findAccessRegistry: "q14.objective.01",
    traceAccessWindow: "q14.objective.02",
    findAuthorization: "q14.objective.03",
    resolveApprover: "q14.objective.04",
    speakToMarcus: "q14.objective.05",
    askAboutSession: "q14.objective.06",
    // Optional — LOCKED source: "Optional reward: +20 XP".
    checkAccessJustification: "q14.objective.06b",
} as const;

export const Q14_OBJECTIVES = [
    {
        name: Q14_OBJECTIVE_IDS.findAccessRegistry,
        description: "Find the access registry for OVERRIDE_OPERATOR (/archives/security/access/)",
        // tool: Files.* local access (native, NO Network/SSH target — see the
        // "no network target for Q14" correction in this file's header comment)
    },
    {
        name: Q14_OBJECTIVE_IDS.traceAccessWindow,
        description: "Trace the access window — search auth records 2026-08-17/18 for sessions A-77319 and A-77402",
        // tool: Files.* local access (native, no network target)
        unlocksAfter: [Q14_OBJECTIVE_IDS.findAccessRegistry],
    },
    {
        name: Q14_OBJECTIVE_IDS.findAuthorization,
        description: "Find authorization AR-44192 and its link to session A-77402",
        // tool: same as above
        unlocksAfter: [Q14_OBJECTIVE_IDS.traceAccessWindow],
    },
    {
        name: Q14_OBJECTIVE_IDS.resolveApprover,
        description: "Resolve approver M.REED to Marcus Reed via the employee directory",
        // tool: same as above
        unlocksAfter: [Q14_OBJECTIVE_IDS.findAuthorization],
    },
    {
        name: Q14_OBJECTIVE_IDS.speakToMarcus,
        description: "Speak to Marcus — confirm he approved AR-44192 for OVERRIDE_OPERATOR",
        // tool: none (Dialog, after his "Your inquiry" email)
        unlocksAfter: [Q14_OBJECTIVE_IDS.resolveApprover],
    },
    {
        name: Q14_OBJECTIVE_IDS.askAboutSession,
        description: "Ask Marcus about the session itself — he approved access but did not use it",
        // tool: none (Dialog, continuation of speakToMarcus)
        unlocksAfter: [Q14_OBJECTIVE_IDS.speakToMarcus],
    },
    {
        name: Q14_OBJECTIVE_IDS.checkAccessJustification,
        description: "Check the access justification on AR-44192 (\"Emergency operational maintenance\")",
        // tool: same as findAccessRegistry
        unlocksAfter: [Q14_OBJECTIVE_IDS.askAboutSession],
    },
];

export const Q14_REPLAY_OBJECTIVES = Q14_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP: the LOCKED source states only the optional line ("Optional reward:
// +20 XP") — it does NOT give a "Main XP" total or per-objective
// breakdown the way Q15's LOCKED source does. The 6 mandatory values below
// are an even, best-effort split (NOT sourced per-objective) that keeps
// the same 140-XP-max total the Phase 8 summary previously stated;
// adjust freely when Q14 becomes the active implementation target — only
// the `checkAccessJustification: 20` value is LOCKED-confirmed. Money
// ($700) is likewise carried over from Phase 8 since the LOCKED source
// gives no reward-money figure at all; no separate "optional money" is
// stated in the LOCKED source (unlike Phase 8's guessed $100 split), so
// money is now a flat total, not base+optional.
//
// CONFLICT FLAGGED (git-history cross-check, 2026-09-16): a pre-existing
// (later reverted/deferred) Q14 implementation found at commit
// `434e7a4` used a flat `Q14_BASE_XP = 130` / `Q14_OPTIONAL_XP = 10`
// (140 total, matching the LOCKED total but NOT the LOCKED docx's explicit
// "+20 XP" optional line — that old code predates this session's docx
// read and may itself have been a placeholder). The LOCKED .docx's
// explicit written "+20 XP" is treated as authoritative here since it's
// the primary source; resolve this discrepancy explicitly (don't silently
// pick one) when Q14 is actually implemented. That old commit is also
// useful for real fixture file paths if `q14-filesystem.ts` gets rebuilt:
// `/exports/operations/dead-signal/q14/{authorizations,sessions,identity}/`
// with `access-registry.txt`, `A-77402.session`, `AR-44192.txt`,
// `M-REED.txt`, `AR-44192-justification.txt` — content strings for each
// are in that commit too, close to but not identical to the LOCKED docx's
// own table-formatted versions (docx is richer/more authoritative).
export const Q14_REWARDS = {
    findAccessRegistry: 20,
    traceAccessWindow: 20,
    findAuthorization: 20,
    resolveApprover: 20,
    speakToMarcus: 20,
    askAboutSession: 20,
    checkAccessJustification: 20, // LOCKED-confirmed exact value
    money: 700,
} as const;

export const Q14_FINAL_STATE_FLAG = "entity_resolution.q14.completed";
export const Q14_OVERRIDE_ACCESS_REGISTRY_FOUND_FLAG = "entity_resolution.q14.override_access_registry_found";
export const Q14_DELEGATED_ACCESS_CONFIRMED_FLAG = "entity_resolution.q14.delegated_access_confirmed";
export const Q14_ACCESS_WINDOW_FOUND_FLAG = "entity_resolution.q14.access_window_found";
export const Q14_OVERRIDE_SESSION_FOUND_FLAG = "entity_resolution.q14.override_session_found";
export const Q14_MARCUS_ACCESS_APPROVAL_CONFIRMED_FLAG = "entity_resolution.q14.marcus_access_approval_confirmed";
export const Q14_MARCUS_REED_CONFIRMED_FLAG = "entity_resolution.q14.marcus_reed_confirmed";
export const Q14_OPERATOR_IDENTITY_UNKNOWN_FLAG = "entity_resolution.q14.operator_identity_unknown";
export const Q14_EXCEPTION_ACCESS_FOUND_FLAG = "entity_resolution.q14.exception_access_found";
export const Q14_PRIMARY_AUDIT_SYSTEM_REQUIRED_FLAG = "entity_resolution.q14.primary_audit_system_required";

// Campaign-wide flags this quest sets (LOCKED source: "dead_signal.marcus_
// introduced" / "dead_signal.marcus_authority_confirmed", no q14 prefix —
// TODO, not yet added to src/content/flags.ts): marcus_introduced,
// marcus_authority_confirmed.

// Explicitly NEVER set by this quest (LOCKED source's own "Explicitly NOT
// created" list) — do not invent these flags when Q14 is implemented:
// marcus_operated_account, marcus_created_false_connection,
// marcus_manipulated_cri, marcus_targeted_rizky, marcus_malicious_intent,
// operator_person_identified.

// Email — LOCKED source, "7. Objective 05 — SPEAK TO MARCUS".
export const Q14_MARCUS_EMAIL_SUBJECT = "Your inquiry";
export const Q14_MARCUS_EMAIL_CONTENT = [
    "I understand you've been reviewing ARKA operational records.",
    "",
    "If you have questions about authorization, you should ask me directly.",
    "",
    "— Marcus Reed",
].join("\n");

// Relay — LOCKED source, "2. Opening — THE ACCESS HISTORY". Relay is a
// distinct private-messaging system in the source's story bible, separate
// from the phone-call `Dialog` mechanic — no native Relay SDK primitive
// exists, so per this project's Q01 precedent (Relay -> Mail substitution,
// see docs/implementation-rules.md §0 (Relay -> Mail substitution)) this
// is Mail-adjacent content.
export const Q14_RELAY_OPENING_CONTENT = [
    'Daniel: "I found another reference."',
    "",
    'Player: "To OVERRIDE_OPERATOR?"',
    "",
    'Daniel: "To its access history."',
    "",
    'Player: "Where?"',
    "",
    'Daniel: "Operations security archive."',
    "",
    'Maya: "Does it show who used it?"',
    "",
    'Daniel: "Not directly."',
    "",
    'Daniel: "But it shows who was allowed to."',
].join("\n");

// No report-template, hold mail, completion mail, or HackhubPost teaser
// found in the LOCKED source — Q14 has no mail-based report objective at
// all (it ends on a Dialog scene, see the quest file's Dialog field).

export const Q14_THE_OWNER: Quest = {
    id: asId<"Quest">("entity_resolution.q14"),
    chapterId: "chapter-04-the-override", // provisional, see design doc
    title: "THE OWNER",
    description:
        "Traces the OVERRIDE_OPERATOR account's delegated-access model to Marcus Reed — its authorized approver, not confirmed operator.",
    objectives: [
        {
            id: "q14.runtime.completion",
            description: "Q14 canonical completion boundary.",
            condition: flagEquals(Q14_FINAL_STATE_FLAG, true),
        },
    ],
};
