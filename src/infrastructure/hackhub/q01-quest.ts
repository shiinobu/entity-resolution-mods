import {
    Bank,
    Mail,
    Network,
    Quest as HackHubQuest,
    RegisterQuest,
    Shell,
} from "@hotbunny/hackhub-content-sdk";

import {
    applyDevGating,
    isDev,
    Q01_ADRIAN_EMAIL,
    Q01_CLIENT_NAME,
    Q01_COMPLETION_MAIL_CONTENT_PRODUCTION,
    Q01_FINAL_STATE_FLAG,
    Q01_HACKHUB_POST_PRODUCTION,
    Q01_INCOMING_MAIL_CONTENT,
    Q01_LYNX_INPUT_IP,
    Q01_LYNX_INPUT_URL,
    Q01_LYNX_RESULT,
    Q01_NETWORK_PORTS,
    Q01_NMAP_RESULT,
    Q01_OBJECTIVES,
    Q01_OBJECTIVE_IDS,
    Q01_OPEN_PORTS,
    Q01_REPORT_BODY,
    Q01_REPORT_BODY_TEMPLATE,
    Q01_REPORT_SUBJECT,
    Q01_REPORT_TEMPLATE_ID,
    Q01_REPORT_TEMPLATE_LABEL,
    Q01_REWARDS,
    Q01_SUBMIT_AUDIT_DELAY_MS,
    Q01_TARGET_IP,
    Q01_THE_CONTRACT,
    Q01_WEB_AUDIT_PATH,
    Q01_WEB_AUDIT_URL,
    Q01_WEB_HOME_HOST,
    Q01_WEB_HOME_URL,
    type Q01LynxResult,
    type Q01NmapPort,
} from "../../content/index.js";

import { asId } from "../../core/index.js";
import { gameRuntime } from "./runtime.js";

interface Q01QuestData {
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

const resetQ01ShellFixtures = (): void => {
    Shell.removeCommandData("nmap", Q01_TARGET_IP);
    Shell.removeCommandData("nmap", "");
    Shell.removeCommandData("lynx", Q01_LYNX_INPUT_IP);
    Shell.removeCommandData("lynx", Q01_LYNX_INPUT_URL);
};

const registerQ01ShellFixtures = (): void => {
    resetQ01ShellFixtures();
    Shell.addCommandData("nmap", Q01_TARGET_IP, Q01_NMAP_RESULT);
    Shell.addCommandData("nmap", "", Q01_NMAP_RESULT);
    Shell.addCommandData("lynx", Q01_LYNX_INPUT_IP, Q01_LYNX_RESULT);
    Shell.addCommandData("lynx", Q01_LYNX_INPUT_URL, Q01_LYNX_RESULT);
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

const markCanonicalCompletion = (): void => {
    gameRuntime.flagStore.set(Q01_FINAL_STATE_FLAG, true);
};

const sendAdrianMail = (subject: string, content: string): void => {
    Mail.send({
        from: Q01_ADRIAN_EMAIL,
        subject,
        content,
    });
};

@RegisterQuest
export class EntityResolutionQ01Quest extends HackHubQuest<Q01QuestData> {
    override Name = "entity_resolution.q01";
    override Title = "THE CONTRACT";
    override Description =
        `Complete a routine external security audit for ${Q01_CLIENT_NAME} in Jakarta.`;
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override Rewards = {
        money: 0,
        xp: 0,
    };
    override HackhubPost = Q01_HACKHUB_POST_PRODUCTION;

    override Objectives = applyDevGating(Q01_OBJECTIVES);

    override CreateData(): Q01QuestData {
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
        gameRuntime.quest.start(Q01_THE_CONTRACT);

        Network.createSubnetNetwork({
            ip: this.Data.targetIp,
            type: Network.Type.Router,
            ports: Q01_NETWORK_PORTS,
            users: [],
            children: [],
        });

        Network.registerDomain(Q01_WEB_HOME_HOST, this.Data.targetIp);

        sendAdrianMail(Q01_REPORT_SUBJECT, Q01_INCOMING_MAIL_CONTENT);
    }

    override OnObjectivesStart() {
        registerQ01ShellFixtures();

        Mail.registerTemplate({
            id: Q01_REPORT_TEMPLATE_ID,
            label: Q01_REPORT_TEMPLATE_LABEL,
            title: Q01_REPORT_SUBJECT,
            content: Q01_REPORT_BODY_TEMPLATE,
            fields: ["company", "ports", "url"],
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

        this.Events.on("Terminal.Dirhunter", (data) => {
            this.handleDirhunter(data);
        });

        this.Events.on("Mail.Sent", (data) => {
            if (!this.isAuditReport(data.subject, data.content)) {
                return;
            }

            if (!this.Data.reportSubmitted) {
                this.SetData("reportSubmitted", true);
                setTimeout(() => {
                    this.completeObjective(Q01_OBJECTIVE_IDS.submitAudit);
                }, Q01_SUBMIT_AUDIT_DELAY_MS);
            }
        });
    }

    override OnComplete() {
        markCanonicalCompletion();

        const completed = gameRuntime.quest.complete(Q01_THE_CONTRACT);

        if (!completed) {
            throw new Error(
                "Q01 HackHub completion diverged from canonical runtime completion.",
            );
        }

        if (!isDev) {
            gameRuntime.reward.claim({
                id: asId<"Reward">("entity_resolution.q01.xp.external-audit"),
                kind: "experience",
                amount: Q01_REWARDS.externalAudit,
            });

            gameRuntime.reward.claim({
                id: asId<"Reward">("entity_resolution.q01.xp.network-service-enumeration"),
                kind: "experience",
                amount: Q01_REWARDS.networkServiceEnumeration,
            });

            gameRuntime.reward.claim({
                id: asId<"Reward">("entity_resolution.q01.xp.basic-vulnerability-assessment"),
                kind: "experience",
                amount: Q01_REWARDS.basicVulnerabilityAssessment,
            });

            gameRuntime.reward.claim({
                id: asId<"Reward">("entity_resolution.q01.xp.submit-report"),
                kind: "experience",
                amount: Q01_REWARDS.submitCorrectReport,
            });

            const moneyGranted = gameRuntime.economy.applyMissionReward(
                {
                    id: asId<"MissionReward">("entity_resolution.q01.money"),
                    questId: "entity_resolution.q01",
                    amount: Q01_REWARDS.money,
                    rewardIndex: 0,
                },
                Q01_FINAL_STATE_FLAG,
            );

            if (moneyGranted) {
                Bank.transaction({
                    amount: Q01_REWARDS.money,
                    description: Q01_REPORT_SUBJECT,
                    from: {
                        IBAN: "ID00SKYNETLOGISTICS",
                        name: Q01_CLIENT_NAME,
                    },
                });
            }
        }

        sendAdrianMail(`Re: ${Q01_REPORT_SUBJECT}`, Q01_COMPLETION_MAIL_CONTENT_PRODUCTION);
        resetQ01ShellFixtures();
        // Deliberately NOT calling Mail.unregisterTemplate here — confirmed
        // live that GoMail re-renders a sent mail's history entry from its
        // template at view time, keyed by template id. Unregistering breaks
        // the pretty rendering of the player's own already-sent mail
        // retroactively, turning it into raw JSON. Leaving templates
        // registered is harmless (a small, permanent compose-dropdown entry).
        Network.removeDomain(Q01_WEB_HOME_HOST);
        Network.destroyNetwork(this.Data.targetIp);
        gameRuntime.persistence.save();
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

        return (
            result.every((value): value is Q01NmapPort =>
                typeof value === "object" &&
                value !== null &&
                "port" in value &&
                "status" in value &&
                "service" in value &&
                typeof value.port === "number" &&
                (value.status === "OPEN" || value.status === "CLOSE") &&
                typeof value.service === "string",
            ) &&
            Q01_NMAP_RESULT.every((expected) =>
                result.some(
                    (actual) =>
                        actual.port === expected.port &&
                        actual.status === expected.status &&
                        actual.service === expected.service,
                ),
            )
        );
    }

    private isExpectedLynxResult(result: unknown): result is Q01LynxResult {
        if (typeof result !== "object" || result === null) {
            return false;
        }

        if (!("ips" in result) || !Array.isArray(result.ips)) {
            return false;
        }

        if (!result.ips.includes(Q01_TARGET_IP)) {
            return false;
        }

        if (!("address" in result) || !Array.isArray(result.address)) {
            return false;
        }

        return result.address.includes(Q01_WEB_HOME_URL);
    }

    private isAuditReport(subject: string, content: string): boolean {
        if (this.isTemplateAuditReport(subject, content)) {
            return true;
        }

        const normalizedSubject = subject.trim().toLowerCase();
        const normalizedContent = content.trim();

        const subjectMatches =
            normalizedSubject === Q01_REPORT_SUBJECT.toLowerCase() ||
            normalizedSubject === `re: ${Q01_REPORT_SUBJECT}`.toLowerCase();

        return subjectMatches && normalizedContent === Q01_REPORT_BODY;
    }

    // Confirmed live (via Q02): sending via the registered GoMail template
    // does not merge {{field}} placeholders into rendered text. Instead
    // Mail.Sent's `subject` is the template id and `content` is a raw JSON
    // object of the field values the player typed.
    private isTemplateAuditReport(subject: string, content: string): boolean {
        if (subject !== Q01_REPORT_TEMPLATE_ID) {
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

        const { company, ports, url } = fields as Record<string, unknown>;

        return (
            company === Q01_CLIENT_NAME &&
            ports === Q01_OPEN_PORTS &&
            url === Q01_WEB_AUDIT_URL
        );
    }
}
