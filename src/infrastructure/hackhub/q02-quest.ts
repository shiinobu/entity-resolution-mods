import {
    Bank,
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
    Q02_CLIENT_NAME,
    Q02_COMPLETION_DELAY_MS,
    Q02_COMPLETION_MAIL_CONTENT_PRODUCTION,
    Q02_FINAL_STATE_FLAG,
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
    Q02_REWARDS,
    Q02_TARGET_IP,
    Q02_THE_ANOMALY,
    Q02_WEB_HOST,
    type Q02NmapPort,
} from "../../content/index.js";

import { asId } from "../../core/index.js";
import { gameRuntime } from "./runtime.js";

interface Q02QuestData {
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

const registerQ02ShellFixtures = (): void => {
    resetQ02ShellFixtures();
    Shell.addCommandData("nmap", Q02_TARGET_IP, Q02_NMAP_RESULT);
    Shell.addCommandData("nmap", "", Q02_NMAP_RESULT);
    // The player must resolve the anomalous hostname to an IP themselves —
    // nmap only accepts a literal IP address, so nslookup (or any other
    // resolver the player prefers) is the natural next step, not something
    // Adrian hands over directly.
    Shell.addCommandData("nslookup", Q02_WEB_HOST, Q02_TARGET_IP);
    Shell.addCommandData(
        "nslookup",
        Q02_HIDDEN_HOSTNAME,
        Q02_HIDDEN_HOSTNAME_IP,
    );
};

const sendAdrianMail = (subject: string, content: string): void => {
    Mail.send({
        from: Q02_ADRIAN_EMAIL,
        subject,
        content,
    });
};

@RegisterQuest
export class EntityResolutionQ02Quest extends HackHubQuest<Q02QuestData> {
    override Name = "entity_resolution.q02";
    override Title = "THE ANOMALY";
    override Description =
        `Investigate an unregistered host discovered on ${Q02_CLIENT_NAME}'s network.`;
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q01"];
    override Rewards = {
        money: 0,
        xp: 0,
    };
    override HackhubPost = {
        content:
            "One more thing from the last client. An unregistered host showed up in their external scan.",
        author: {
            name: "Adrian Cole",
            avatar: "assets/adrian-cole.png",
        },
    };

    override Objectives = Q02_OBJECTIVES;

    override CreateData(): Q02QuestData {
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
        gameRuntime.quest.start(Q02_THE_ANOMALY);

        Network.createSubnetNetwork({
            ip: this.Data.targetIp,
            type: Network.Type.Router,
            ports: Q02_NETWORK_PORTS,
            users: [],
            children: [],
        });

        Network.registerDomain(Q02_WEB_HOST, this.Data.targetIp);
        // Q02_GATEWAY_IP is a raw IP used directly as a Website host — it is
        // not a hostname resolving to another IP, so no Network.registerDomain
        // mapping applies here (experimental; see docs/phase13-q02-source-recovered.md).

        sendAdrianMail(Q02_INCOMING_MAIL_SUBJECT, Q02_INCOMING_MAIL_CONTENT);
    }

    override OnObjectivesStart() {
        registerQ02ShellFixtures();

        Mail.registerTemplate({
            id: Q02_REPORT_TEMPLATE_ID,
            label: Q02_REPORT_TEMPLATE_LABEL,
            title: Q02_REPORT_SUBJECT,
            content: Q02_REPORT_TEMPLATE_CONTENT,
            fields: ["anomalousPort", "serviceName", "issuer"],
        });

        this.Events.on("Mail.Read", (data) => {
            this.handleMailRead(data);
        });

        this.Events.on("Terminal.Command", (data) => {
            this.handleTerminalCommand(data);
        });

        this.Events.on("Browser.Meta", (data) => {
            this.handleBrowserMeta(data);
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
        gameRuntime.flagStore.set(Q02_FINAL_STATE_FLAG, true);

        const completed = gameRuntime.quest.complete(Q02_THE_ANOMALY);

        if (!completed) {
            throw new Error(
                "Q02 HackHub completion diverged from canonical runtime completion.",
            );
        }

        gameRuntime.reward.claim({
            id: asId<"Reward">("entity_resolution.q02.xp.investigate-target"),
            kind: "experience",
            amount: Q02_REWARDS.investigateTarget,
        });

        gameRuntime.reward.claim({
            id: asId<"Reward">("entity_resolution.q02.xp.service-enumeration"),
            kind: "experience",
            amount: Q02_REWARDS.serviceEnumeration,
        });

        gameRuntime.reward.claim({
            id: asId<"Reward">("entity_resolution.q02.xp.certificate-inspection"),
            kind: "experience",
            amount: Q02_REWARDS.certificateInspection,
        });

        gameRuntime.reward.claim({
            id: asId<"Reward">("entity_resolution.q02.xp.report-anomaly"),
            kind: "experience",
            amount: Q02_REWARDS.reportAnomaly,
        });

        gameRuntime.reward.claim({
            id: asId<"Reward">("entity_resolution.q02.xp.identify-cri-hostname"),
            kind: "experience",
            amount: Q02_REWARDS.identifyCriHostname,
        });

        if (this.Data.dnsChecked) {
            gameRuntime.reward.claim({
                id: asId<"Reward">("entity_resolution.q02.xp.check-dns"),
                kind: "experience",
                amount: Q02_REWARDS.checkDns,
            });
        }

        const moneyGranted = gameRuntime.economy.applyMissionReward(
            {
                id: asId<"MissionReward">("entity_resolution.q02.money"),
                questId: "entity_resolution.q02",
                amount: Q02_REWARDS.money,
                rewardIndex: 0,
            },
            Q02_FINAL_STATE_FLAG,
        );

        if (moneyGranted) {
            Bank.transaction({
                amount: Q02_REWARDS.money,
                description: Q02_REPORT_SUBJECT,
                from: {
                    IBAN: "ID00SKYNETLOGISTICS",
                    name: Q02_CLIENT_NAME,
                },
            });
        }

        sendAdrianMail(`Re: ${Q02_REPORT_SUBJECT}`, Q02_COMPLETION_MAIL_CONTENT_PRODUCTION);
        resetQ02ShellFixtures();
        // Deliberately NOT calling Mail.unregisterTemplate here — confirmed
        // live that GoMail re-renders a sent mail's history entry from its
        // template at view time, keyed by template id. Unregistering breaks
        // the pretty rendering of the player's own already-sent mail
        // retroactively, turning it into raw JSON. Leaving templates
        // registered is harmless (a small, permanent compose-dropdown entry).
        Network.removeDomain(Q02_WEB_HOST);
        Network.destroyNetwork(this.Data.targetIp);
        gameRuntime.persistence.save();
    }

    override OnAbandon() {
        resetQ02ShellFixtures();
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

            // A bare scan does not reveal the forwarded destination — the
            // player must use -sV (service/version detection) to identify
            // what port 8443 actually is. Neither objective clears without it.
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
