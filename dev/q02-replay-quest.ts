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
    Q02_COMPLETION_DELAY_MS,
    Q02_COMPLETION_MAIL_CONTENT_REPLAY,
    Q02_HACKHUB_POST_REPLAY,
    Q02_GATEWAY_IP,
    Q02_GATEWAY_SERVICE_NAME,
    Q02_HIDDEN_HOSTNAME,
    Q02_HIDDEN_HOSTNAME_IP,
    Q02_HOLD_MAIL_CONTENT,
    Q02_INCOMING_MAIL_CONTENT,
    Q02_INCOMING_MAIL_SUBJECT,
    Q02_NETWORK_PORTS,
    Q02_NMAP_RESULT,
    Q02_OBJECTIVES,
    Q02_OBJECTIVE_IDS,
    Q02_REPORT_BODY,
    Q02_REPORT_SUBJECT,
    Q02_REPORT_TEMPLATE_CONTENT,
    Q02_REPORT_TEMPLATE_ID,
    Q02_REPORT_TEMPLATE_LABEL,
    Q02_TARGET_IP,
    Q02_WEB_HOST,
    type Q02NmapPort,
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
    override HackhubPost = Q02_HACKHUB_POST_REPLAY;

    override Objectives = Q02_OBJECTIVES;

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
            ports: Q02_NETWORK_PORTS,
            users: [],
            children: [],
        });

        Network.registerDomain(Q02_WEB_HOST, this.Data.targetIp);
        // Q02_GATEWAY_IP is a raw IP used directly as a Website host, not a
        // hostname to resolve — no Network.registerDomain mapping applies.

        // Mirrors production — see q02-quest.ts for the rationale.
        Network.registerDomain(Q02_HIDDEN_HOSTNAME, Q02_HIDDEN_HOSTNAME_IP);

        sendAdrianMail(Q02_INCOMING_MAIL_SUBJECT, Q02_INCOMING_MAIL_CONTENT);
    }

    override OnObjectivesStart() {
        resetQ02ShellFixtures();

        Mail.registerTemplate({
            id: Q02_REPORT_TEMPLATE_ID,
            label: Q02_REPORT_TEMPLATE_LABEL,
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

                // Sent synchronously, not inside setTimeout — confirmed live
                // that Mail.send does not fire reliably from inside a
                // setTimeout callback, unlike completeObjective, which does.
                sendAdrianMail(
                    `Re: ${Q02_REPORT_SUBJECT}`,
                    Q02_HOLD_MAIL_CONTENT,
                );

                setTimeout(() => {
                    this.completeObjective(Q02_OBJECTIVE_IDS.reportAnomaly);
                }, Q02_COMPLETION_DELAY_MS);
            }
        });
    }

    override OnComplete() {
        sendAdrianMail(`Re: ${Q02_REPORT_SUBJECT}`, Q02_COMPLETION_MAIL_CONTENT_REPLAY);
        resetQ02ShellFixtures();
        // Deliberately NOT calling Mail.unregisterTemplate here — confirmed
        // live that GoMail re-renders a sent mail's history entry from its
        // template at view time, keyed by template id. Unregistering breaks
        // the pretty rendering of the player's own already-sent mail
        // retroactively, turning it into raw JSON. Leaving templates
        // registered is harmless (a small, permanent compose-dropdown entry).
        Network.removeDomain(Q02_WEB_HOST);
        Network.removeDomain(Q02_HIDDEN_HOSTNAME);
        Network.destroyNetwork(this.Data.targetIp);
    }

    override OnAbandon() {
        resetQ02ShellFixtures();
        Network.removeDomain(Q02_WEB_HOST);
        Network.removeDomain(Q02_HIDDEN_HOSTNAME);
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

            // Rolled back from a ping-based trigger (Terminal.Ping did not
            // surface the hidden objective live) to isolate whether the
            // problem was the event or the hidden-objective mechanism
            // itself — mirrors q02-quest.ts.
            if (!this.Data.dnsChecked) {
                this.SetData("dnsChecked", true);
                this.completeObjective(Q02_OBJECTIVE_IDS.checkDns);
            }
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
