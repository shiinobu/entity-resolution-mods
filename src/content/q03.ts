import type {
    QuestDialogDefinition,
    QuestDialogSpeech,
    QuestHackhubPostDefinition,
    ScheduleDelay,
} from "@hotbunny/hackhub-content-sdk";

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

export const Q03_CLIENT_NAME = Q02_CLIENT_NAME;
export const Q03_TARGET_IP = Q02_TARGET_IP;
export const Q03_WEB_HOST = Q02_WEB_HOST;

export const Q03_ROUTER_IP = "203.0.113.1";

export const Q03_SSH_USERNAME = "auditor";
export const Q03_SSH_PASSWORD = "Kx8!rTn2Vq";
export const Q03_SSH_PORT = 22;

export const Q03_ACCESS_ATTACHMENT_NAME = "old-creds";
export const Q03_ACCESS_ATTACHMENT_EXTENSION = "bak";
export const Q03_ACCESS_HASH =
    "1b4fc73dbe8fd970afadc3731b0626752cf425944616b528f12234b923e0d5d4";

export const Q03_NETWORK_PORTS = [
    { external: Q03_SSH_PORT, internal: Q03_SSH_PORT, active: true, service: "ssh" },
];

export interface Q03NmapPort {
    readonly port: number;
    readonly status: "OPEN" | "CLOSE";
    readonly service: string;
}

export const Q03_NMAP_RESULT: Q03NmapPort[] = [
    { port: Q03_SSH_PORT, status: "OPEN", service: "ssh" },
];

export const Q03_ADRIAN_EMAIL = ADRIAN_COLE.email;
export const Q03_REPORT_SUBJECT = "Server History Report — Skynet Logistics";

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

export const Q03_INCOMING_MAIL_SUBJECT = "Re: edge-03";

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
    "Old access backup attached.",
    "",
    "Don't touch anything else.",
    "",
    "— Adrian",
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

export const Q03_FINAL_STATE_FLAG = "entity_resolution.q03.completed";
export const Q03_LOGS_MISSING_FLAG = "entity_resolution.q03.logs_missing";
export const Q03_BACKUP_CHECKED_FLAG = "entity_resolution.q03.backup_checked";
export const Q03_BACKUP_RESTRICTED_FLAG = "entity_resolution.q03.backup_restricted";
export const Q03_CRI_POLICY_FOUND_FLAG = "entity_resolution.q03.cri_policy_found";

export const Q03_OBJECTIVE_IDS = {
    findAccess: "q03.objective.00",
    accessHost: "q03.objective.01",
    checkLogs: "q03.objective.02",
    checkTimestamp: "q03.objective.03",
    reviewBootHistory: "q03.objective.04",
    checkGatewayLogs: "q03.objective.05",
    checkBackup: "q03.objective.05b",
    reportFindings: "q03.objective.06",
} as const;

export const Q03_OBJECTIVES = [
    {
        name: Q03_OBJECTIVE_IDS.findAccess,
        description: "Dig up the SSH credentials",
    },
    {
        name: Q03_OBJECTIVE_IDS.accessHost,
        description: "Access the remote host",
        terminalCommand: "ssh",
        unlocksAfter: [Q03_OBJECTIVE_IDS.findAccess],
    },
    {
        name: Q03_OBJECTIVE_IDS.checkLogs,
        description: "Check the servers system logs",
        unlocksAfter: [Q03_OBJECTIVE_IDS.accessHost],
    },
    {
        name: Q03_OBJECTIVE_IDS.checkTimestamp,
        description: "Check the file timestamp",
        terminalCommand: "filestat",
        unlocksAfter: [Q03_OBJECTIVE_IDS.checkLogs],
    },
    {
        name: Q03_OBJECTIVE_IDS.reviewBootHistory,
        description: "Review the boot history",
        terminalCommand: "bootlog",
        unlocksAfter: [Q03_OBJECTIVE_IDS.checkLogs],
    },
    {
        name: Q03_OBJECTIVE_IDS.checkGatewayLogs,
        description: "Check the gateway logs",
        terminalCommand: "ls",
        hint: "Try zgrep to search the archived gateway logs.",
        unlocksAfter: [Q03_OBJECTIVE_IDS.checkTimestamp, Q03_OBJECTIVE_IDS.reviewBootHistory],
    },
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

export const Q03_REPORT_CALLBACK_DELAY: ScheduleDelay = { days: 1 };
export const Q03_POST_WAIT_DIALOG_DELAY_MS = 5_000;

const Q03_POST_REPORT_INTRO: QuestDialogSpeech[] = [
    { speaker: "Adrian", text: "Thanks. I'll forward this to the client.", audio: "", timeout: 3000 },
    { speaker: "Adrian", text: "Actually, hold on.", audio: "", timeout: 3000 },
    {
        speaker: "Adrian",
        text: "Don't include the backup finding in the client report yet.",
        audio: "",
        timeout: 3000,
    },
    { speaker: "player", text: "Why?", audio: "", timeout: 3000 },
    { speaker: "Adrian", text: "Because I don't know what it means.", audio: "", timeout: 3000 },
    { speaker: "player", text: "The logs are missing.", audio: "", timeout: 3000 },
    { speaker: "Adrian", text: "I know.", audio: "", timeout: 3000 },
];

const Q03_POST_REPORT_BACKUP_EXTRA: QuestDialogSpeech[] = [
    { speaker: "player", text: "And the backup is restricted.", audio: "", timeout: 3000 },
    { speaker: "Adrian", text: "I know that too.", audio: "", timeout: 3000 },
];

const Q03_POST_REPORT_CLOSING: QuestDialogSpeech[] = [
    {
        speaker: "Adrian",
        text: "Just leave it for now.",
        audio: "",
        options: [
            {
                label: "Then why are you asking me to stop?",
                text: "Then why are you asking me to stop?",
                switchBranch: "postReportA",
                audio: "",
            },
            {
                label: "Fine. I'll leave it.",
                text: "Fine. I'll leave it.",
                switchBranch: "postReportB",
                audio: "",
            },
            {
                label: "I think someone removed the logs.",
                text: "I think someone removed the logs.",
                switchBranch: "postReportC",
                audio: "",
            },
        ],
    },
];

export const Q03_DIALOG: QuestDialogDefinition = {
    postReportMain: [
        ...Q03_POST_REPORT_INTRO,
        ...Q03_POST_REPORT_CLOSING,
    ],
    postReportMainWithBackup: [
        ...Q03_POST_REPORT_INTRO,
        ...Q03_POST_REPORT_BACKUP_EXTRA,
        ...Q03_POST_REPORT_CLOSING,
    ],
    postReportA: [
        {
            speaker: "Adrian",
            text: "Because I don't want a routine audit turning into something I can't explain to the client.",
            audio: "",
            isEnd: true,
        },
    ],
    postReportB: [
        {
            speaker: "Adrian",
            text: "Appreciate it.",
            audio: "",
            isEnd: true,
        },
    ],
    postReportC: [
        {
            speaker: "Adrian",
            text: "Don't make that assumption yet.",
            audio: "",
            isEnd: true,
        },
    ],
};

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
