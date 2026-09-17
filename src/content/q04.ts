import type {
    QuestDialogDefinition,
    QuestDialogSpeech,
    QuestHackhubPostDefinition,
    ScheduleDelay,
} from "@hotbunny/hackhub-content-sdk";

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";
import {
    Q03_ADRIAN_EMAIL,
    Q03_ROUTER_IP,
    Q03_SSH_PASSWORD,
    Q03_SSH_USERNAME,
    Q03_TARGET_IP,
    Q03_WEB_HOST,
} from "./q03.js";

export { Q04_ROOT_FILES } from "./q04-filesystem.js";

export const Q04_TARGET_IP = Q03_TARGET_IP;
export const Q04_WEB_HOST = Q03_WEB_HOST;
export const Q04_ROUTER_IP = Q03_ROUTER_IP;
export const Q04_SSH_USERNAME = Q03_SSH_USERNAME;
export const Q04_SSH_PASSWORD = Q03_SSH_PASSWORD;
export const Q04_ADRIAN_EMAIL = Q03_ADRIAN_EMAIL;

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
    checkLastConnection: "q04.objective.04b",
} as const;

export const Q04_OBJECTIVES = [
    {
        name: Q04_OBJECTIVE_IDS.reviewDecommissionNotice,
        description: "Review the decommission notice",
    },
    {
        name: Q04_OBJECTIVE_IDS.verifyServerStatus,
        description: "Verify the server is still active",
        unlocksAfter: [Q04_OBJECTIVE_IDS.reviewDecommissionNotice],
    },
    {
        name: Q04_OBJECTIVE_IDS.closeAudit,
        description: "Close the audit",
        unlocksAfter: [Q04_OBJECTIVE_IDS.verifyServerStatus],
    },
    {
        name: Q04_OBJECTIVE_IDS.decideOnEvidence,
        description: "Decide what to do with the remaining evidence",
        unlocksAfter: [Q04_OBJECTIVE_IDS.closeAudit],
    },
    {
        name: Q04_OBJECTIVE_IDS.checkLastConnection,
        description: "Investigate the last recorded connection",
        unlocksAfter: [Q04_OBJECTIVE_IDS.decideOnEvidence],
        hidden: true,
    },
];

export const Q04_REPLAY_OBJECTIVES = Q04_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

export const Q04_REWARDS = {
    verifyDecommissionStatus: 20,
    investigateActiveServer: 20,
    analyzeLastConnection: 20,
    identifyAuthLogMismatch: 20,
    preserveAnomalousEvidence: 20,
    money: 350,
} as const;

export const Q04_FINAL_STATE_FLAG = "entity_resolution.q04.completed";
export const Q04_LAST_CONNECTION_CHECKED_FLAG = "entity_resolution.q04.last_connection_checked";
export const Q04_CRI_IP_CONFIRMED_FLAG = "entity_resolution.q04.cri_ip_confirmed";
export const Q04_LOG_MISMATCH_FOUND_FLAG = "entity_resolution.q04.log_mismatch_found";

export const Q04_INCOMING_MAIL_SUBJECT = "Re: edge-03";
export const Q04_INCOMING_MAIL_CONTENT = [
    "Heads up — client just confirmed edge-03 is being taken offline.",
    "",
    "They want the audit wrapped up, no further digging.",
    "",
    "I know how that sounds. Just close it.",
    "",
    "— Adrian",
].join("\n");

export const Q04_DECOMMISSION_NOTICE_SUBJECT = "Confirmation of Scheduled Decommission: edge-03";
export const Q04_DECOMMISSION_NOTICE_CONTENT = [
    "Skynet Logistics",
    "IT Operations",
    "",
    "Subject: Decommission Confirmation — edge-03",
    "",
    "To the Audit Team,",
    "",
    `This letter serves as formal confirmation that the infrastructure identified as ${Q04_WEB_HOST} has been scheduled for decommissioning as part of our ongoing infrastructure consolidation.`,
    "",
    "No further security assessment of this asset is required. We ask that the associated audit be closed accordingly.",
    "",
    "Scheduled decommission date: September 9, 2026, 23:00.",
    "",
    "Thank you for your continued diligence on this engagement.",
    "",
    "Regards,",
    "IT Operations Division",
    "Skynet Logistics",
].join("\n");

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

export const Q04_CLOSE_AUDIT_REPORT_CONTENT = [
    "No active critical vulnerability identified.",
    "",
    "Infrastructure is scheduled for decommissioning.",
].join("\n");

export const Q04_CLOSE_AUDIT_NOTE_CONTENT =
    "Additional investigation was not completed because the client requested closure.";

export const Q04_CLOSE_AUDIT_REPORT_WITH_NOTE_CONTENT = [
    Q04_CLOSE_AUDIT_REPORT_CONTENT,
    "",
    Q04_CLOSE_AUDIT_NOTE_CONTENT,
].join("\n");

export const Q04_CLOSE_AUDIT_TEMPLATE_ID = "entity_resolution.q04.close-audit";
export const Q04_CLOSE_AUDIT_TEMPLATE_LABEL = "Close Audit";

export const Q04_CLOSE_AUDIT_NOTE_TEMPLATE_ID = "entity_resolution.q04.close-audit-note";
export const Q04_CLOSE_AUDIT_NOTE_TEMPLATE_LABEL = "Close Audit (add a note)";
export const Q04_CLOSE_AUDIT_NOTE_TEMPLATE_CONTENT = [
    Q04_CLOSE_AUDIT_REPORT_CONTENT,
    "",
    "{{note}}",
].join("\n");

export const Q04_CLOSE_AUDIT_CALLBACK_DELAY: ScheduleDelay = { days: 1 };
export const Q04_SHOW_RELAY_WIDGET_DELAY: ScheduleDelay = { realMs: 500 };
export const Q04_POST_WAIT_DIALOG_DELAY_MS = 5_000;

export const Q04_UNKNOWN_RELAY_WIDGET_ID = "entity_resolution.q04.unknown-relay";
export const Q04_UNKNOWN_RELAY_WIDGET_SRC = "widgets/q04-unknown-relay.html";
export const Q04_UNKNOWN_RELAY_WIDGET_WIDTH = 480;
export const Q04_UNKNOWN_RELAY_WIDGET_HEIGHT = 600;
export const Q04_UNKNOWN_RELAY_WIDGET_POSITION = { x: 450, y: 90 };
export const Q04_UNKNOWN_RELAY_WIDGET_DURATION_MS = 20_000;

export const Q04_HACKHUB_POST_PRODUCTION: QuestHackhubPostDefinition = {
    content: "Client update on edge-03. Check your mail.",
    author: {
        name: "Adrian Cole",
        avatar: "assets/adrian-cole.png",
    },
};

const Q04_DECIDE_ON_EVIDENCE_PROMPT: QuestDialogSpeech[] = [
    { speaker: "Adrian", text: "Audit's closed. Client's happy.", audio: "", timeout: 3000 },
    {
        speaker: "Adrian",
        text: "So what do you want to do with what you found?",
        audio: "",
        options: [
            {
                label: "Leave it alone.",
                text: "Leave it alone.",
                switchBranch: "evidenceLeaveAlone",
                audio: "",
            },
            {
                label: "I'm keeping a copy.",
                text: "I'm keeping a copy.",
                switchBranch: "evidenceKeepCopy",
                audio: "",
            },
            {
                label: "I want to take one last look first.",
                text: "I want to take one last look first.",
                switchBranch: "evidenceLastLook",
                audio: "",
            },
        ],
    },
];

export const Q04_DIALOG: QuestDialogDefinition = {
    decideOnEvidence: Q04_DECIDE_ON_EVIDENCE_PROMPT,
    evidenceLeaveAlone: [
        { speaker: "Adrian", text: "Good. Some things are better left closed.", audio: "", isEnd: true },
    ],
    evidenceKeepCopy: [
        { speaker: "Adrian", text: "Your call. Just don't put it in the report.", audio: "", isEnd: true },
    ],
    evidenceLastLook: [
        { speaker: "Adrian", text: "Make it quick. The client thinks this is done.", audio: "", isEnd: true },
    ],
};

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
