import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
    ENTITY_RESOLUTION_FLAGS,
    UNKNOWN,
    Q04_ADRIAN_EMAIL,
    Q04_CLOSE_AUDIT_NOTE_CONTENT,
    Q04_CLOSE_AUDIT_NOTE_TEMPLATE_CONTENT,
    Q04_CLOSE_AUDIT_NOTE_TEMPLATE_ID,
    Q04_CLOSE_AUDIT_NOTE_TEMPLATE_LABEL,
    Q04_CLOSE_AUDIT_REPORT_CONTENT,
    Q04_CLOSE_AUDIT_REPORT_WITH_NOTE_CONTENT,
    Q04_CLOSE_AUDIT_CALLBACK_DELAY,
    Q04_CLOSE_AUDIT_TEMPLATE_ID,
    Q04_CLOSE_AUDIT_TEMPLATE_LABEL,
    Q04_DECOMMISSION_NOTICE_SUBJECT,
    Q04_FINAL_STATE_FLAG,
    Q04_LEAVE_IT_ALONE,
    Q04_NMAP_RESULT,
    Q04_OBJECTIVE_IDS,
    Q04_OBJECTIVES,
    Q04_REWARDS,
    Q04_TARGET_IP,
    Q04_UNKNOWN_RELAY_WIDGET_HEIGHT,
    Q04_UNKNOWN_RELAY_WIDGET_POSITION,
    Q04_UNKNOWN_RELAY_WIDGET_WIDTH,
    Q04_WEB_HOST,
} from "../src/content/index.js";

import { ConditionEvaluator } from "../src/domain/shared/index.js";

import {
    DomainStateAccess,
    FlagStore,
    StateStore,
    createDefaultRuntimeState,
} from "../src/state/index.js";

import { QuestService } from "../src/application/index.js";

const questSource = readFileSync(
    resolve(
        fileURLToPath(
            new URL("../src/infrastructure/hackhub/q04-quest.ts", import.meta.url),
        ),
    ),
    "utf8",
);

const productionEntrySource = readFileSync(
    resolve(fileURLToPath(new URL("../src/index.ts", import.meta.url))),
    "utf8",
);

const unknownRelayWidgetSource = readFileSync(
    resolve(
        fileURLToPath(
            new URL("../public/widgets/q04-unknown-relay.html", import.meta.url),
        ),
    ),
    "utf8",
);

const q04ContentSource = readFileSync(
    resolve(fileURLToPath(new URL("../src/content/q04.ts", import.meta.url))),
    "utf8",
);

describe("Q04 — LEAVE IT ALONE", () => {
    it("matches the quest identity, reused edge-03 host, and target", () => {
        assert.equal(Q04_LEAVE_IT_ALONE.id, "entity_resolution.q04");
        assert.equal(Q04_LEAVE_IT_ALONE.title, "LEAVE IT ALONE");
        assert.equal(Q04_WEB_HOST, "edge-03.skynet-logistics.idx");
        assert.equal(Q04_TARGET_IP, "203.0.113.77");
        assert.equal(Q04_ADRIAN_EMAIL, "adrian.cole@phantom-net.void");
    });

    it("defines 4 mandatory objectives plus one hidden optional", () => {
        assert.deepEqual(Q04_OBJECTIVE_IDS, {
            reviewDecommissionNotice: "q04.objective.01",
            verifyServerStatus: "q04.objective.02",
            closeAudit: "q04.objective.03",
            decideOnEvidence: "q04.objective.04",
            checkLastConnection: "q04.objective.04b",
        });

        const checkLastConnection = Q04_OBJECTIVES.find(
            (objective) => objective.name === Q04_OBJECTIVE_IDS.checkLastConnection,
        );
        assert.equal(checkLastConnection?.hidden, true);
        assert.deepEqual(checkLastConnection?.unlocksAfter, [
            Q04_OBJECTIVE_IDS.decideOnEvidence,
        ]);
    });

    it("preserves the reward allocation (100 XP max, $350)", () => {
        assert.deepEqual(Q04_REWARDS, {
            verifyDecommissionStatus: 20,
            investigateActiveServer: 20,
            analyzeLastConnection: 20,
            identifyAuthLogMismatch: 20,
            preserveAnomalousEvidence: 20,
            money: 350,
        });
        assert.equal(
            Q04_REWARDS.verifyDecommissionStatus +
                Q04_REWARDS.investigateActiveServer +
                Q04_REWARDS.preserveAnomalousEvidence,
            60,
        );
        assert.equal(
            Q04_REWARDS.verifyDecommissionStatus +
                Q04_REWARDS.investigateActiveServer +
                Q04_REWARDS.preserveAnomalousEvidence +
                Q04_REWARDS.analyzeLastConnection +
                Q04_REWARDS.identifyAuthLogMismatch,
            100,
        );
    });

    it("reuses Q02/Q03's nmap ports (22/443/8443) with no FORWARDED/anomaly framing", () => {
        assert.deepEqual(
            Q04_NMAP_RESULT.map((port) => port.port),
            [22, 443, 8443],
        );
        assert.doesNotMatch(q04ContentSource, /FORWARDED/);
    });

    it("uses the canonical completion flag as its runtime completion boundary", () => {
        const stateStore = new StateStore(createDefaultRuntimeState());
        const flagStore = new FlagStore(stateStore);
        const service = new QuestService(
            new DomainStateAccess(stateStore),
            new ConditionEvaluator(flagStore),
        );

        assert.equal(service.areObjectivesComplete(Q04_LEAVE_IT_ALONE), false);
        flagStore.set(Q04_FINAL_STATE_FLAG, true);
        assert.equal(service.areObjectivesComplete(Q04_LEAVE_IT_ALONE), true);
    });

    it("requires Q03 completion before Q04 becomes available, via questGate", () => {
        assert.match(
            questSource,
            /QuestsToComplete = questGate\("q04", \["entity_resolution\.q03"\]\)/,
        );
    });

    it("gates objective unlocksAfter and reward-granting on the q04 dev-focus flag", () => {
        assert.match(questSource, /applyDevGating\(Q04_OBJECTIVES, isQuestDevFocus\("q04"\)\)/);
        assert.match(questSource, /if \(!isQuestDevFocus\("q04"\)\) \{/);
    });

    it("gates Objective 01 on reading the client's decommission notice, not Adrian's informal heads-up", () => {
        assert.match(questSource, /"Mail\.Read"/);
        assert.match(questSource, /data\.subject !== Q04_DECOMMISSION_NOTICE_SUBJECT/);
    });

    it("completes verifyServerStatus on a plain nmap scan of the target IP, requiring no -sV flag (unlike Q02)", () => {
        assert.match(questSource, /Shell\.addCommandData\("nmap", Q04_TARGET_IP, Q04_NMAP_RESULT\)/);
        assert.doesNotMatch(questSource, /-sV/);
    });

    it("completes closeAudit via Mail.Sent matching either the close-as-requested or add-a-note content, with no subject requirement", () => {
        assert.match(questSource, /isCloseAuditSubmission/);
        assert.match(
            questSource,
            /normalizedContent === Q04_CLOSE_AUDIT_REPORT_CONTENT \|\|\s*normalizedContent === Q04_CLOSE_AUDIT_REPORT_WITH_NOTE_CONTENT/,
        );
        assert.equal(
            `${Q04_CLOSE_AUDIT_REPORT_CONTENT}\n\n${Q04_CLOSE_AUDIT_NOTE_CONTENT}`,
            Q04_CLOSE_AUDIT_REPORT_WITH_NOTE_CONTENT,
        );
    });

    it("registers two separate GoMail compose templates for closeAudit — a plain no-field one for Option A, and a required-note one for Option B", () => {
        assert.match(questSource, /Mail\.registerTemplate\(\{/);
        assert.match(questSource, /id: Q04_CLOSE_AUDIT_TEMPLATE_ID/);
        assert.match(questSource, /content: Q04_CLOSE_AUDIT_REPORT_CONTENT,\s*\}\);/);
        assert.match(questSource, /id: Q04_CLOSE_AUDIT_NOTE_TEMPLATE_ID/);
        assert.match(questSource, /content: Q04_CLOSE_AUDIT_NOTE_TEMPLATE_CONTENT/);
        assert.match(questSource, /fields: \["note"\]/);
        assert.equal(Q04_CLOSE_AUDIT_TEMPLATE_ID, "entity_resolution.q04.close-audit");
        assert.equal(Q04_CLOSE_AUDIT_TEMPLATE_LABEL, "Close Audit");
        assert.equal(Q04_CLOSE_AUDIT_NOTE_TEMPLATE_ID, "entity_resolution.q04.close-audit-note");
        assert.equal(Q04_CLOSE_AUDIT_NOTE_TEMPLATE_LABEL, "Close Audit (add a note)");
    });

    it("keeps the plain Option A template field-free (no {{}} placeholder, nothing required to fill in before Send is enabled)", () => {
        assert.doesNotMatch(Q04_CLOSE_AUDIT_REPORT_CONTENT, /\{\{/);
    });

    it("gives the Option B template body an editable {{note}} placeholder — GoMail requires one per declared field to render an input for it", () => {
        assert.match(Q04_CLOSE_AUDIT_NOTE_TEMPLATE_CONTENT, /\{\{note\}\}/);
    });

    it("accepts the plain template by subject alone (Option A), and the note template's JSON field payload (Option B), alongside freehand exact-match", () => {
        assert.match(questSource, /if \(subject === Q04_CLOSE_AUDIT_TEMPLATE_ID\) \{\s*return true;\s*\}/);
        assert.match(questSource, /isTemplateCloseAuditNoteSubmission/);
        assert.match(questSource, /subject !== Q04_CLOSE_AUDIT_NOTE_TEMPLATE_ID/);
        assert.match(questSource, /JSON\.parse\(content\)/);
        assert.match(questSource, /typeof note === "string"/);
    });

    it("delays the decideOnEvidence call by 1 in-game day after the audit closes, mirroring Q03's report-callback pattern", () => {
        assert.match(questSource, /createScheduledCallback<undefined>/);
        assert.match(
            questSource,
            /closeAuditCallback\.schedule\(undefined, Q04_CLOSE_AUDIT_CALLBACK_DELAY\)/,
        );
        assert.deepEqual(Q04_CLOSE_AUDIT_CALLBACK_DELAY, { days: 1 });

        const closeAuditHandler = questSource.match(
            /private handleMailSent\([\s\S]*?\n {4}\}/,
        );
        assert.ok(closeAuditHandler, "expected to find handleMailSent()");
        assert.doesNotMatch(closeAuditHandler![0], /createDialog/);
    });

    it("starts the decideOnEvidence dialog once the scheduled callback fires", () => {
        const callbackHandler = questSource.match(
            /receiveCloseAuditCallback\(\): void \{[\s\S]*?\n {4}\}/,
        );
        assert.ok(callbackHandler, "expected to find receiveCloseAuditCallback()");
        assert.match(callbackHandler![0], /this\.createDialog\("decideOnEvidence"\);/);
    });

    it("shows the unknown-relay desktop widget shortly after the phone call ends, regardless of the player's eventual choice, and auto-dismisses it — bounced through a second Scheduler callback because Dialog.onEnd itself loses the SDK's modId context for Desktop.addWidget", () => {
        const finishHandler = questSource.match(
            /private finishDecideOnEvidence\(completeOnWidgetClose: boolean\): void \{[\s\S]*?\n {4}\}/,
        );
        assert.ok(finishHandler, "expected to find finishDecideOnEvidence(completeOnWidgetClose)");
        assert.match(
            finishHandler![0],
            /showRelayWidgetCallback\.schedule\(\s*\{ completeOnClose: completeOnWidgetClose \},\s*Q04_SHOW_RELAY_WIDGET_DELAY,?\s*\);/,
        );

        const callbackHandler = questSource.match(
            /receiveShowRelayWidgetCallback\(completeOnClose: boolean\): void \{[\s\S]*?\n {4}\}/,
        );
        assert.ok(callbackHandler, "expected to find receiveShowRelayWidgetCallback(completeOnClose)");
        assert.match(callbackHandler![0], /this\.showUnknownRelayWidget\(completeOnClose\);/);

        const widgetHandler = questSource.match(
            /private showUnknownRelayWidget\(completeOnClose: boolean\): void \{[\s\S]*?\n {4}\}/,
        );
        assert.ok(widgetHandler, "expected to find showUnknownRelayWidget(completeOnClose)");
        assert.match(widgetHandler![0], /Desktop\.addWidget\(\{/);
        assert.match(widgetHandler![0], /id: Q04_UNKNOWN_RELAY_WIDGET_ID/);
        assert.match(widgetHandler![0], /src: Q04_UNKNOWN_RELAY_WIDGET_SRC/);
        assert.match(widgetHandler![0], /Desktop\.removeWidget\(Q04_UNKNOWN_RELAY_WIDGET_ID\);/);
        assert.doesNotMatch(questSource, /Mail\.send\(\{\s*from: Q04_UNKNOWN/);
    });

    it("locks the relay widget's size and position — DesktopWidget has no resize affordance in the SDK to begin with", () => {
        assert.equal(Q04_UNKNOWN_RELAY_WIDGET_WIDTH, 480);
        assert.equal(Q04_UNKNOWN_RELAY_WIDGET_HEIGHT, 600);
        assert.deepEqual(Q04_UNKNOWN_RELAY_WIDGET_POSITION, { x: 450, y: 90 });
    });

    it("shows the sender's canonical character email, not the ARKA-OPS-0441 identity that would spoil Q16's reveal", () => {
        assert.match(unknownRelayWidgetSource, /FROM:/);
        assert.match(unknownRelayWidgetSource, new RegExp(UNKNOWN.email));
        assert.doesNotMatch(unknownRelayWidgetSource, /arka-ops-0441/i);
    });

    it("types the relay message out letter by letter instead of dumping it all at once", () => {
        assert.match(unknownRelayWidgetSource, /<script>/);
        assert.match(unknownRelayWidgetSource, /setTimeout\(\s*typeMessage,/);
        assert.match(unknownRelayWidgetSource, /You found the wrong server\./);
    });

    it("attaches objective completion to the end of all three decideOnEvidence branches, deferring quest completion until the relay widget closes for two of them but not the take-one-last-look branch", () => {
        assert.match(
            questSource,
            /evidenceLeaveAlone: withOnEndOnLastLine\(dialog\.evidenceLeaveAlone!, onCloseWithoutLastLook\)/,
        );
        assert.match(
            questSource,
            /evidenceKeepCopy: withOnEndOnLastLine\(dialog\.evidenceKeepCopy!, onCloseWithoutLastLook\)/,
        );
        assert.match(
            questSource,
            /evidenceLastLook: withOnEndOnLastLine\(dialog\.evidenceLastLook!, onLastLook\)/,
        );

        const immediateComplete = questSource.match(
            /private finishDecideOnEvidenceAndComplete\(\): void \{[\s\S]*?\n {4}\}/,
        );
        assert.ok(immediateComplete, "expected to find finishDecideOnEvidenceAndComplete()");
        assert.match(immediateComplete![0], /this\.finishDecideOnEvidence\(true\);/);

        const awaitingLastLook = questSource.match(
            /private finishDecideOnEvidenceAwaitingLastLook\(\): void \{[\s\S]*?\n {4}\}/,
        );
        assert.ok(awaitingLastLook, "expected to find finishDecideOnEvidenceAwaitingLastLook()");
        assert.match(awaitingLastLook![0], /this\.finishDecideOnEvidence\(false\);/);

        const widgetHandler = questSource.match(
            /private showUnknownRelayWidget\(completeOnClose: boolean\): void \{[\s\S]*?\n {4}\}/,
        );
        assert.ok(widgetHandler, "expected to find showUnknownRelayWidget(completeOnClose)");
        assert.match(
            widgetHandler![0],
            /if \(completeOnClose\) \{\s*this\.complete\(\);\s*\}/,
        );
    });

    it("does not rely on AutoComplete — the engine would otherwise wait on the hidden optional objective forever for players who never open it", () => {
        assert.match(questSource, /override AutoComplete = false;/);
    });

    it("completes checkLastConnection's own path manually once the file is read, since it's the only remaining step for that branch", () => {
        const catHandler = questSource.match(
            /private handleTerminalCat\([\s\S]*?\n {4}\}/,
        );
        assert.ok(catHandler, "expected to find handleTerminalCat()");
        assert.match(catHandler![0], /this\.complete\(\);/);
    });

    it("exposes the native Abandon Quest action and cleans up network/fixtures the same way OnComplete does", () => {
        assert.match(questSource, /override Abandonable = true;/);
        const onAbandon = questSource.match(/override OnAbandon\(\) \{[\s\S]*?\n {4}\}/);
        assert.ok(onAbandon, "expected to find OnAbandon()");
        assert.match(onAbandon![0], /resetQ04ShellFixtures\(\);/);
        assert.match(onAbandon![0], /Network\.removeDomain\(Q04_WEB_HOST\);/);
        assert.match(onAbandon![0], /Network\.destroyNetwork\(Q04_ROUTER_IP\);/);
    });

    it("sets Employer so the decideOnEvidence phone call shows Adrian's identity correctly, mirroring Q03", () => {
        const employerBlock = questSource.match(/override Employer = \{[\s\S]*?\};/);
        assert.ok(employerBlock, "expected to find an Employer override");
        assert.match(employerBlock![0], /firstName: "Adrian"/);
        assert.match(employerBlock![0], /lastName: "Cole"/);
        assert.match(employerBlock![0], /email: Q04_ADRIAN_EMAIL/);
    });

    it("completes checkLastConnection by reading gateway.log, not by diffing it against auth.log programmatically", () => {
        assert.match(questSource, /"Terminal\.Cat"/);
        assert.match(questSource, /fileName\.toLowerCase\(\)\.includes\("gateway\.log"\)/);
        assert.doesNotMatch(questSource, /auth\.log/);
    });

    it("sets campaign-wide flags on completion — Adrian warned, the unknown contact hook active, CRI still unresolved", () => {
        assert.match(
            questSource,
            /gameRuntime\.flagStore\.set\(ENTITY_RESOLUTION_FLAGS\.adrianWarnedPlayer, true\)/,
        );
        assert.match(
            questSource,
            /gameRuntime\.flagStore\.set\(ENTITY_RESOLUTION_FLAGS\.unknownContactedPlayer, true\)/,
        );
        assert.doesNotMatch(questSource, /ENTITY_RESOLUTION_FLAGS\.criKnown/);
        assert.equal(ENTITY_RESOLUTION_FLAGS.unknownContactedPlayer, "entity_resolution.unknown_contacted_player");
    });

    it("only claims the last-connection XP lines when checkLastConnection was actually completed", () => {
        assert.match(
            questSource,
            /if \(this\.Data\.checkLastConnectionDone\) \{\s*claimXp\("analyze-last-connection", Q04_REWARDS\.analyzeLastConnection\);\s*claimXp\("identify-auth-log-mismatch", Q04_REWARDS\.identifyAuthLogMismatch\);\s*\}/,
        );
    });

    it("deposits the money reward via the native Bank API, skipped when q04 is the dev focus", () => {
        assert.match(
            questSource,
            /if \(!isQuestDevFocus\("q04"\)\) \{[\s\S]*?const moneyGranted = gameRuntime\.economy\.applyMissionReward\(/,
        );
        assert.match(questSource, /if \(moneyGranted\) \{\s*Bank\.transaction\(\{/);
    });

    it("is registered in the production bootstrap", () => {
        assert.match(
            productionEntrySource,
            /import "\.\/infrastructure\/hackhub\/q04-quest\.js";/,
        );
    });
});
