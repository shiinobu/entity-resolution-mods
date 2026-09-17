import {
    Bank,
    Desktop,
    Mail,
    Network,
    Quest as HackHubQuest,
    RegisterQuest,
    Shell,
    UI,
    type QuestDialogDefinition,
    type QuestDialogSpeech,
} from "@hotbunny/hackhub-content-sdk";

import {
    applyDevGating,
    ENTITY_RESOLUTION_FLAGS,
    isQuestDevFocus,
    questGate,
    Q04_ADRIAN_EMAIL,
    Q04_CLOSE_AUDIT_CALLBACK_DELAY,
    Q04_CLOSE_AUDIT_NOTE_TEMPLATE_CONTENT,
    Q04_CLOSE_AUDIT_NOTE_TEMPLATE_ID,
    Q04_CLOSE_AUDIT_NOTE_TEMPLATE_LABEL,
    Q04_CLOSE_AUDIT_REPORT_CONTENT,
    Q04_CLOSE_AUDIT_REPORT_WITH_NOTE_CONTENT,
    Q04_CLOSE_AUDIT_TEMPLATE_ID,
    Q04_CLOSE_AUDIT_TEMPLATE_LABEL,
    Q04_CRI_IP_CONFIRMED_FLAG,
    Q04_DECOMMISSION_NOTICE_CONTENT,
    Q04_DECOMMISSION_NOTICE_SUBJECT,
    Q04_DIALOG,
    Q04_FINAL_STATE_FLAG,
    Q04_HACKHUB_POST_PRODUCTION,
    Q04_INCOMING_MAIL_CONTENT,
    Q04_INCOMING_MAIL_SUBJECT,
    Q04_LAST_CONNECTION_CHECKED_FLAG,
    Q04_LEAVE_IT_ALONE,
    Q04_LOG_MISMATCH_FOUND_FLAG,
    Q04_NETWORK_PORTS,
    Q04_NMAP_RESULT,
    Q04_OBJECTIVES,
    Q04_OBJECTIVE_IDS,
    Q04_POST_WAIT_DIALOG_DELAY_MS,
    Q04_REWARDS,
    Q04_ROOT_FILES,
    Q04_ROUTER_IP,
    Q04_SHOW_RELAY_WIDGET_DELAY,
    Q04_SSH_PASSWORD,
    Q04_SSH_USERNAME,
    Q04_TARGET_IP,
    Q04_UNKNOWN_RELAY_WIDGET_DURATION_MS,
    Q04_UNKNOWN_RELAY_WIDGET_HEIGHT,
    Q04_UNKNOWN_RELAY_WIDGET_ID,
    Q04_UNKNOWN_RELAY_WIDGET_POSITION,
    Q04_UNKNOWN_RELAY_WIDGET_SRC,
    Q04_UNKNOWN_RELAY_WIDGET_WIDTH,
    Q04_WEB_HOST,
    type Q04NmapPort,
} from "../../content/index.js";

import { asId } from "../../core/index.js";
import { gameRuntime } from "./runtime.js";
import { createScheduledCallback } from "./scheduled-callback.js";

interface Q04QuestData {
    readonly reviewDecommissionNoticeDone: boolean;
    readonly verifyServerStatusDone: boolean;
    readonly closeAuditDone: boolean;
    readonly decideOnEvidenceDone: boolean;
    readonly checkLastConnectionDone: boolean;
}

interface TerminalCommandData {
    readonly command: string;
    readonly args: string[];
}

interface MailReadData {
    readonly from: string;
    readonly subject: string;
}

interface TerminalCatData {
    readonly id: string;
    readonly name: string;
    readonly extension?: string;
}

const resetQ04ShellFixtures = (): void => {
    Shell.removeCommandData("nmap", Q04_TARGET_IP);
    Shell.removeCommandData("nmap", "");
    Shell.removeCommandData("ssh", { host: Q04_TARGET_IP, key: Q04_SSH_PASSWORD });
};

const registerQ04ShellFixtures = (): void => {
    resetQ04ShellFixtures();
    Shell.addCommandData("nmap", Q04_TARGET_IP, Q04_NMAP_RESULT);
    Shell.addCommandData("nmap", "", Q04_NMAP_RESULT);
    Shell.addCommandData(
        "ssh",
        { host: Q04_TARGET_IP, key: Q04_SSH_PASSWORD },
        { ip: Q04_TARGET_IP, status: "OPEN" },
    );
};

const sendAdrianMail = (subject: string, content: string): void => {
    Mail.send({
        from: Q04_ADRIAN_EMAIL,
        subject,
        content,
    });
};

const attachDecisionOnEnd = (
    dialog: QuestDialogDefinition,
    onCloseWithoutLastLook: () => void,
    onLastLook: () => void,
): QuestDialogDefinition => {
    const withOnEndOnLastLine = (
        branch: QuestDialogSpeech[],
        onEnd: () => void,
    ): QuestDialogSpeech[] =>
        branch.map((line, index) =>
            index === branch.length - 1 ? { ...line, onEnd } : line,
        );

    return {
        ...dialog,
        evidenceLeaveAlone: withOnEndOnLastLine(dialog.evidenceLeaveAlone!, onCloseWithoutLastLook),
        evidenceKeepCopy: withOnEndOnLastLine(dialog.evidenceKeepCopy!, onCloseWithoutLastLook),
        evidenceLastLook: withOnEndOnLastLine(dialog.evidenceLastLook!, onLastLook),
    };
};

const isExpectedNmapResult = (result: unknown): result is readonly Q04NmapPort[] => {
    if (!Array.isArray(result) || result.length !== Q04_NMAP_RESULT.length) {
        return false;
    }

    return Q04_NMAP_RESULT.every((expected) =>
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
};

let activeQ04Instance: EntityResolutionQ04Quest | null = null;

const closeAuditCallback = createScheduledCallback<undefined>(
    "entity_resolution.q04.closeAuditCallback",
);

closeAuditCallback.register(() => {
    activeQ04Instance?.receiveCloseAuditCallback();
});

const showRelayWidgetCallback = createScheduledCallback<{ completeOnClose: boolean }>(
    "entity_resolution.q04.showRelayWidgetCallback",
);

showRelayWidgetCallback.register((payload) => {
    activeQ04Instance?.receiveShowRelayWidgetCallback(payload.completeOnClose);
});

@RegisterQuest
export class EntityResolutionQ04Quest extends HackHubQuest<Q04QuestData> {
    override Name = "entity_resolution.q04";
    override Title = "LEAVE IT ALONE";
    override Description =
        "Client confirms edge-03's decommission and asks to close the audit — but the server is still live.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = false;
    override Abandonable = true;
    override QuestsToComplete = questGate("q04", ["entity_resolution.q03"]);
    override Rewards = { money: 0, xp: 0 };
    override Employer = {
        firstName: "Adrian",
        lastName: "Cole",
        email: Q04_ADRIAN_EMAIL,
        avatar: "assets/adrian-cole.png",
    };
    override HackhubPost = Q04_HACKHUB_POST_PRODUCTION;

    override Dialog: QuestDialogDefinition = attachDecisionOnEnd(
        Q04_DIALOG,
        () => this.finishDecideOnEvidenceAndComplete(),
        () => this.finishDecideOnEvidenceAwaitingLastLook(),
    );

    override Objectives = applyDevGating(Q04_OBJECTIVES, isQuestDevFocus("q04"));

    override CreateData(): Q04QuestData {
        return {
            reviewDecommissionNoticeDone: false,
            verifyServerStatusDone: false,
            closeAuditDone: false,
            decideOnEvidenceDone: false,
            checkLastConnectionDone: false,
        };
    }

    override OnStart() {
        activeQ04Instance = this;
        gameRuntime.quest.start(Q04_LEAVE_IT_ALONE);

        Network.destroyNetwork(Q04_TARGET_IP);

        Network.createSubnetNetwork({
            ip: Q04_ROUTER_IP,
            type: Network.Type.Router,
            ports: [],
            users: [],
            children: [
                {
                    ip: Q04_TARGET_IP,
                    type: Network.Type.Device,
                    ports: Q04_NETWORK_PORTS,
                    users: [
                        Network.createUser({
                            username: Q04_SSH_USERNAME,
                            password: Q04_SSH_PASSWORD,
                        }),
                    ],
                    rootFiles: Q04_ROOT_FILES,
                },
            ],
        });

        Network.registerDomain(Q04_WEB_HOST, Q04_TARGET_IP);

        sendAdrianMail(Q04_INCOMING_MAIL_SUBJECT, Q04_INCOMING_MAIL_CONTENT);
        sendAdrianMail(Q04_DECOMMISSION_NOTICE_SUBJECT, Q04_DECOMMISSION_NOTICE_CONTENT);
    }

    override OnObjectivesStart() {
        registerQ04ShellFixtures();

        Mail.registerTemplate({
            id: Q04_CLOSE_AUDIT_TEMPLATE_ID,
            label: Q04_CLOSE_AUDIT_TEMPLATE_LABEL,
            title: Q04_CLOSE_AUDIT_TEMPLATE_LABEL,
            content: Q04_CLOSE_AUDIT_REPORT_CONTENT,
        });

        Mail.registerTemplate({
            id: Q04_CLOSE_AUDIT_NOTE_TEMPLATE_ID,
            label: Q04_CLOSE_AUDIT_NOTE_TEMPLATE_LABEL,
            title: Q04_CLOSE_AUDIT_TEMPLATE_LABEL,
            content: Q04_CLOSE_AUDIT_NOTE_TEMPLATE_CONTENT,
            fields: ["note"],
        });

        this.Events.on("Mail.Read", (data) => {
            this.handleMailRead(data);
        });

        this.Events.on("Terminal.Command", (data) => {
            this.handleTerminalCommand(data);
        });

        this.Events.on("Terminal.Cat", (data) => {
            this.handleTerminalCat(data);
        });

        this.Events.on("Mail.Sent", (data) => {
            this.handleMailSent(data.subject, data.content);
        });
    }

    override OnComplete() {
        gameRuntime.flagStore.set(Q04_FINAL_STATE_FLAG, true);
        gameRuntime.flagStore.set(Q04_CRI_IP_CONFIRMED_FLAG, this.Data.verifyServerStatusDone);
        gameRuntime.flagStore.set(Q04_LAST_CONNECTION_CHECKED_FLAG, this.Data.checkLastConnectionDone);
        gameRuntime.flagStore.set(Q04_LOG_MISMATCH_FOUND_FLAG, this.Data.checkLastConnectionDone);
        gameRuntime.flagStore.set(ENTITY_RESOLUTION_FLAGS.adrianWarnedPlayer, true);
        gameRuntime.flagStore.set(ENTITY_RESOLUTION_FLAGS.unknownContactedPlayer, true);

        const completed = gameRuntime.quest.complete(Q04_LEAVE_IT_ALONE);

        if (!completed) {
            throw new Error(
                "Q04 HackHub completion diverged from canonical runtime completion.",
            );
        }

        if (!isQuestDevFocus("q04")) {
            const claimXp = (suffix: string, amount: number): void => {
                gameRuntime.reward.claim({
                    id: asId<"Reward">(`entity_resolution.q04.xp.${suffix}`),
                    kind: "experience",
                    amount,
                });
            };

            claimXp("verify-decommission-status", Q04_REWARDS.verifyDecommissionStatus);
            claimXp("investigate-active-server", Q04_REWARDS.investigateActiveServer);
            claimXp("preserve-anomalous-evidence", Q04_REWARDS.preserveAnomalousEvidence);

            if (this.Data.checkLastConnectionDone) {
                claimXp("analyze-last-connection", Q04_REWARDS.analyzeLastConnection);
                claimXp("identify-auth-log-mismatch", Q04_REWARDS.identifyAuthLogMismatch);
            }

            const moneyGranted = gameRuntime.economy.applyMissionReward(
                {
                    id: asId<"MissionReward">("entity_resolution.q04.money"),
                    questId: "entity_resolution.q04",
                    amount: Q04_REWARDS.money,
                    rewardIndex: 0,
                },
                Q04_FINAL_STATE_FLAG,
            );

            if (moneyGranted) {
                Bank.transaction({
                    amount: Q04_REWARDS.money,
                    description: Q04_DECOMMISSION_NOTICE_SUBJECT,
                    from: {
                        IBAN: "ID00SKYNETLOGISTICS",
                        name: "Skynet Logistics",
                    },
                });
            }
        }

        resetQ04ShellFixtures();
        Network.removeDomain(Q04_WEB_HOST);
        Network.destroyNetwork(Q04_ROUTER_IP);
        gameRuntime.persistence.save();
    }

    override OnAbandon() {
        resetQ04ShellFixtures();
        Network.removeDomain(Q04_WEB_HOST);
        Network.destroyNetwork(Q04_ROUTER_IP);
    }

    private handleMailRead(data: MailReadData): void {
        if (this.Data.reviewDecommissionNoticeDone) {
            return;
        }

        if (data.from !== Q04_ADRIAN_EMAIL || data.subject !== Q04_DECOMMISSION_NOTICE_SUBJECT) {
            return;
        }

        this.SetData("reviewDecommissionNoticeDone", true);
        this.completeObjective(Q04_OBJECTIVE_IDS.reviewDecommissionNotice);
    }

    private handleTerminalCommand(data: TerminalCommandData): void {
        if (data.command !== "nmap" || this.Data.verifyServerStatusDone) {
            return;
        }

        if (data.args.length > 0 && data.args[0] !== Q04_TARGET_IP) {
            return;
        }

        const result = Shell.getCommandData(
            "nmap",
            data.args.length === 0 ? "" : Q04_TARGET_IP,
        );

        if (!isExpectedNmapResult(result)) {
            return;
        }

        this.SetData("verifyServerStatusDone", true);
        this.completeObjective(Q04_OBJECTIVE_IDS.verifyServerStatus);
    }

    private handleTerminalCat(data: TerminalCatData): void {
        if (this.Data.checkLastConnectionDone) {
            return;
        }

        const fileName = data.extension ? `${data.name}.${data.extension}` : data.name;

        if (!fileName.toLowerCase().includes("gateway.log")) {
            return;
        }

        this.SetData("checkLastConnectionDone", true);
        this.completeObjective(Q04_OBJECTIVE_IDS.checkLastConnection);
        this.complete();
    }

    private handleMailSent(subject: string, content: string): void {
        if (this.Data.closeAuditDone || !this.isCloseAuditSubmission(subject, content)) {
            return;
        }

        this.SetData("closeAuditDone", true);
        this.completeObjective(Q04_OBJECTIVE_IDS.closeAudit);

        closeAuditCallback.schedule(undefined, Q04_CLOSE_AUDIT_CALLBACK_DELAY);
    }

    receiveCloseAuditCallback(): void {
        setTimeout(() => {
            this.createDialog("decideOnEvidence");
        }, Q04_POST_WAIT_DIALOG_DELAY_MS);
    }

    receiveShowRelayWidgetCallback(completeOnClose: boolean): void {
        this.showUnknownRelayWidget(completeOnClose);
    }

    private finishDecideOnEvidenceAndComplete(): void {
        this.finishDecideOnEvidence(true);
    }

    private finishDecideOnEvidenceAwaitingLastLook(): void {
        this.finishDecideOnEvidence(false);
    }

    private showUnknownRelayWidget(completeOnClose: boolean): void {
        UI.notify("Incoming relay — untraceable.");

        try {
            Desktop.removeWidget(Q04_UNKNOWN_RELAY_WIDGET_ID);
        } catch {}

        Desktop.addWidget({
            id: Q04_UNKNOWN_RELAY_WIDGET_ID,
            src: Q04_UNKNOWN_RELAY_WIDGET_SRC,
            width: Q04_UNKNOWN_RELAY_WIDGET_WIDTH,
            height: Q04_UNKNOWN_RELAY_WIDGET_HEIGHT,
            position: Q04_UNKNOWN_RELAY_WIDGET_POSITION,
            transparent: false,
        });

        setTimeout(() => {
            Desktop.removeWidget(Q04_UNKNOWN_RELAY_WIDGET_ID);

            if (completeOnClose) {
                this.complete();
            }
        }, Q04_UNKNOWN_RELAY_WIDGET_DURATION_MS);
    }

    private finishDecideOnEvidence(completeOnWidgetClose: boolean): void {
        if (this.Data.decideOnEvidenceDone) {
            return;
        }

        showRelayWidgetCallback.schedule(
            { completeOnClose: completeOnWidgetClose },
            Q04_SHOW_RELAY_WIDGET_DELAY,
        );

        this.SetData("decideOnEvidenceDone", true);
        this.completeObjective(Q04_OBJECTIVE_IDS.decideOnEvidence);
    }

    private isCloseAuditSubmission(subject: string, content: string): boolean {
        if (subject === Q04_CLOSE_AUDIT_TEMPLATE_ID) {
            return true;
        }

        if (this.isTemplateCloseAuditNoteSubmission(subject, content)) {
            return true;
        }

        const normalizedContent = content.trim();

        return (
            normalizedContent === Q04_CLOSE_AUDIT_REPORT_CONTENT ||
            normalizedContent === Q04_CLOSE_AUDIT_REPORT_WITH_NOTE_CONTENT
        );
    }

    private isTemplateCloseAuditNoteSubmission(subject: string, content: string): boolean {
        if (subject !== Q04_CLOSE_AUDIT_NOTE_TEMPLATE_ID) {
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

        const { note } = fields as Record<string, unknown>;

        return typeof note === "string";
    }
}
