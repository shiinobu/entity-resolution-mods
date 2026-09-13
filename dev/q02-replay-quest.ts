import {
    Mail,
    Network,
    Quest as HackHubQuest,
    RegisterQuest,
    Shell,
} from "@hotbunny/hackhub-content-sdk";

import {
    Q02_ADRIAN_EMAIL,
    Q02_ANOMALOUS_PORT,
    Q02_CERTIFICATE_ISSUER,
    Q02_COMPLETION_MAIL_CONTENT,
    Q02_GATEWAY_IP,
    Q02_GATEWAY_SERVICE_NAME,
    Q02_GATEWAY_SERVICE_VERSION,
    Q02_HIDDEN_HOSTNAME,
    Q02_HIDDEN_HOSTNAME_IP,
    Q02_HOLD_MAIL_CONTENT,
    Q02_INCOMING_MAIL_CONTENT,
    Q02_INCOMING_MAIL_SUBJECT,
    Q02_OBJECTIVE_IDS,
    Q02_REPORT_BODY,
    Q02_REPORT_RECIPIENT,
    Q02_REPORT_SUBJECT,
    Q02_REPORT_TEMPLATE_CONTENT,
    Q02_REPORT_TEMPLATE_ID,
    Q02_TARGET_IP,
    Q02_WEB_HOST,
} from "../src/content/q02.js";

import { DEV_Q01_REPLAY_ID } from "./replay-id.generated.js";

interface Q02ReplayData {
    readonly targetIp: string;
    readonly targetChecked: boolean;
    readonly hostScanned: boolean;
    readonly serviceIdentified: boolean;
    readonly certificateInspected: boolean;
    readonly dnsChecked: boolean;
    readonly reportSubmitted: boolean;
}

interface TerminalCommandData {
    readonly command: string;
    readonly args: string[];
}

interface BrowserMetaData {
    readonly protocol: string;
    readonly hostname: string;
    readonly port: string;
    readonly pathname: string;
}

interface MailReadData {
    readonly from: string;
    readonly subject: string;
}

interface Q02NmapPort {
    readonly port: number;
    readonly status: "OPEN" | "CLOSE" | "FORWARDED";
    readonly service: string;
    readonly version?: string;
    readonly destination?: string;
}

const Q02_NMAP_RESULT: Q02NmapPort[] = [
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

const resetQ02ShellFixtures = (): void => {
    Shell.removeCommandData("nmap", Q02_TARGET_IP);
    Shell.removeCommandData("nmap", "");
    Shell.removeCommandData("nslookup", Q02_WEB_HOST);
    Shell.removeCommandData("nslookup", Q02_HIDDEN_HOSTNAME);
};

const sendAdrianMail = (subject: string, content: string): void => {
    Mail.send({
        from: Q02_ADRIAN_EMAIL,
        subject,
        content,
    });
};

export const Q02_REPLAY_QUEST_NAME = `entity_resolution.dev.q02.${DEV_Q01_REPLAY_ID}`;

@RegisterQuest
export class EntityResolutionQ02ReplayQuest extends HackHubQuest<Q02ReplayData> {
    override Name = Q02_REPLAY_QUEST_NAME;
    override Title = "THE ANOMALY — DEV REPLAY";
    override Description =
        "Development replay fixture for the Q02 unregistered-host investigation.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    // No QuestsToComplete gate — replay quests are started independently per
    // quest for fast iteration; production enforces the real Q01 dependency.
    override Rewards = { money: 0, xp: 0 };
    override HackhubPost = {
        content: "DEV REPLAY — Q02 live-testing fixture. Apply to replay THE ANOMALY.",
        author: {
            name: "Adrian Cole [DEV]",
            avatar: "assets/adrian-cole.png",
        },
    };

    override Objectives = [
        {
            name: Q02_OBJECTIVE_IDS.checkTarget,
            description: "Check the new target",
        },
        {
            name: Q02_OBJECTIVE_IDS.scanHost,
            description: "Scan the host",
            terminalCommand: "nmap",
            hint: "nmap only accepts an IP address. Resolve the hostname first.",
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
            hint: `Reply to ${Q02_REPORT_RECIPIENT} with your findings.`,
            unlocksAfter: [Q02_OBJECTIVE_IDS.inspectCertificate],
        },
    ];

    override CreateData(): Q02ReplayData {
        return {
            targetIp: Q02_TARGET_IP,
            targetChecked: false,
            hostScanned: false,
            serviceIdentified: false,
            certificateInspected: false,
            dnsChecked: false,
            reportSubmitted: false,
        };
    }

    override OnStart() {
        Network.createSubnetNetwork({
            ip: this.Data.targetIp,
            type: Network.Type.Router,
            ports: [
                { external: 22, internal: 22, active: true, service: "ssh" },
                { external: 443, internal: 443, active: true, service: "https" },
                { external: 8443, internal: 8443, active: true, service: "https-alt" },
            ],
            users: [],
            children: [],
        });

        Network.registerDomain(Q02_WEB_HOST, this.Data.targetIp);
        // Q02_GATEWAY_IP is a raw IP used directly as a Website host, not a
        // hostname to resolve — no Network.registerDomain mapping applies.

        sendAdrianMail(Q02_INCOMING_MAIL_SUBJECT, Q02_INCOMING_MAIL_CONTENT);
    }

    override OnObjectivesStart() {
        resetQ02ShellFixtures();

        Mail.registerTemplate({
            id: Q02_REPORT_TEMPLATE_ID,
            label: Q02_REPORT_SUBJECT,
            title: Q02_REPORT_SUBJECT,
            content: Q02_REPORT_TEMPLATE_CONTENT,
            fields: ["anomalousPort", "serviceName", "issuer"],
        });

        Shell.addCommandData("nmap", Q02_TARGET_IP, Q02_NMAP_RESULT);
        Shell.addCommandData("nmap", "", Q02_NMAP_RESULT);
        Shell.addCommandData("nslookup", Q02_WEB_HOST, Q02_TARGET_IP);
        Shell.addCommandData(
            "nslookup",
            Q02_HIDDEN_HOSTNAME,
            Q02_HIDDEN_HOSTNAME_IP,
        );

        this.Events.on("Mail.Read", (data) => {
            this.handleMailRead(data as MailReadData);
        });

        this.Events.on("Terminal.Command", (data) => {
            this.handleTerminalCommand(data as TerminalCommandData);
        });

        this.Events.on("Browser.Meta", (data) => {
            this.handleBrowserMeta(data as BrowserMetaData);
        });

        this.Events.on("Mail.Sent", (data) => {
            if (!this.isAnomalyReport(data.subject, data.content)) {
                return;
            }

            if (!this.Data.reportSubmitted) {
                this.SetData("reportSubmitted", true);
                sendAdrianMail(
                    `Re: ${Q02_REPORT_SUBJECT}`,
                    Q02_HOLD_MAIL_CONTENT,
                );
                this.completeObjective(Q02_OBJECTIVE_IDS.reportAnomaly);
            }
        });
    }

    override OnComplete() {
        sendAdrianMail(`Re: ${Q02_REPORT_SUBJECT}`, Q02_COMPLETION_MAIL_CONTENT);
        resetQ02ShellFixtures();
        Mail.unregisterTemplate(Q02_REPORT_TEMPLATE_ID);
        Network.removeDomain(Q02_WEB_HOST);
        Network.destroyNetwork(this.Data.targetIp);
    }

    override OnAbandon() {
        resetQ02ShellFixtures();
        Mail.unregisterTemplate(Q02_REPORT_TEMPLATE_ID);
        Network.removeDomain(Q02_WEB_HOST);
        Network.destroyNetwork(this.Data.targetIp);
    }

    private handleMailRead(data: MailReadData): void {
        if (this.Data.targetChecked) {
            return;
        }

        if (
            data.from !== Q02_ADRIAN_EMAIL ||
            data.subject !== Q02_INCOMING_MAIL_SUBJECT
        ) {
            return;
        }

        this.SetData("targetChecked", true);
        this.completeObjective(Q02_OBJECTIVE_IDS.checkTarget);
    }

    private handleTerminalCommand(data: TerminalCommandData): void {
        if (data.command === "nmap") {
            if (
                data.args.length > 0 &&
                data.args[0] !== this.Data.targetIp
            ) {
                return;
            }

            if (!data.args.includes("-sV")) {
                return;
            }

            const result = Shell.getCommandData(
                "nmap",
                data.args.length === 0 ? "" : this.Data.targetIp,
            );

            if (!this.isExpectedNmapResult(result)) {
                return;
            }

            if (!this.Data.hostScanned) {
                this.SetData("hostScanned", true);
                this.completeObjective(Q02_OBJECTIVE_IDS.scanHost);
            }

            if (!this.Data.serviceIdentified) {
                this.SetData("serviceIdentified", true);
                this.completeObjective(Q02_OBJECTIVE_IDS.identifyService);
            }

            return;
        }

        if (data.command === "nslookup") {
            if (!data.args.includes(Q02_HIDDEN_HOSTNAME)) {
                return;
            }

            const result = Shell.getCommandData("nslookup", Q02_HIDDEN_HOSTNAME);

            if (result !== Q02_HIDDEN_HOSTNAME_IP) {
                return;
            }

            this.SetData("dnsChecked", true);
        }
    }

    private handleBrowserMeta(data: BrowserMetaData): void {
        if (
            this.Data.certificateInspected ||
            !this.Data.serviceIdentified ||
            data.hostname !== Q02_GATEWAY_IP
        ) {
            return;
        }

        if (data.protocol !== "https:") {
            // No mail warning here — Adrian has no way of knowing about a
            // plain-HTTP request the player made in their own browser. The
            // nginx-style 400 page served by Q02GatewayWebsite already
            // explains the failure in-fiction.
            return;
        }

        this.SetData("certificateInspected", true);
        this.completeObjective(Q02_OBJECTIVE_IDS.inspectCertificate);
    }

    private isExpectedNmapResult(
        result: unknown,
    ): result is readonly Q02NmapPort[] {
        if (!Array.isArray(result) || result.length !== Q02_NMAP_RESULT.length) {
            return false;
        }

        return Q02_NMAP_RESULT.every((expected) =>
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

    private isAnomalyReport(subject: string, content: string): boolean {
        if (this.isTemplateAnomalyReport(subject, content)) {
            return true;
        }

        const normalizedSubject = subject.trim().toLowerCase();
        const normalizedContent = content.trim();

        const subjectMatches =
            normalizedSubject === Q02_REPORT_SUBJECT.toLowerCase() ||
            normalizedSubject === `re: ${Q02_REPORT_SUBJECT}`.toLowerCase();

        return subjectMatches && normalizedContent === Q02_REPORT_BODY;
    }

    // Confirmed live: sending via the registered GoMail template does not
    // merge {{field}} placeholders into rendered text. Instead Mail.Sent's
    // `subject` is the template id and `content` is a raw JSON object of the
    // field values the player typed. This validates that path directly.
    private isTemplateAnomalyReport(subject: string, content: string): boolean {
        if (subject !== Q02_REPORT_TEMPLATE_ID) {
            return false;
        }

        let fields: unknown;

        try {
            fields = JSON.parse(content);
        } catch {
            return false;
        }

        if (!fields || typeof fields !== "object") {
            return false;
        }

        const { anomalousPort, serviceName, issuer } = fields as Record<string, unknown>;

        return (
            anomalousPort === Q02_ANOMALOUS_PORT &&
            serviceName === Q02_GATEWAY_SERVICE_NAME &&
            issuer === Q02_CERTIFICATE_ISSUER
        );
    }
}
