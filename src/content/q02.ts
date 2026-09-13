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

export const Q02_EDGE_SITE_NAME = `${Q02_CLIENT_NAME} — Edge Node`;

export const Q02_ADRIAN_EMAIL = ADRIAN_COLE.email;
export const Q02_REPORT_RECIPIENT = Q02_ADRIAN_EMAIL;
export const Q02_REPORT_SUBJECT = "Anomaly Report — edge-03";

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

export const Q02_COMPLETION_MAIL_CONTENT = [
    "Good catch. I'll handle it from here.",
    "",
    "And don't run another scan on that host.",
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
