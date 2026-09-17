import {
    Bank,
    Files,
    Mail,
    Network,
    Quest as HackHubQuest,
    RegisterQuest,
    Shell,
    type MailAttachment,
    type QuestDialogDefinition,
    type QuestDialogSpeech,
} from "@hotbunny/hackhub-content-sdk";

import {
    applyDevGating,
    ENTITY_RESOLUTION_FLAGS,
    isQuestDevFocus,
    questGate,
    Q03_ACCESS_ATTACHMENT_EXTENSION,
    Q03_ACCESS_ATTACHMENT_NAME,
    Q03_ACCESS_HASH,
    Q03_ADRIAN_EMAIL,
    Q03_BACKUP_CHECKED_FLAG,
    Q03_BACKUP_RESTRICTED_FLAG,
    Q03_CLIENT_NAME,
    Q03_COMPLETION_MAIL_CONTENT_PRODUCTION,
    Q03_CRI_POLICY_FOUND_FLAG,
    Q03_DIALOG,
    Q03_FINAL_STATE_FLAG,
    Q03_HACKHUB_POST_PRODUCTION,
    Q03_INCOMING_MAIL_CONTENT,
    Q03_INCOMING_MAIL_SUBJECT,
    Q03_LAST_ACTIVITY_DATE,
    Q03_LOGS_MISSING_FLAG,
    Q03_LOGS_START_DATE,
    Q03_MISSING_LOGS,
    Q03_MISSING_ROTATIONS,
    Q03_NETWORK_PORTS,
    Q03_NMAP_RESULT,
    Q03_OBJECTIVES,
    Q03_OBJECTIVE_IDS,
    Q03_POST_WAIT_DIALOG_DELAY_MS,
    Q03_REPORT_BODY,
    Q03_REPORT_CALLBACK_DELAY,
    Q03_REPORT_SUBJECT,
    Q03_REPORT_TEMPLATE_CONTENT,
    Q03_REPORT_TEMPLATE_ID,
    Q03_REPORT_TEMPLATE_LABEL,
    Q03_REWARDS,
    Q03_ROOT_FILES,
    Q03_ROUTER_IP,
    Q03_SSH_PASSWORD,
    Q03_SSH_USERNAME,
    Q03_TARGET_IP,
    Q03_WEB_HOST,
} from "../../content/index.js";

import { asId } from "../../core/index.js";
import { gameRuntime } from "./runtime.js";
import { createScheduledCallback } from "./scheduled-callback.js";
import { monthDayMatches, numberSetsMatch } from "./commands/q03-log-tools.js";

interface Q03QuestData {
    readonly targetIp: string;
    readonly accessFound: boolean;
    readonly connected: boolean;
    readonly logsChecked: boolean;
    readonly filestatRun: boolean;
    readonly bootlogRun: boolean;
    readonly gapInvestigated: boolean;
    readonly backupChecked: boolean;
    readonly reportSubmitted: boolean;
}

interface TerminalCommandData {
    readonly command: string;
    readonly args: string[];
}

interface TerminalLsData {
    readonly id: string;
    readonly name: string;
}

interface TerminalCatData {
    readonly id: string;
    readonly name: string;
    readonly extension?: string;
}

const includesArgMatching = (args: readonly string[], needle: string): boolean =>
    args.some((arg) => arg.toLowerCase().includes(needle));

const resetQ03ShellFixtures = (): void => {
    Shell.removeCommandData("ssh", { host: Q03_TARGET_IP, key: Q03_SSH_PASSWORD });
    Shell.removeCommandData("nmap", Q03_TARGET_IP);
    Shell.removeCommandData("nmap", "");
};

const registerQ03ShellFixtures = (): void => {
    resetQ03ShellFixtures();

    Shell.addCommandData("nmap", Q03_TARGET_IP, Q03_NMAP_RESULT);
    Shell.addCommandData("nmap", "", Q03_NMAP_RESULT);

    Shell.addCommandData(
        "ssh",
        { host: Q03_TARGET_IP, key: Q03_SSH_PASSWORD },
        { ip: Q03_TARGET_IP, status: "OPEN" },
    );
};

const sendAdrianMail = (
    subject: string,
    content: string,
    attachments?: MailAttachment[],
): void => {
    Mail.send({
        from: Q03_ADRIAN_EMAIL,
        subject,
        content,
        ...(attachments ? { attachments } : {}),
    });
};

const attachReportFindingsOnEnd = (
    dialog: QuestDialogDefinition,
    onEnd: () => void,
): QuestDialogDefinition => {
    const withOnEndOnLastLine = (branch: QuestDialogSpeech[]): QuestDialogSpeech[] =>
        branch.map((line, index) =>
            index === branch.length - 1 ? { ...line, onEnd } : line,
        );

    return {
        ...dialog,
        postReportA: withOnEndOnLastLine(dialog.postReportA!),
        postReportB: withOnEndOnLastLine(dialog.postReportB!),
        postReportC: withOnEndOnLastLine(dialog.postReportC!),
    };
};

let activeQ03Instance: EntityResolutionQ03Quest | null = null;

const reportCallback = createScheduledCallback<{ backupChecked: boolean }>(
    "entity_resolution.q03.reportCallback",
);

reportCallback.register((payload) => {
    activeQ03Instance?.receiveReportCallback(payload.backupChecked);
});

@RegisterQuest
export class EntityResolutionQ03Quest extends HackHubQuest<Q03QuestData> {
    override Name = "entity_resolution.q03";
    override Title = "MISSING LOGS";
    override Description =
        `Determine when an old, supposedly decommissioned server on ${Q03_CLIENT_NAME}'s network was last active.`;
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = questGate("q03", ["entity_resolution.q02"]);
    override Rewards = {
        money: 0,
        xp: 0,
    };
    override Employer = {
        firstName: "Adrian",
        lastName: "Cole",
        email: Q03_ADRIAN_EMAIL,
        avatar: "assets/adrian-cole.png",
    };
    override HackhubPost = Q03_HACKHUB_POST_PRODUCTION;

    override Dialog: QuestDialogDefinition = attachReportFindingsOnEnd(Q03_DIALOG, () =>
        this.finishReportFindings(),
    );

    override Objectives = applyDevGating(Q03_OBJECTIVES, isQuestDevFocus("q03"));

    override CreateData(): Q03QuestData {
        return {
            targetIp: Q03_TARGET_IP,
            accessFound: false,
            connected: false,
            logsChecked: false,
            filestatRun: false,
            bootlogRun: false,
            gapInvestigated: false,
            backupChecked: false,
            reportSubmitted: false,
        };
    }

    override OnStart() {
        activeQ03Instance = this;
        gameRuntime.quest.start(Q03_MISSING_LOGS);

        Network.destroyNetwork(Q03_TARGET_IP);

        Network.createSubnetNetwork({
            ip: Q03_ROUTER_IP,
            type: Network.Type.Router,
            ports: [],
            users: [],
            children: [
                {
                    ip: this.Data.targetIp,
                    type: Network.Type.Device,
                    ports: Q03_NETWORK_PORTS,
                    users: [
                        Network.createUser({
                            username: Q03_SSH_USERNAME,
                            password: Q03_SSH_PASSWORD,
                        }),
                    ],
                    rootFiles: Q03_ROOT_FILES,
                },
            ],
        });

        Network.registerDomain(Q03_WEB_HOST, this.Data.targetIp);

        sendAdrianMail(Q03_INCOMING_MAIL_SUBJECT, Q03_INCOMING_MAIL_CONTENT, [
            {
                name: Q03_ACCESS_ATTACHMENT_NAME,
                extension: Q03_ACCESS_ATTACHMENT_EXTENSION,
                data: Q03_ACCESS_HASH,
            },
        ]);
    }

    override OnObjectivesStart() {
        registerQ03ShellFixtures();

        Mail.registerTemplate({
            id: Q03_REPORT_TEMPLATE_ID,
            label: Q03_REPORT_TEMPLATE_LABEL,
            title: Q03_REPORT_SUBJECT,
            content: Q03_REPORT_TEMPLATE_CONTENT,
            fields: ["lastActivity", "logsStart", "missingRotations"],
        });

        this.Events.on("Terminal.Command", (data) => {
            this.handleTerminalCommand(data);
        });

        this.Events.on("Terminal.Ls", (data) => {
            this.handleTerminalLs(data);
        });

        this.Events.on("Terminal.Cat", (data) => {
            this.handleTerminalCat(data);
        });

        this.Events.on("Terminal.SSH.Connected", (ip) => {
            this.handleSshConnected(ip);
        });

        this.Events.on("Q03.CrackhashSuccess", () => {
            this.handleCrackhashSuccess();
        });

        this.Events.on("Mail.Sent", (data) => {
            this.handleMailSent(data.subject, data.content);
        });
    }

    override OnComplete() {
        gameRuntime.flagStore.set(Q03_FINAL_STATE_FLAG, true);
        gameRuntime.flagStore.set(Q03_LOGS_MISSING_FLAG, true);
        gameRuntime.flagStore.set(Q03_BACKUP_CHECKED_FLAG, this.Data.backupChecked);
        gameRuntime.flagStore.set(Q03_BACKUP_RESTRICTED_FLAG, this.Data.backupChecked);
        gameRuntime.flagStore.set(Q03_CRI_POLICY_FOUND_FLAG, this.Data.backupChecked);
        gameRuntime.flagStore.set(ENTITY_RESOLUTION_FLAGS.adrianSuspicious, true);
        gameRuntime.flagStore.set(ENTITY_RESOLUTION_FLAGS.adrianWarnedPlayer, true);

        const completed = gameRuntime.quest.complete(Q03_MISSING_LOGS);

        if (!completed) {
            throw new Error(
                "Q03 HackHub completion diverged from canonical runtime completion.",
            );
        }

        if (!isQuestDevFocus("q03")) {
            const claimXp = (suffix: string, amount: number): void => {
                gameRuntime.reward.claim({
                    id: asId<"Reward">(`entity_resolution.q03.xp.${suffix}`),
                    kind: "experience",
                    amount,
                });
            };

            claimXp("investigate-server-history", Q03_REWARDS.investigateServerHistory);
            claimXp("check-file-timestamp", Q03_REWARDS.checkFileTimestamp);
            claimXp("review-boot-history", Q03_REWARDS.reviewBootHistory);
            claimXp("identify-log-gaps", Q03_REWARDS.identifyLogGaps);
            claimXp("correlate-missing-records", Q03_REWARDS.correlateMissingRecords);

            if (this.Data.backupChecked) {
                claimXp("check-backup-archive", Q03_REWARDS.checkBackupArchive);
                claimXp("identify-cri-policy", Q03_REWARDS.identifyCriPolicy);
            }

            const moneyGranted = gameRuntime.economy.applyMissionReward(
                {
                    id: asId<"MissionReward">("entity_resolution.q03.money"),
                    questId: "entity_resolution.q03",
                    amount: Q03_REWARDS.money,
                    rewardIndex: 0,
                },
                Q03_FINAL_STATE_FLAG,
            );

            if (moneyGranted) {
                Bank.transaction({
                    amount: Q03_REWARDS.money,
                    description: Q03_REPORT_SUBJECT,
                    from: {
                        IBAN: "ID00SKYNETLOGISTICS",
                        name: Q03_CLIENT_NAME,
                    },
                });
            }
        }

        sendAdrianMail(`Re: ${Q03_REPORT_SUBJECT}`, Q03_COMPLETION_MAIL_CONTENT_PRODUCTION);
        resetQ03ShellFixtures();
        Network.removeDomain(Q03_WEB_HOST);
        Network.destroyNetwork(Q03_ROUTER_IP);
        gameRuntime.persistence.save();
    }

    override OnAbandon() {
        resetQ03ShellFixtures();
        Network.removeDomain(Q03_WEB_HOST);
        Network.destroyNetwork(Q03_ROUTER_IP);
    }

    private handleSshConnected(ip: string): void {
        if (ip !== this.Data.targetIp || this.Data.connected) {
            return;
        }

        this.SetData("connected", true);
        this.completeObjective(Q03_OBJECTIVE_IDS.accessHost);
    }

    private handleCrackhashSuccess(): void {
        if (this.Data.accessFound) {
            return;
        }

        this.SetData("accessFound", true);
        this.completeObjective(Q03_OBJECTIVE_IDS.findAccess);
    }

    private handleTerminalLs(data: TerminalLsData): void {
        if (this.Data.gapInvestigated) {
            return;
        }

        const listedFolder = Files.getById(data.id);

        if (listedFolder?.name.toLowerCase() !== "gateway" || !listedFolder.parent) {
            return;
        }

        const parentFolder = Files.getById(listedFolder.parent);

        if (parentFolder?.name.toLowerCase() !== "log") {
            return;
        }

        this.SetData("gapInvestigated", true);
        this.completeObjective(Q03_OBJECTIVE_IDS.checkGatewayLogs);
    }

    private handleTerminalCat(data: TerminalCatData): void {
        const fileName = data.extension ? `${data.name}.${data.extension}` : data.name;
        this.handleLogOrBackupRead(fileName);
    }

    private handleLogOrBackupRead(fileName: string): void {
        const normalized = fileName.toLowerCase();

        if (!this.Data.logsChecked && normalized.includes("access.log")) {
            this.SetData("logsChecked", true);
            this.completeObjective(Q03_OBJECTIVE_IDS.checkLogs);
        }

        if (!this.Data.backupChecked && normalized.includes("gateway-2026")) {
            this.SetData("backupChecked", true);
            this.completeObjective(Q03_OBJECTIVE_IDS.checkBackup);
        }
    }

    private handleTerminalCommand(data: TerminalCommandData): void {
        if (data.command === "filestat") {
            if (!this.Data.filestatRun && includesArgMatching(data.args, "access.log")) {
                this.SetData("filestatRun", true);
                this.completeObjective(Q03_OBJECTIVE_IDS.checkTimestamp);
            }

            return;
        }

        if (data.command === "bootlog") {
            if (!this.Data.bootlogRun && includesArgMatching(data.args, "--list-boots")) {
                this.SetData("bootlogRun", true);
                this.completeObjective(Q03_OBJECTIVE_IDS.reviewBootHistory);
            }

            return;
        }

    }

    private handleMailSent(subject: string, content: string): void {
        if (!this.isFindingsReport(subject, content) || this.Data.reportSubmitted) {
            return;
        }

        this.SetData("reportSubmitted", true);
        gameRuntime.flagStore.set(ENTITY_RESOLUTION_FLAGS.adrianSuspicious, true);

        reportCallback.schedule(
            { backupChecked: this.Data.backupChecked },
            Q03_REPORT_CALLBACK_DELAY,
        );
    }

    receiveReportCallback(backupChecked: boolean): void {
        const startBranch = backupChecked ? "postReportMainWithBackup" : "postReportMain";

        setTimeout(() => {
            this.createDialog(startBranch);
        }, Q03_POST_WAIT_DIALOG_DELAY_MS);
    }

    private finishReportFindings(): void {
        this.completeObjective(Q03_OBJECTIVE_IDS.reportFindings);
    }

    private isFindingsReport(subject: string, content: string): boolean {
        if (this.isTemplateFindingsReport(subject, content)) {
            return true;
        }

        const normalizedSubject = subject.trim().toLowerCase();
        const normalizedContent = content.trim();

        const subjectMatches =
            normalizedSubject === Q03_REPORT_SUBJECT.toLowerCase() ||
            normalizedSubject === `re: ${Q03_REPORT_SUBJECT}`.toLowerCase();

        return subjectMatches && normalizedContent === Q03_REPORT_BODY;
    }

    private isTemplateFindingsReport(subject: string, content: string): boolean {
        if (subject !== Q03_REPORT_TEMPLATE_ID) {
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

        const { lastActivity, logsStart, missingRotations } = fields as Record<string, unknown>;

        return (
            typeof lastActivity === "string" &&
            monthDayMatches(lastActivity, Q03_LAST_ACTIVITY_DATE) &&
            typeof logsStart === "string" &&
            monthDayMatches(logsStart, Q03_LOGS_START_DATE) &&
            typeof missingRotations === "string" &&
            numberSetsMatch(missingRotations, Q03_MISSING_ROTATIONS)
        );
    }
}
