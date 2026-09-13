import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";
import { ADRIAN_COLE } from "./characters.js";
import { Q01_CLIENT_NAME } from "./q01.js";

export const Q02_CLIENT_NAME = Q01_CLIENT_NAME;
export const Q02_TARGET_IP = "203.0.113.77";
export const Q02_WEB_HOST = "edge-03.skynet-logistics.idx";

// The anomalous port 8443 is FORWARDED (not merely open) to a separate
// destination IP, revealed only by `nmap <IP> -sV` (service-version scan).
// HackHub's Website system has no concept of custom ports (confirmed live — a
// non-default port URL fails at the browser/network level before any content
// lookup happens), so the forwarded destination is modeled as its own IP,
// registered directly as a Website host (experimental — not yet live-tested;
// will become session-random once the raw-IP-as-Host mechanism is confirmed).
export const Q02_GATEWAY_IP = "66.250.1.99";
export const Q02_GATEWAY_SERVICE_VERSION = "nginx 1.18.0";
export const Q02_WEB_URL = `https://${Q02_GATEWAY_IP}/`;

export const Q02_HIDDEN_HOSTNAME = "cri-gateway.internal";
export const Q02_HIDDEN_HOSTNAME_IP = "10.42.7.18";

// Shared fixture data — identical between production and replay, so it lives
// here once instead of being duplicated in both quest files.
export interface Q02NmapPort {
    readonly port: number;
    readonly status: "OPEN" | "CLOSE" | "FORWARDED";
    readonly service: string;
    readonly version?: string;
    readonly destination?: string;
}

export const Q02_NMAP_RESULT: Q02NmapPort[] = [
    { port: 22, status: "CLOSE", service: "ssh" },
    { port: 443, status: "OPEN", service: "https" },
    {
        port: 8443,
        status: "FORWARDED",
        service: "https-alt",
        version: Q02_GATEWAY_SERVICE_VERSION,
        destination: Q02_GATEWAY_IP,
    },
];

export const Q02_NETWORK_PORTS = [
    { external: 22, internal: 22, active: true, service: "ssh" },
    { external: 443, internal: 443, active: true, service: "https" },
    { external: 8443, internal: 8443, active: true, service: "https-alt" },
];

// Paces quest completion after the report is submitted: Objective 05 is the
// last objective, so completing it immediately triggers AutoComplete + the
// completion mail. The hold mail itself is sent synchronously (not delayed)
// — confirmed live that Mail.send does not fire reliably from inside a
// setTimeout callback, unlike completeObjective, which does.
export const Q02_COMPLETION_DELAY_MS = 20_000;

export const Q02_EDGE_SITE_NAME = `${Q02_CLIENT_NAME} — Edge Node`;

export const Q02_ADRIAN_EMAIL = ADRIAN_COLE.email;
export const Q02_REPORT_RECIPIENT = Q02_ADRIAN_EMAIL;
export const Q02_REPORT_SUBJECT = "Anomaly Report — Skynet Logistics";

// The three facts the player must discover themselves before reporting
// (anomalous port, the service it identifies as, and the certificate
// issuer). Named so both the freehand report body and the GoMail template's
// field-value validation share one source of truth.
export const Q02_ANOMALOUS_PORT = "8443";
export const Q02_GATEWAY_SERVICE_NAME = "gateway.internal";
export const Q02_CERTIFICATE_ISSUER = "ARKA Secure Infrastructure";

// GoMail compose template with fill-in-the-blank fields for the three facts
// above. Confirmed live: when sent via this template, Mail.Sent's `subject`
// is the template `id` (not `title`/`label`) and `content` is a raw JSON
// object of the field values — not merged template text. Objective 05
// validation (isAnomalyReport) accounts for both this path and freehand
// composition. See docs/phase13-q02-source-recovered.md.
export const Q02_REPORT_TEMPLATE_ID = "entity_resolution.q02.report";
export const Q02_REPORT_TEMPLATE_LABEL = "Anomaly Report";

export const Q02_REPORT_TEMPLATE_CONTENT = [
    `Target: ${Q02_WEB_HOST}`,
    "",
    "Findings:",
    "- Host is absent from provided asset inventory.",
    "- SSH exposed.",
    "- HTTPS exposed on 443.",
    "- Additional HTTPS service exposed on {{anomalousPort}}.",
    "- {{anomalousPort}} identifies itself as {{serviceName}}.",
    "- Certificate issued by {{issuer}}.",
    "",
    "Recommendation: Confirm ownership and purpose of the host.",
].join("\n");

export const Q02_REPORT_BODY = [
    `Target: ${Q02_WEB_HOST}`,
    "",
    "Findings:",
    "- Host is absent from provided asset inventory.",
    "- SSH exposed.",
    "- HTTPS exposed on 443.",
    `- Additional HTTPS service exposed on ${Q02_ANOMALOUS_PORT}.`,
    `- ${Q02_ANOMALOUS_PORT} identifies itself as ${Q02_GATEWAY_SERVICE_NAME}.`,
    `- Certificate issued by ${Q02_CERTIFICATE_ISSUER}.`,
    "",
    "Recommendation: Confirm ownership and purpose of the host.",
].join("\n");

export const Q02_INCOMING_MAIL_SUBJECT = "One more thing";

export const Q02_INCOMING_MAIL_CONTENT = [
    "Client has one more thing.",
    "",
    "Their external scan doesn't match their internal asset list.",
    "Can you take a look?",
    "",
    `Host: ${Q02_WEB_HOST}`,
    "",
    "It may just be an old asset. Check before I tell the client.",
    "",
    "— Adrian",
].join("\n");

export const Q02_HOLD_MAIL_CONTENT = [
    "Don't send this to the client yet.",
    "",
    "I want to confirm something first.",
    "Just leave it for now. I'll get back to you.",
    "",
    "— Adrian",
].join("\n");

// Two named variants (not one shared constant) since the wording genuinely
// differs: production mentions the real money reward, replay does not.
export const Q02_COMPLETION_MAIL_CONTENT_PRODUCTION = [
    "Good catch. I'll handle it from here.",
    "",
    "And don't run another scan on that host.",
    "",
    "Payment's on the way.",
    "",
    "— Adrian",
].join("\n");

export const Q02_COMPLETION_MAIL_CONTENT_REPLAY = [
    "Good catch. I'll handle it from here.",
    "",
    "And don't run another scan on that host.",
    "",
    "DEV replay complete.",
    "",
    "— Adrian",
].join("\n");

export const Q02_FINAL_STATE_FLAG = "entity_resolution.q02.completed";

export const Q02_OBJECTIVE_IDS = {
    checkTarget: "q02.objective.01",
    scanHost: "q02.objective.02",
    identifyService: "q02.objective.03",
    inspectCertificate: "q02.objective.04",
    reportAnomaly: "q02.objective.05",
} as const;

// Identical between production and replay (unlike Q01, whose last objective's
// hint text deliberately differs between the two).
export const Q02_OBJECTIVES = [
    {
        name: Q02_OBJECTIVE_IDS.checkTarget,
        description: "Check the new target",
    },
    {
        name: Q02_OBJECTIVE_IDS.scanHost,
        description: "Scan the host",
        terminalCommand: "nmap",
        hint: "Resolve the hostname.",
        unlocksAfter: [Q02_OBJECTIVE_IDS.checkTarget],
    },
    {
        name: Q02_OBJECTIVE_IDS.identifyService,
        description: "Identify the service",
        unlocksAfter: [Q02_OBJECTIVE_IDS.scanHost],
    },
    {
        name: Q02_OBJECTIVE_IDS.inspectCertificate,
        description: "Inspect the certificate",
        unlocksAfter: [Q02_OBJECTIVE_IDS.identifyService],
    },
    {
        name: Q02_OBJECTIVE_IDS.reportAnomaly,
        description: "Report the anomaly",
        unlocksAfter: [Q02_OBJECTIVE_IDS.inspectCertificate],
    },
];

// Reward categories per the recovered Phase 8 economy lock. Granted as a lump
// sum on completion, same as Q01 — these names are documentation, not
// separately-triggered events. "identifyCriHostname" is the hidden
// certificate-SAN clue found inside Objective 04, not a 6th objective.
export const Q02_REWARDS = {
    investigateTarget: 20,
    serviceEnumeration: 15,
    certificateInspection: 15,
    reportAnomaly: 20,
    identifyCriHostname: 10,
    checkDns: 10,
    money: 250,
} as const;

export const Q02_THE_ANOMALY: Quest = {
    id: asId<"Quest">("entity_resolution.q02"),
    chapterId: "chapter-01-ghost-server",
    title: "THE ANOMALY",
    description: `Investigate an unregistered host discovered on ${Q02_CLIENT_NAME}'s network.`,
    objectives: [
        {
            id: "q02.runtime.completion",
            description: "Q02 canonical completion boundary.",
            condition: flagEquals(Q02_FINAL_STATE_FLAG, true),
        },
    ],
};
