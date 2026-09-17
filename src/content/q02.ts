import type { QuestHackhubPostDefinition } from "@hotbunny/hackhub-content-sdk";

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";
import { ADRIAN_COLE } from "./characters.js";
import { Q01_CLIENT_NAME } from "./q01.js";

export const Q02_CLIENT_NAME = Q01_CLIENT_NAME;
export const Q02_TARGET_IP = "203.0.113.77";
export const Q02_WEB_HOST = "edge-03.skynet-logistics.idx";

export const Q02_GATEWAY_IP = "66.250.1.99";
export const Q02_GATEWAY_SERVICE_VERSION = "nginx 1.18.0";

export const Q02_HIDDEN_HOSTNAME = "cri-gateway.internal";
export const Q02_HIDDEN_HOSTNAME_IP = "10.42.7.18";

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

export const Q02_COMPLETION_DELAY_MS = 20_000;

export const Q02_EDGE_SITE_NAME = `${Q02_CLIENT_NAME} — Edge Node`;

export const Q02_ADRIAN_EMAIL = ADRIAN_COLE.email;
export const Q02_REPORT_SUBJECT = "Anomaly Report — Skynet Logistics";

export const Q02_ANOMALOUS_PORT = "8443";
export const Q02_GATEWAY_SERVICE_NAME = "gateway.internal";
export const Q02_CERTIFICATE_ISSUER = "ARKA Secure Infrastructure";

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

export const Q02_HACKHUB_POST_PRODUCTION: QuestHackhubPostDefinition = {
    content: "Follow-up from the last client. Check your mail.",
    author: {
        name: "Adrian Cole",
        avatar: "assets/adrian-cole.png",
    },
};

export const Q02_INCOMING_MAIL_SUBJECT = "Quick follow-up";

export const Q02_INCOMING_MAIL_CONTENT = [
    "Got a small follow-up from the client after your last report.",
    "",
    "FOLLOW-UP",
    `Client: ${Q02_CLIENT_NAME}`,
    `Host: ${Q02_WEB_HOST}`,
    "Note: Not listed in their asset inventory.",
    "",
    "Might just be something old they forgot about. Check it before I bring it up with them.",
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

export const Q02_COMPLETION_MAIL_CONTENT_PRODUCTION = [
    "Good catch. I'll handle it from here.",
    "",
    "And don't run another scan on that host.",
    "",
    "Payment's on the way.",
    "",
    "— Adrian",
].join("\n");

export const Q02_FINAL_STATE_FLAG = "entity_resolution.q02.completed";

export const Q02_OBJECTIVE_IDS = {
    checkTarget: "q02.objective.01",
    scanHost: "q02.objective.02",
    identifyService: "q02.objective.03",
    checkDns: "q02.objective.03b",
    inspectCertificate: "q02.objective.04",
    reportAnomaly: "q02.objective.05",
} as const;

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
        name: Q02_OBJECTIVE_IDS.checkDns,
        description: "Check the DNS",
        hidden: true,
        unlocksAfter: [Q02_OBJECTIVE_IDS.identifyService],
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
