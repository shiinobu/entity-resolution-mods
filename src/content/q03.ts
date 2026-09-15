import type { QuestHackhubPostDefinition } from "@hotbunny/hackhub-content-sdk";

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";
import { ADRIAN_COLE } from "./characters.js";
import { Q02_CLIENT_NAME, Q02_TARGET_IP, Q02_WEB_HOST } from "./q02.js";

export {
    Q03_ROOT_FILES,
    Q03_GATEWAY_GZ_FILES,
    Q03_ZGREP_NO_RESULT_PATTERNS,
    Q03_FILESTAT_METADATA,
    Q03_BOOT_HISTORY,
} from "./q03-filesystem.js";

// Q03 targets the SAME host Q02 already fully investigated and resolved —
// not a new hidden target. The opening mail states the hostname/IP directly
// (no re-resolve puzzle); see docs/phase13-q03-source-recovered.md's
// "Canonical Identity" ("Target: edge-03.skynet-logistics.idx — the same
// host Q02 already investigated").
export const Q03_CLIENT_NAME = Q02_CLIENT_NAME;
export const Q03_TARGET_IP = Q02_TARGET_IP;
export const Q03_WEB_HOST = Q02_WEB_HOST;

// REVISED 2026-09-15 after live-test: `Network.createSubnetNetwork` is
// documented as creating "a full subnet network (Router with children
// hierarchy)" — a bare top-level `Device`, and a top-level `Router` with
// `users`/`ports` declared directly on it (no child), both failed to accept
// SSH connections live ("Connection to the remote server could not be
// established."), matching the SSH probe's own working shape (Router
// wrapping a CHILD Device). The player-facing IP must stay Q03_TARGET_IP
// (identical to the known web host, per the "same host as Q02" decision) —
// so the ROUTER gets this separate, never-mentioned wrapper IP instead, and
// the actual SSH-reachable Device (ports/users/rootFiles) is declared as
// that router's child at Q03_TARGET_IP. Purely structural; invisible to the
// player (never appears in mail, hints, or any narrative content).
export const Q03_ROUTER_IP = "203.0.113.1";

// Decided 2026-09-15 (session discussion, not in the recovered source — the
// source never specifies how the player obtains SSH access).
//
// REVISED 2026-09-15 after live-test: the original plan (mail carries only a
// password HASH, player runs `john <hash>` to crack it) failed live — native
// `john` has its own internal crack simulation, completely independent of
// `Shell.addCommandData`/`John.DecryptHash` (confirmed: "The password could
// not be cracked." regardless of what fixture data was registered). `john`
// is NOT part of the SDK's typed `CommandDataMap`, unlike `hydra`, which IS
// (`hydra: { input: { user, target }, data: { credentials: { username,
// password } } }`) — fully controllable the same way `nmap`/`ssh` are.
//
// New mechanism: the mail states only the USERNAME (not sensitive on its
// own, matching real infosec practice — usernames aren't secrets). The
// player runs `hydra` against the SSH service to brute-force the password,
// which the quest file wires via `Shell.addCommandData("hydra", ...)`.
export const Q03_SSH_USERNAME = "auditor";
export const Q03_SSH_PASSWORD = "Sky-Audit-07";
export const Q03_SSH_PORT = 22;
// Confirmed live 2026-09-15: native `hydra`'s usage is
// `hydra -T [ip:port] -P [wordlist] -l [username]` — `-T` takes the combined
// `ip:port` form, not a bare IP, so the addCommandData `target` fixture must
// match that exact string shape.
export const Q03_SSH_HYDRA_TARGET = `${Q03_TARGET_IP}:${Q03_SSH_PORT}`;

// Same protocol-gating rule as Q02 (docs/phase13-quest-structure-standard.md
// §6): port 80 stays absent so it defaults CLOSE. This matters here because
// Q03 re-creates the same host/IP Q02EdgeWebsite (untouched, locked) still
// serves — an absent port keeps that page's existing HTTP/HTTPS gating
// consistent with what Q03's own network fixture implies is open.
export const Q03_NETWORK_PORTS = [
    { external: Q03_SSH_PORT, internal: Q03_SSH_PORT, active: true, service: "ssh" },
];

// `nmap`'s displayed result comes entirely from this Shell.addCommandData
// fixture, independent of the real Network.createSubnetNetwork ports above —
// confirmed live 2026-09-15 the hard way: without Q03 registering its own
// fixture for this exact IP, `nmap` kept showing Q02's stale result (port 22
// CLOSE) since Q03_TARGET_IP === Q02_TARGET_IP and nothing had cleared it.
export interface Q03NmapPort {
    readonly port: number;
    readonly status: "OPEN" | "CLOSE";
    readonly service: string;
}

export const Q03_NMAP_RESULT: Q03NmapPort[] = [
    { port: Q03_SSH_PORT, status: "OPEN", service: "ssh" },
];

export const Q03_ADRIAN_EMAIL = ADRIAN_COLE.email;
export const Q03_REPORT_RECIPIENT = Q03_ADRIAN_EMAIL;
export const Q03_REPORT_SUBJECT = "Server History Report — Skynet Logistics";

// The three facts the player must discover themselves (filestat + bootlog
// for the first two, ls of /var/log/gateway for the third) before reporting.
// Named so both the freehand report body and the GoMail template's
// field-value validation share one source of truth — mirrors Q02's
// Q02_ANOMALOUS_PORT / Q02_GATEWAY_SERVICE_NAME / Q02_CERTIFICATE_ISSUER
// pattern exactly.
export const Q03_LAST_ACTIVITY_DATE = "Sep 08";
export const Q03_LOGS_START_DATE = "Sep 03";
export const Q03_MISSING_ROTATIONS = "5, 6";

export const Q03_REPORT_TEMPLATE_ID = "entity_resolution.q03.report";
export const Q03_REPORT_TEMPLATE_LABEL = "Server History Report";

export const Q03_REPORT_TEMPLATE_CONTENT = [
    `Host: ${Q03_WEB_HOST}`,
    "",
    "Finding:",
    "Available gateway logs do not cover the full operational",
    "history of the server.",
    "",
    "Last recorded activity: {{lastActivity}}. Logs begin: {{logsStart}}.",
    "Rotated log files missing: {{missingRotations}}.",
    "",
    "Several rotated log files are missing, and available",
    "backups do not restore the missing period.",
    "",
    "The current evidence is insufficient to determine when",
    "the gateway was last actively used.",
    "",
    "Recommendation:",
    "Confirm the original decommission date and obtain",
    "archived logs from the infrastructure owner.",
].join("\n");

// Exact locked wording from docs/phase13-q03-source-recovered.md's
// "05 — Report findings" section, reproduced verbatim (no {{fields}} — the
// freehand path is an exact-match body, matching Q02_REPORT_BODY's role).
export const Q03_REPORT_BODY = [
    `Host: ${Q03_WEB_HOST}`,
    "",
    "Finding:",
    "Available gateway logs do not cover the full operational",
    "history of the server.",
    "",
    "Several rotated log files are missing, and available",
    "backups do not restore the missing period.",
    "",
    "The current evidence is insufficient to determine when",
    "the gateway was last actively used.",
    "",
    "Recommendation:",
    "Confirm the original decommission date and obtain",
    "archived logs from the infrastructure owner.",
].join("\n");

export const Q03_HACKHUB_POST_PRODUCTION: QuestHackhubPostDefinition = {
    content: "Follow-up from the last client. Check your mail.",
    author: {
        name: "Adrian Cole",
        avatar: "assets/adrian-cole.png",
    },
};

export const Q03_HACKHUB_POST_REPLAY: QuestHackhubPostDefinition = {
    content: "DEV REPLAY — Q03 live-testing fixture. Apply to replay MISSING LOGS.",
    author: {
        name: "Adrian Cole [DEV]",
        avatar: "assets/adrian-cole.png",
    },
};

export const Q03_INCOMING_MAIL_SUBJECT = "Re: edge-03";

// Exact locked wording from the source's "Opening" section, reproduced
// verbatim, with one addition: an "Account:" line carrying ONLY the SSH
// username (never the password — see Q03_SSH_PASSWORD's revised comment
// above), inserted before the closing "Don't touch anything else." line —
// matching Adrian's established terse `Label: value` voice (same style as
// Q02's `Host: ${Q02_WEB_HOST}`).
export const Q03_INCOMING_MAIL_CONTENT = [
    "The client got back to me.",
    "",
    "They say edge-03 is old infrastructure and should",
    "have been decommissioned months ago.",
    "",
    "That would explain why it isn't in their current",
    "inventory.",
    "",
    "They want confirmation that it isn't still active.",
    "",
    "Can you pull the server history and check when it",
    "was last used?",
    "",
    `Account: ${Q03_SSH_USERNAME}`,
    "",
    "Don't touch anything else.",
    "",
    "— Adrian",
].join("\n");

// Decided 2026-09-15: conditional segments, not two fully separate texts.
// The unconditional lines stay byte-identical between both paths; only the
// backup-specific exchange is added when Data.backupChecked is true.
export const Q03_HOLD_MAIL_BASE_CONTENT = [
    "Thanks. I'll forward this to the client.",
    "Actually, hold on.",
    "Don't include the backup finding in the client report yet.",
    "",
    "I want to confirm something first. Just leave it for now.",
    "I'll get back to you.",
    "",
    "— Adrian",
].join("\n");

export const Q03_HOLD_MAIL_BACKUP_SEGMENT = [
    "",
    "The backup is restricted too, I know. Just leave it for now.",
].join("\n");

export const Q03_COMPLETION_MAIL_CONTENT_PRODUCTION = [
    "You couldn't confirm it, and neither can I right now.",
    "",
    "Leave it here for the moment.",
    "",
    "Payment's on the way.",
    "",
    "— Adrian",
].join("\n");

export const Q03_COMPLETION_MAIL_CONTENT_REPLAY = [
    "You couldn't confirm it, and neither can I right now.",
    "",
    "Leave it here for the moment.",
    "",
    "DEV replay complete.",
    "",
    "— Adrian",
].join("\n");

// Must outlast the phone call itself — `finishReportFindings()` (in
// q03-quest.ts) is called immediately when the call starts, decoupled from
// the call's own lifecycle (function properties on Dialog entries were
// confirmed live 2026-09-15 to break line advancement, so there is no
// reliable "call actually ended" hook to key off instead). The longest path
// (postReportMainWithBackup, 10 lines) auto-advances at 3s/line, i.e. ~27s
// to reach its final line — 20s previously let the completion mail/reward
// arrive mid-call. Set with headroom above that.
export const Q03_COMPLETION_DELAY_MS = 32_000;

export const Q03_FINAL_STATE_FLAG = "entity_resolution.q03.completed";
export const Q03_LOGS_MISSING_FLAG = "entity_resolution.q03.logs_missing";
export const Q03_BACKUP_CHECKED_FLAG = "entity_resolution.q03.backup_checked";
export const Q03_BACKUP_RESTRICTED_FLAG = "entity_resolution.q03.backup_restricted";
export const Q03_CRI_POLICY_FOUND_FLAG = "entity_resolution.q03.cri_policy_found";

// RENAMED 2026-09-15 (post-FINAL-LOCK design pass — see
// docs/phase13-q03-source-recovered.md's "Live-Test Findings" for the
// live-testing that led to this quest actually working; this pass is pure
// naming/UX polish on top of that). `determineActivity` (one objective
// requiring BOTH `filestat` and `bootlog`) was split into two separate
// objectives — `checkTimestamp` and `reviewBootHistory` — each completing
// independently on its own command, for more granular progress feedback.
export const Q03_OBJECTIVE_IDS = {
    accessHost: "q03.objective.01",
    checkLogs: "q03.objective.02",
    checkTimestamp: "q03.objective.03",
    reviewBootHistory: "q03.objective.04",
    checkGatewayLogs: "q03.objective.05",
    checkBackup: "q03.objective.05b",
    reportFindings: "q03.objective.06",
} as const;

// checkBackup is optional and deliberately NOT in reportFindings'
// unlocksAfter — decided 2026-09-15: gating the mandatory chain on
// zgrep/backup findings only obtainable via Q02's own optional DNS bonus
// would soft-lock players who skipped it. checkGatewayLogs only requires
// listing /var/log/gateway/ and seeing the gap; zgrep is an ungated
// bonus clue tool.
export const Q03_OBJECTIVES = [
    {
        name: Q03_OBJECTIVE_IDS.accessHost,
        description: "Access the remote host",
        terminalCommand: "ssh",
    },
    {
        name: Q03_OBJECTIVE_IDS.checkLogs,
        description: "Check the servers system logs",
        unlocksAfter: [Q03_OBJECTIVE_IDS.accessHost],
    },
    {
        name: Q03_OBJECTIVE_IDS.checkTimestamp,
        description: "Check the file timestamp",
        hint: "Try filestat access.log.",
        unlocksAfter: [Q03_OBJECTIVE_IDS.checkLogs],
    },
    {
        name: Q03_OBJECTIVE_IDS.reviewBootHistory,
        description: "Review the boot history",
        hint: "Try bootlog --list-boots.",
        unlocksAfter: [Q03_OBJECTIVE_IDS.checkLogs],
    },
    {
        name: Q03_OBJECTIVE_IDS.checkGatewayLogs,
        description: "Check the gateway logs",
        unlocksAfter: [Q03_OBJECTIVE_IDS.checkTimestamp, Q03_OBJECTIVE_IDS.reviewBootHistory],
    },
    // Optional, visible (per docs/phase13-quest-structure-standard.md §7 —
    // `hidden: true` was live-tested on Q02 and did not surface reliably).
    // Placed after checkGatewayLogs since the backup gap is the same one;
    // not required for reportFindings to unlock.
    {
        name: Q03_OBJECTIVE_IDS.checkBackup,
        description: "Cross-reference the backup archive",
        unlocksAfter: [Q03_OBJECTIVE_IDS.checkGatewayLogs],
    },
    {
        name: Q03_OBJECTIVE_IDS.reportFindings,
        description: "Report findings",
        unlocksAfter: [Q03_OBJECTIVE_IDS.checkGatewayLogs],
    },
];

// The §7 QA-shortcut pattern, available starting Q03 (Q02 was already
// FINAL LOCK when that standard was written, so it kept real gating in
// replay too — see tests/phase13-q02-content.test.ts's note on this).
export const Q03_REPLAY_OBJECTIVES = Q03_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// Reward categories per the recovered Phase 8 economy lock (80 XP
// mandatory, 100 XP max, $300 mandatory-only). `analyzeLogRotation`'s 20 XP
// (originally covering the combined "determine last activity" objective)
// was split into `checkFileTimestamp`/`reviewBootHistory` at 10 XP each
// when that objective was split 2026-09-15 — total mandatory XP unchanged.
export const Q03_REWARDS = {
    investigateServerHistory: 20,
    checkFileTimestamp: 10,
    reviewBootHistory: 10,
    identifyLogGaps: 20,
    correlateMissingRecords: 20,
    checkBackupArchive: 10,
    identifyCriPolicy: 10,
    money: 300,
} as const;

export const Q03_MISSING_LOGS: Quest = {
    id: asId<"Quest">("entity_resolution.q03"),
    chapterId: "chapter-01-ghost-server",
    title: "MISSING LOGS",
    description: `Determine when an old, supposedly decommissioned server on ${Q03_CLIENT_NAME}'s network was last active.`,
    objectives: [
        {
            id: "q03.runtime.completion",
            description: "Q03 canonical completion boundary.",
            condition: flagEquals(Q03_FINAL_STATE_FLAG, true),
        },
    ],
};
