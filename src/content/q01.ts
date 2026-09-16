import type { QuestHackhubPostDefinition } from "@hotbunny/hackhub-content-sdk";

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";
import { ADRIAN_COLE } from "./characters.js";

export const Q01_CLIENT_NAME = "Skynet Logistics";
export const Q01_TARGET_IP = "203.0.113.42";
export const Q01_WEB_HOST = "skynet-logistics.idx";
export const Q01_WEB_HOME_HOST = `www.${Q01_WEB_HOST}`;
export const Q01_WEB_HOME_URL = `https://${Q01_WEB_HOME_HOST}/`;

// Backwards-compatible alias for callers that treat the public HTTPS surface as the home URL.
export const Q01_WEB_HTTPS_URL = Q01_WEB_HOME_URL;

// Experimental path-based redesign: the audited surface is exactly one public
// host with several pages, discovered by path (dirhunter-style) instead of
// separate subdomains. Not yet locked — see docs/source-current.md.
export const Q01_WEB_AUDIT_PATH = "/security";
export const Q01_WEB_FORBIDDEN_PATHS = ["/portal", "/status"] as const;
export const Q01_WEB_PATHS = [
    "/",
    ...Q01_WEB_FORBIDDEN_PATHS,
    Q01_WEB_AUDIT_PATH,
] as const;
export const Q01_WEB_AUDIT_URL = `https://${Q01_WEB_HOME_HOST}${Q01_WEB_AUDIT_PATH}`;

export const Q01_LYNX_INPUT_IP = Q01_TARGET_IP;
export const Q01_LYNX_INPUT_URL = `https://${Q01_TARGET_IP}/`;

// Shared fixture data — identical between production and replay, so it lives
// here once instead of being duplicated in both quest files.
export interface Q01NmapPort {
    readonly port: number;
    readonly status: "OPEN" | "CLOSE";
    readonly service: string;
}

export const Q01_NMAP_RESULT: Q01NmapPort[] = [
    { port: 22, status: "CLOSE", service: "ssh" },
    { port: 80, status: "CLOSE", service: "http" },
    { port: 443, status: "OPEN", service: "https" },
];

export interface Q01LynxResult {
    readonly ips: string[];
    readonly address: string[];
    readonly additional?: string[];
}

export const Q01_LYNX_RESULT: Q01LynxResult = {
    ips: [Q01_TARGET_IP],
    address: [Q01_WEB_HOME_URL],
    additional: [
        Q01_CLIENT_NAME,
        "Jakarta Operations",
        "Canonical public web host discovered from the target IP.",
    ],
};

export const Q01_NETWORK_PORTS = [
    { external: 22, internal: 22, active: false, service: "ssh" },
    { external: 80, internal: 80, active: false, service: "http" },
    { external: 443, internal: 443, active: true, service: "https" },
];

export const Q01_ADRIAN_EMAIL = ADRIAN_COLE.email;
export const Q01_REPORT_RECIPIENT = Q01_ADRIAN_EMAIL;
export const Q01_REPORT_SUBJECT = "Security Audit — Jakarta";
export const Q01_OPEN_PORTS = "443";

// HackHub feed post shown before the quest is claimed. A short teaser that
// points to the mail for details, rather than repeating the mail's content —
// matches the pattern agreed for Q02 and locked as standard for Q03-Q16 (see
// docs/implementation-rules.md).
export const Q01_HACKHUB_POST_PRODUCTION: QuestHackhubPostDefinition = {
    content: "Short audit for a client in Jakarta. Details in your mail.",
    author: {
        name: "Adrian Cole",
        avatar: "assets/adrian-cole.png",
    },
};

// Adrian's opening mail. Reuses Q01_REPORT_SUBJECT as its
// subject (a single mail thread runs from this brief through the report to
// the completion reply) — an intentional exception to the separate-subject
// pattern locked for Q03-Q16; Q01 is FINAL LOCK and this threading is
// already live-proven, so it is kept as historical precedent rather than
// retrofitted.
export const Q01_INCOMING_MAIL_CONTENT = [
    "I have a client looking for a short security audit.",
    "",
    "Nothing complicated.",
    "One external network.",
    "A few services.",
    "Basic vulnerability assessment.",
    "",
    "CLIENT",
    "Location: Jakarta",
    `Target: ${Q01_TARGET_IP}`,
    "",
    "Scope:",
    "External infrastructure only.",
    "",
    "Authorized:",
    "Network discovery",
    "Service enumeration",
    "Basic vulnerability checks",
    "",
    "Not Authorized:",
    "Data extraction",
    "Internal access",
    "Credential attacks",
    "",
    "— Adrian",
].join("\n");

// GoMail compose template with fill-in-the-blank fields for the facts the
// player must discover themselves. Mirrors Q02's Mail.registerTemplate setup
// — replaces dumping this text as plain-text instructions inside the incoming
// mail. Confirmed live (via Q02): under this mod's API-v1 compatibility mode,
// sending via a registered template does NOT merge {{field}} into rendered
// text — Mail.Sent's `subject` is the template id and `content` is a raw
// JSON object of the field values. isAuditReport validates that path too.
export const Q01_REPORT_TEMPLATE_ID = "entity_resolution.q01.report";
export const Q01_REPORT_TEMPLATE_LABEL = "Audit Report";

// Paces the report-submission sequence: Q01 has no intermediate "hold" mail
// like Q02, so this is the only delay — submitAudit (the last objective)
// doesn't complete instantly, so the completion mail + reward don't land the
// same tick the report is sent.
export const Q01_SUBMIT_AUDIT_DELAY_MS = 7_000;

export const Q01_COMPLETION_MAIL_CONTENT_PRODUCTION = [
    "Looks clean.",
    "",
    "Client should be happy.",
    "",
    "Payment's on the way.",
    "",
    "I'll let you know if they need anything else.",
    "",
    "— Adrian",
].join("\n");

export const Q01_REPORT_BODY_TEMPLATE = [
    "Target: {{company}}",
    "",
    "Findings:",
    "- Open ports: {{ports}}",
    "- Public web presence: {{url}}",
    "- No critical vulnerabilities identified.",
    "",
    "Recommendation: Further internal assessment is recommended.",
].join("\n");

export const Q01_REPORT_BODY = [
    `Target: ${Q01_CLIENT_NAME}`,
    "",
    "Findings:",
    `- Open ports: ${Q01_OPEN_PORTS}`,
    `- Public web presence: ${Q01_WEB_AUDIT_URL}`,
    "- No critical vulnerabilities identified.",
    "",
    "Recommendation: Further internal assessment is recommended.",
].join("\n");

export const Q01_FINAL_STATE_FLAG = "entity_resolution.q01.completed";

export const Q01_OBJECTIVE_IDS = {
    reviewScope: "q01.objective.01",
    scanNetwork: "q01.objective.02",
    identifyServices: "q01.objective.03",
    enumeratePaths: "q01.objective.04",
    basicVulnerabilityChecks: "q01.objective.05",
    submitAudit: "q01.objective.06",
} as const;

// Identical between production and replay (matching Q02_OBJECTIVES) — the
// submitAudit hint was removed because the GoMail compose template now
// teaches the report format interactively instead of via static text.
export const Q01_OBJECTIVES = [
    {
        name: Q01_OBJECTIVE_IDS.reviewScope,
        description: "Review audit scope",
    },
    {
        name: Q01_OBJECTIVE_IDS.scanNetwork,
        description: "Scan the ip target",
        terminalCommand: "nmap",
        unlocksAfter: [Q01_OBJECTIVE_IDS.reviewScope],
    },
    {
        name: Q01_OBJECTIVE_IDS.identifyServices,
        description: "Identify the exposed web presence",
        terminalCommand: "lynx",
        unlocksAfter: [Q01_OBJECTIVE_IDS.scanNetwork],
    },
    {
        name: Q01_OBJECTIVE_IDS.enumeratePaths,
        description: "Enumerate hidden pages",
        terminalCommand: "dirhunter",
        unlocksAfter: [Q01_OBJECTIVE_IDS.identifyServices],
    },
    {
        name: Q01_OBJECTIVE_IDS.basicVulnerabilityChecks,
        description: "Perform basic vulnerability checks",
        hint: "Inspect the authorized security page you discovered.",
        unlocksAfter: [Q01_OBJECTIVE_IDS.enumeratePaths],
    },
    {
        name: Q01_OBJECTIVE_IDS.submitAudit,
        description: "Submit audit report",
        unlocksAfter: [Q01_OBJECTIVE_IDS.basicVulnerabilityChecks],
    },
];

export const Q01_REWARDS = {
    externalAudit: 35,
    networkServiceEnumeration: 20,
    basicVulnerabilityAssessment: 10,
    submitCorrectReport: 15,
    money: 200,
} as const;

export const Q01_THE_CONTRACT: Quest = {
    id: asId<"Quest">("entity_resolution.q01"),
    chapterId: "chapter-01-ghost-server",
    title: "THE CONTRACT",
    description: `Routine security audit for ${Q01_CLIENT_NAME} in Jakarta.`,
    objectives: [
        {
            id: "q01.runtime.completion",
            description: "Q01 canonical completion boundary.",
            condition: flagEquals(Q01_FINAL_STATE_FLAG, true),
        },
    ],
};
