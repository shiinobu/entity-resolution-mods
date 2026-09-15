// SKELETON — objective/reward/flag data locked from
// docs/phase13-q04-q16-design-recovered.md. Narrative content (mail,
// dialogue, HackhubPost, network fixtures) NOT YET WRITTEN — fill in when
// this quest becomes the active implementation target per
// docs/phase13-sequential-campaign-lock.md.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";
import { Q03_TARGET_IP, Q03_WEB_HOST } from "./q03.js";

// Reuses Q02/Q03's edge-03 host per the design doc (same host, same
// decommission audit thread).
export const Q04_TARGET_IP = Q03_TARGET_IP;
export const Q04_WEB_HOST = Q03_WEB_HOST;

// Design doc: verifyServerStatus scans "same ports as Q02: 22/443/8443" —
// service names mirrored from Q02_NETWORK_PORTS/Q02_NMAP_RESULT (q02.ts) for
// consistency. Unlike Q02, no FORWARDED/anomaly framing is implied here —
// the point is just confirming the host is still live, not re-discovering
// the gateway anomaly.
export const Q04_NETWORK_PORTS = [
    { external: 22, internal: 22, active: true, service: "ssh" },
    { external: 443, internal: 443, active: true, service: "https" },
    { external: 8443, internal: 8443, active: true, service: "https-alt" },
];

export interface Q04NmapPort {
    readonly port: number;
    readonly status: "OPEN" | "CLOSE";
    readonly service: string;
}

export const Q04_NMAP_RESULT: Q04NmapPort[] = [
    { port: 22, status: "OPEN", service: "ssh" },
    { port: 443, status: "OPEN", service: "https" },
    { port: 8443, status: "OPEN", service: "https-alt" },
];

export const Q04_OBJECTIVE_IDS = {
    reviewDecommissionNotice: "q04.objective.01",
    verifyServerStatus: "q04.objective.02",
    closeAudit: "q04.objective.03",
    decideOnEvidence: "q04.objective.04",
    // Optional — opened by the "take one last look" choice in decideOnEvidence.
    checkLastConnection: "q04.objective.04b",
} as const;

export const Q04_OBJECTIVES = [
    {
        name: Q04_OBJECTIVE_IDS.reviewDecommissionNotice,
        description: "Review the decommission notice",
        // tool: none (Mail)
    },
    {
        name: Q04_OBJECTIVE_IDS.verifyServerStatus,
        description: "Verify the server is still active",
        // tool: nmap (native) — same ports as Q02: 22/443/8443
        unlocksAfter: [Q04_OBJECTIVE_IDS.reviewDecommissionNotice],
    },
    {
        name: Q04_OBJECTIVE_IDS.closeAudit,
        description: "Close the audit",
        // tool: none (Mail/Dialog — close-as-requested vs. add-a-note, both valid)
        unlocksAfter: [Q04_OBJECTIVE_IDS.verifyServerStatus],
    },
    {
        name: Q04_OBJECTIVE_IDS.decideOnEvidence,
        description: "Decide what to do with the remaining evidence",
        // tool: none (Dialog — 3-way choice; third opens checkLastConnection)
        unlocksAfter: [Q04_OBJECTIVE_IDS.closeAudit],
    },
    {
        name: Q04_OBJECTIVE_IDS.checkLastConnection,
        description: "Investigate the last recorded connection",
        // tool: ssh + ls/cat (native, same mechanism as Q03)
        unlocksAfter: [Q04_OBJECTIVE_IDS.decideOnEvidence],
    },
];

export const Q04_REPLAY_OBJECTIVES = Q04_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP breakdown per the design doc — mapping to objectives is best-effort
// (the source lists XP as prose, not objective-keyed). closeAudit has no
// distinct line item in the source; not silently invented here.
export const Q04_REWARDS = {
    verifyDecommissionStatus: 20, // reviewDecommissionNotice
    investigateActiveServer: 20, // verifyServerStatus
    analyzeLastConnection: 20, // checkLastConnection
    identifyAuthLogMismatch: 20, // checkLastConnection
    preserveAnomalousEvidence: 20, // decideOnEvidence
    money: 350,
} as const;

export const Q04_FINAL_STATE_FLAG = "entity_resolution.q04.completed";
export const Q04_LAST_CONNECTION_CHECKED_FLAG = "entity_resolution.q04.last_connection_checked";
export const Q04_CRI_IP_CONFIRMED_FLAG = "entity_resolution.q04.cri_ip_confirmed";
export const Q04_LOG_MISMATCH_FOUND_FLAG = "entity_resolution.q04.log_mismatch_found";

// Campaign-wide flags this quest reads/writes — see src/content/flags.ts.
// ENTITY_RESOLUTION_FLAGS.adrianWarnedPlayer is set true here.
// ENTITY_RESOLUTION_FLAGS.criKnown stays FALSE after Q04 per the source —
// do not flip it here.
// TODO (new campaign-wide flag, not yet in flags.ts): unknown_contacted_player
// — sets up the anonymous "You shouldn't have looked... — U" mail hook.

// Mail content — sourced from the design doc's Q04 detail section (its own
// "1. Opening" / "3. Objective 1" / "14. Chapter 1 Ending" subsections), NOT
// the earlier terse Phase 8 spec pass. Client/host naming adapted: source
// literally says "Meridian Logistics" / "edge-03.meridian.local" — this
// project's already-locked canon (Q02/Q03) is Skynet Logistics /
// edge-03.skynet-logistics.idx, so those substitutions are applied below,
// same as the existing dead_signal→entity_resolution adaptation.

// Adrian's informal heads-up — mirrors Q03's INCOMING_MAIL role (Adrian
// briefing the player at quest start).
export const Q04_INCOMING_MAIL_SUBJECT = "Re: edge-03";
export const Q04_INCOMING_MAIL_CONTENT = [
    "The client confirmed it.",
    "",
    "edge-03 is being decommissioned.",
    "",
    "They've asked us to close the audit.",
    "",
    "Leave it alone.",
    "",
    "— Adrian",
].join("\n");

// The formal client decommission notice (source: "Objective 1 — Review the
// decommission notice"), a second/separate mail from the client itself.
export const Q04_DECOMMISSION_NOTICE_SUBJECT = "edge-03 Decommission Confirmation";
export const Q04_DECOMMISSION_NOTICE_CONTENT = [
    `The infrastructure identified as ${Q04_WEB_HOST} has been scheduled for decommissioning.`,
    "",
    "No further assessment is required.",
    "",
    "Please close the associated security audit.",
    "",
    "Decommission date: September 9, 2026 — 23:00",
].join("\n");

// "Close the audit" (objective 3) — source frames this as an in-game audit
// report panel with a [CLOSE AUDIT] action, not explicitly a GoMail send.
// TODO: exact submission mechanism (Mail.send vs a different UI widget) not
// yet decided — content captured here either way.
export const Q04_AUDIT_STATUS_CONTENT = [
    "AUDIT STATUS",
    "",
    "[OPEN]",
    "",
    "Finding:",
    "Unidentified legacy infrastructure.",
    "",
    "Evidence:",
    "- edge-03 active",
    "- incomplete logs",
    "- restricted backup policy",
    "- ARKA infrastructure certificate",
    "- cri-gateway.internal reference",
    "",
    "Client response:",
    "Server scheduled for decommissioning.",
].join("\n");

// Option A — close as requested.
export const Q04_CLOSE_AUDIT_REPORT_CONTENT = [
    "No active critical vulnerability identified.",
    "",
    "Infrastructure is scheduled for decommissioning.",
].join("\n");

// Option B — add a note (appended to the Option A text per the source).
export const Q04_CLOSE_AUDIT_NOTE_CONTENT =
    "Additional investigation was not completed because the client requested closure.";

// Chapter 1's closing hook mail — arrives automatically after the audit is
// closed, regardless of which of the 3 end-of-quest choices the player made.
// Sender is deliberately anonymous in the source ("unknown@relay", signed
// "— U") — no canonical character identity exists yet for "U", so this stays
// literal placeholder-style content rather than a real characters.ts entry
// (matches the earlier decision not to pre-name Q16's "Unknown").
export const Q04_UNKNOWN_HOOK_MAIL_SENDER = "unknown@relay";
export const Q04_UNKNOWN_HOOK_MAIL_SUBJECT = "You shouldn't have looked";
export const Q04_UNKNOWN_HOOK_MAIL_CONTENT = [
    "You found the wrong server.",
    "",
    "But you found it for the right reason.",
    "",
    "Don't trust the inventory.",
    "",
    "Don't trust the logs.",
    "",
    "And don't ask Adrian what he knows.",
    "",
    "— U",
].join("\n");

// No HackhubPost teaser text found in the source for Q04 — TODO, write when
// Q04 becomes the active implementation target.

// No report-template/dual-path pattern here — Q04's "report" is the audit
// panel above, not a GoMail submission validated against a report body like
// Q01-Q03. No hold-mail beat either — the source goes straight from audit
// close to Adrian's phone call (Dialog territory, not mail — see report).

export const Q04_LEAVE_IT_ALONE: Quest = {
    id: asId<"Quest">("entity_resolution.q04"),
    chapterId: "chapter-01-ghost-server",
    title: "LEAVE IT ALONE",
    description:
        "Client confirms edge-03's decommission and asks to close the audit — but the server is still live.",
    objectives: [
        {
            id: "q04.runtime.completion",
            description: "Q04 canonical completion boundary.",
            condition: flagEquals(Q04_FINAL_STATE_FLAG, true),
        },
    ],
};
