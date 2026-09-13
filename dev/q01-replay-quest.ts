import {
    Mail,
    Network,
    Quest as HackHubQuest,
    RegisterQuest,
    Shell,
} from "@hotbunny/hackhub-content-sdk";

import {
    Q01_ADRIAN_EMAIL,
    Q01_CLIENT_NAME,
    Q01_LYNX_INPUT_IP,
    Q01_LYNX_INPUT_URL,
    Q01_OBJECTIVE_IDS,
    Q01_REPORT_BODY,
    Q01_REPORT_BODY_TEMPLATE,
    Q01_REPORT_SUBJECT,
    Q01_TARGET_IP,
    Q01_WEB_AUDIT_PATH,
    Q01_WEB_HOME_URL,
    Q01_WEB_HOME_HOST,
} from "../src/content/q01.js";

import { DEV_Q01_REPLAY_ID } from "./replay-id.generated.js";

interface Q01ReplayData {
    readonly targetIp: string;
    readonly auditScopeReviewed: boolean;
    readonly networkScanned: boolean;
    readonly lynxDiscovered: boolean;
    readonly pathsDiscovered: boolean;
    readonly basicVulnerabilityChecksCompleted: boolean;
    readonly reportSubmitted: boolean;
}

interface TerminalCommandData {
    readonly command: string;
    readonly args: string[];
}

interface BrowserMetaData {
    readonly protocol: string;
    readonly hostname: string;
    readonly pathname: string;
}

interface DirhunterData {
    readonly host: string;
    readonly results: string[];
}

interface MailReadData {
    readonly from: string;
    readonly subject: string;
}

interface Q01LynxResult {
    readonly ips?: string[];
    readonly address?: string[];
    readonly additional?: string[];
}

interface Q01NmapPort {
    readonly port: number;
    readonly status: "OPEN" | "CLOSE";
    readonly service: string;
}

const Q01_NMAP_RESULT: Q01NmapPort[] = [
    { port: 22, status: "CLOSE", service: "ssh" },
    { port: 80, status: "CLOSE", service: "http" },
    { port: 443, status: "OPEN", service: "https" },
];

const Q01_LYNX_RESULT: Q01LynxResult = {
    ips: [Q01_TARGET_IP],
    address: [Q01_WEB_HOME_URL],
    additional: [
        Q01_CLIENT_NAME,
        "Jakarta Operations",
        "Canonical public web host discovered from the target IP.",
    ],
};

const resetQ01ShellFixtures = (): void => {
    Shell.removeCommandData("nmap", Q01_TARGET_IP);
    Shell.removeCommandData("nmap", "");
    Shell.removeCommandData("lynx", Q01_LYNX_INPUT_IP);
    Shell.removeCommandData("lynx", Q01_LYNX_INPUT_URL);
};

const normalizeHost = (rawHost: string): string | null => {
    const value = rawHost.trim().replace(/^['"]|['"]$/g, "");

    if (!value) {
        return null;
    }

    try {
        const url = value.includes("://")
            ? new URL(value)
            : new URL(`https://${value}`);

        return url.hostname.toLowerCase().replace(/\.$/, "");
    } catch {
        return null;
    }
};

const isExpectedDirhunterHost = (rawHost: string): boolean =>
    normalizeHost(rawHost) === Q01_WEB_HOME_HOST;

const Q01_INCOMING_MAIL_CONTENT = [
    "DEV REPLAY — Q01 TEST CONTRACT",
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
    "Format report audit:",
    `Subject: ${Q01_REPORT_SUBJECT}`,
    "",
    Q01_REPORT_BODY_TEMPLATE,
    "",
    "This mail belongs to the development replay fixture.",
    "— Adrian",
].join("\n");

const Q01_COMPLETION_MAIL_CONTENT = [
    "Looks clean.",
    "",
    "Client should be happy.",
    "",
    "DEV replay complete.",
    "",
    "— Adrian",
].join("\n");

export const Q01_REPLAY_QUEST_NAME = `entity_resolution.dev.q01.${DEV_Q01_REPLAY_ID}`;

@RegisterQuest
export class EntityResolutionQ01ReplayQuest extends HackHubQuest<Q01ReplayData> {
    override Name = Q01_REPLAY_QUEST_NAME;
    override Title = "THE CONTRACT — DEV REPLAY";
    override Description =
        "Development replay fixture for the revised Q01 reconnaissance flow.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override Rewards = { money: 0, xp: 0 };
    override HackhubPost = {
        content:
            `DEV REPLAY #${DEV_Q01_REPLAY_ID} — Q01 live-testing fixture. Apply to replay THE CONTRACT.`,
        author: {
            name: "Adrian Cole [DEV]",
            avatar: "assets/adrian-cole.png",
        },
    };

    override Objectives = [
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
            hint: `Fill in the company, open-port, and url links you discovered.`,
            unlocksAfter: [Q01_OBJECTIVE_IDS.basicVulnerabilityChecks],
        },
    ];

    override CreateData(): Q01ReplayData {
        return {
            targetIp: Q01_TARGET_IP,
            auditScopeReviewed: false,
            networkScanned: false,
            lynxDiscovered: false,
            pathsDiscovered: false,
            basicVulnerabilityChecksCompleted: false,
            reportSubmitted: false,
        };
    }

    override OnStart() {
        Network.createSubnetNetwork({
            ip: this.Data.targetIp,
            type: Network.Type.Router,
            ports: [
                { external: 22, internal: 22, active: false, service: "ssh" },
                { external: 80, internal: 80, active: false, service: "http" },
                { external: 443, internal: 443, active: true, service: "https" },
            ],
            users: [],
            children: [],
        });

        Network.registerDomain(Q01_WEB_HOME_HOST, this.Data.targetIp);

        Mail.send({
            from: Q01_ADRIAN_EMAIL,
            subject: Q01_REPORT_SUBJECT,
            content: Q01_INCOMING_MAIL_CONTENT,
        });
    }

    override OnObjectivesStart() {
        resetQ01ShellFixtures();
        Shell.addCommandData("nmap", this.Data.targetIp, Q01_NMAP_RESULT);
        Shell.addCommandData("nmap", "", Q01_NMAP_RESULT);
        Shell.addCommandData("lynx", Q01_LYNX_INPUT_IP, Q01_LYNX_RESULT);
        Shell.addCommandData("lynx", Q01_LYNX_INPUT_URL, Q01_LYNX_RESULT);

        this.Events.on("Mail.Read", (data) => {
            this.handleMailRead(data as MailReadData);
        });

        this.Events.on("Terminal.Command", (data) => {
            this.handleTerminalCommand(data as TerminalCommandData);
        });

        this.Events.on("Browser.Meta", (data) => {
            this.handleBrowserMeta(data as BrowserMetaData);
        });

        this.Events.on("Terminal.Dirhunter", (data) => {
            this.handleDirhunter(data as DirhunterData);
        });

        this.Events.on("Mail.Sent", (data) => {
            if (!this.isAuditReport(data.subject, data.content)) {
                return;
            }

            if (!this.Data.reportSubmitted) {
                this.SetData("reportSubmitted", true);
                this.completeObjective(Q01_OBJECTIVE_IDS.submitAudit);
            }
        });
    }

    override OnComplete() {
        Mail.send({
            from: Q01_ADRIAN_EMAIL,
            subject: `Re: ${Q01_REPORT_SUBJECT}`,
            content: Q01_COMPLETION_MAIL_CONTENT,
        });

        resetQ01ShellFixtures();
        Network.removeDomain(Q01_WEB_HOME_HOST);
        Network.destroyNetwork(this.Data.targetIp);
    }

    override OnAbandon() {
        resetQ01ShellFixtures();
        Network.removeDomain(Q01_WEB_HOME_HOST);
        Network.destroyNetwork(this.Data.targetIp);
    }

    private handleTerminalCommand(data: TerminalCommandData): void {
        const input = data.args.join(" ").trim();

        if (data.command === "nmap") {
            if (
                data.args.length > 0 &&
                data.args[0] !== this.Data.targetIp
            ) {
                return;
            }

            const result = Shell.getCommandData(
                "nmap",
                data.args.length === 0 ? "" : this.Data.targetIp,
            );

            if (!this.isExpectedNmapResult(result)) {
                return;
            }

            if (!this.Data.networkScanned) {
                this.SetData("networkScanned", true);
                this.completeObjective(Q01_OBJECTIVE_IDS.scanNetwork);
            }

            return;
        }

        if (data.command === "lynx") {
            if (input !== Q01_LYNX_INPUT_IP && input !== Q01_LYNX_INPUT_URL) {
                return;
            }

            const result = Shell.getCommandData("lynx", input);

            if (!this.isExpectedLynxResult(result)) {
                return;
            }

            if (!this.Data.lynxDiscovered) {
                this.SetData("lynxDiscovered", true);
                this.completeObjective(Q01_OBJECTIVE_IDS.identifyServices);
            }

            return;
        }

    }

    private handleMailRead(data: MailReadData): void {
        if (this.Data.auditScopeReviewed) {
            return;
        }

        if (data.from !== Q01_ADRIAN_EMAIL || data.subject !== Q01_REPORT_SUBJECT) {
            return;
        }

        this.SetData("auditScopeReviewed", true);
        this.completeObjective(Q01_OBJECTIVE_IDS.reviewScope);
    }

    private handleDirhunter(data: DirhunterData): void {
        if (this.Data.pathsDiscovered) {
            return;
        }

        if (!isExpectedDirhunterHost(data.host)) {
            return;
        }

        this.SetData("pathsDiscovered", true);
        this.completeObjective(Q01_OBJECTIVE_IDS.enumeratePaths);
    }

    private handleBrowserMeta(data: BrowserMetaData): void {
        if (
            this.Data.basicVulnerabilityChecksCompleted ||
            !this.Data.lynxDiscovered ||
            !this.Data.pathsDiscovered
        ) {
            return;
        }

        if (
            data.protocol !== "https:" ||
            data.hostname !== Q01_WEB_HOME_HOST ||
            data.pathname !== Q01_WEB_AUDIT_PATH
        ) {
            return;
        }

        this.SetData("basicVulnerabilityChecksCompleted", true);
        this.completeObjective(Q01_OBJECTIVE_IDS.basicVulnerabilityChecks);
    }

    private isExpectedNmapResult(
        result: unknown,
    ): result is readonly Q01NmapPort[] {
        if (
            !Array.isArray(result) ||
            result.length !== Q01_NMAP_RESULT.length
        ) {
            return false;
        }

        return Q01_NMAP_RESULT.every((expected) =>
            result.some(
                (actual) =>
                    actual &&
                    typeof actual === "object" &&
                    "port" in actual &&
                    "status" in actual &&
                    "service" in actual &&
                    actual.port === expected.port &&
                    actual.status === expected.status &&
                    actual.service === expected.service,
            ),
        );
    }

    private isExpectedLynxResult(result: unknown): result is Q01LynxResult {
        if (typeof result !== "object" || result === null) {
            return false;
        }

        if (
            !("address" in result) ||
            !Array.isArray(result.address) ||
            !result.address.includes(Q01_WEB_HOME_URL)
        ) {
            return false;
        }

        if (!("ips" in result) || !Array.isArray(result.ips)) {
            return false;
        }

        return result.ips.includes(Q01_TARGET_IP);
    }

    private isAuditReport(subject: string, content: string): boolean {
        const normalizedSubject = subject.trim().toLowerCase();
        const normalizedContent = content.trim();
        const subjectMatches =
            normalizedSubject === Q01_REPORT_SUBJECT.toLowerCase() ||
            normalizedSubject === `re: ${Q01_REPORT_SUBJECT}`.toLowerCase();

        return subjectMatches && normalizedContent === Q01_REPORT_BODY;
    }
}