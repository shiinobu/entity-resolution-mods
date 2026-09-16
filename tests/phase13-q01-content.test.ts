import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
    Q01_ADRIAN_EMAIL,
    Q01_CLIENT_NAME,
    Q01_FINAL_STATE_FLAG,
    Q01_LYNX_INPUT_IP,
    Q01_LYNX_INPUT_URL,
    Q01_OBJECTIVES,
    Q01_OBJECTIVE_IDS,
    Q01_OPEN_PORTS,
    Q01_RECON_INPUT,
    Q01_RECON_INPUT_VARIANTS,
    Q01_RECON_PROFILE,
    Q01_RECON_RESULT,
    Q01_REPORT_BODY,
    Q01_REPORT_BODY_TEMPLATE,
    Q01_REPORT_RECIPIENT,
    Q01_REPORT_SUBJECT,
    Q01_REPORT_TEMPLATE_ID,
    Q01_REPORT_TEMPLATE_LABEL,
    Q01_REWARDS,
    Q01_TARGET_IP,
    Q01_THE_CONTRACT,
    Q01_WEB_AUDIT_PATH,
    Q01_WEB_AUDIT_URL,
    Q01_WEB_FORBIDDEN_PATHS,
    Q01_WEB_HOST,
    Q01_WEB_HOME_HOST,
    Q01_WEB_HOME_URL,
    Q01_WEB_HTTPS_URL,
    Q01_WEB_PATHS,
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
            new URL("../src/infrastructure/hackhub/q01-quest.ts", import.meta.url),
        ),
    ),
    "utf8",
);

const q01ContentSource = readFileSync(
    resolve(fileURLToPath(new URL("../src/content/q01.ts", import.meta.url))),
    "utf8",
);

const replayQuestSource = readFileSync(
    resolve(fileURLToPath(new URL("../dev/q01-replay-quest.ts", import.meta.url))),
    "utf8",
);

describe("Phase 13 Q01 — THE CONTRACT", () => {
    it("matches the revised quest identity, client, target, and apex domain", () => {
        assert.equal(Q01_THE_CONTRACT.id, "entity_resolution.q01");
        assert.equal(Q01_THE_CONTRACT.title, "THE CONTRACT");
        assert.equal(Q01_CLIENT_NAME, "Skynet Logistics");
        assert.equal(Q01_TARGET_IP, "203.0.113.42");
        assert.equal(Q01_WEB_HOST, "skynet-logistics.idx");
    });

    it("defines the canonical public host and audit/forbidden paths (path-based redesign, not yet locked)", () => {
        assert.equal(Q01_WEB_HOME_HOST, "www.skynet-logistics.idx");
        assert.equal(Q01_WEB_AUDIT_PATH, "/security");
        assert.deepEqual(Q01_WEB_FORBIDDEN_PATHS, ["/portal", "/status"]);
        assert.deepEqual(Q01_WEB_PATHS, ["/", "/portal", "/status", "/security"]);
        assert.equal(Q01_WEB_PATHS.length, 4);
        assert.equal(Q01_WEB_HOME_URL, "https://www.skynet-logistics.idx/");
        assert.equal(Q01_WEB_HTTPS_URL, Q01_WEB_HOME_URL);
        assert.equal(
            Q01_WEB_AUDIT_URL,
            "https://www.skynet-logistics.idx/security",
        );
    });

    it("defines the reusable recon input variants and deterministic Q01 profile", () => {
        assert.equal(Q01_LYNX_INPUT_IP, "203.0.113.42");
        assert.equal(Q01_LYNX_INPUT_URL, "https://203.0.113.42/");
        assert.equal(Q01_RECON_INPUT, "-d https://www.skynet-logistics.idx/");
        assert.deepEqual(Q01_RECON_INPUT_VARIANTS, [
            "-d https://www.skynet-logistics.idx/",
            "-d skynet-logistics.idx",
            "-d www.skynet-logistics.idx",
            "-d https://skynet-logistics.idx",
            "-d https://skynet-logistics.idx/",
            "-d https://www.skynet-logistics.idx",
            "skynet-logistics.idx",
            "www.skynet-logistics.idx",
            "https://skynet-logistics.idx",
            "https://www.skynet-logistics.idx",
            "https://skynet-logistics.idx/",
            "https://www.skynet-logistics.idx/",
        ]);
        assert.equal(
            Q01_RECON_RESULT,
            "portal.skynet-logistics.idx\nsecurity.skynet-logistics.idx\nstatus.skynet-logistics.idx\nwww.skynet-logistics.idx",
        );
        assert.equal(Q01_RECON_PROFILE.id, "q01");
        assert.deepEqual(Q01_RECON_PROFILE.resultHosts, [
            "portal.skynet-logistics.idx",
            "security.skynet-logistics.idx",
            "status.skynet-logistics.idx",
            "www.skynet-logistics.idx",
        ]);
        assert.equal(Q01_RECON_PROFILE.sources.length, 5);
        assert.equal(
            Q01_RECON_PROFILE.sources.reduce(
                (total, source) => total + source.candidates.length,
                0,
            ),
            8,
        );
    });

    it("keeps the Lynx address as one runtime list entry and resets stale fixtures before registration (fixture data now lives in content/q01.ts, shared by production and replay)", () => {
        assert.match(q01ContentSource, /address:\s*\[Q01_WEB_HOME_URL\],/);
        assert.doesNotMatch(
            q01ContentSource,
            /Q01_WEB_HOME_URL\s+as unknown as string\[\]/,
        );
        assert.match(
            questSource,
            /Shell\.removeCommandData\("lynx", Q01_LYNX_INPUT_IP\);[\s\S]*Shell\.addCommandData\("lynx", Q01_LYNX_INPUT_IP, Q01_LYNX_RESULT\);/,
        );
        assert.match(
            questSource,
            /Shell\.removeCommandData\("lynx", Q01_LYNX_INPUT_URL\);[\s\S]*Shell\.addCommandData\("lynx", Q01_LYNX_INPUT_URL, Q01_LYNX_RESULT\);/,
        );
    });

    it("populates the Lynx 'additional' OSINT section instead of leaving it empty", () => {
        assert.match(
            q01ContentSource,
            /additional:\s*\[\s*Q01_CLIENT_NAME,/,
        );
    });

    it("shares Q01_NMAP_RESULT, Q01_LYNX_RESULT, and Q01_NETWORK_PORTS from content/q01.ts instead of duplicating them in production and replay", () => {
        assert.match(q01ContentSource, /export const Q01_NMAP_RESULT/);
        assert.match(q01ContentSource, /export const Q01_LYNX_RESULT/);
        assert.match(q01ContentSource, /export const Q01_NETWORK_PORTS/);
        assert.doesNotMatch(questSource, /const Q01_NMAP_RESULT/);
        assert.doesNotMatch(questSource, /const Q01_LYNX_RESULT/);
        assert.match(questSource, /ports: Q01_NETWORK_PORTS,/);
    });

    it("gates Objective 04 progress on the native Terminal.Dirhunter event (experimental path-based redesign)", () => {
        assert.match(questSource, /"Terminal\.Dirhunter"/);
        assert.match(questSource, /handleDirhunter/);
        assert.match(
            questSource,
            /normalizeHost\(rawHost\)\s*===\s*Q01_WEB_HOME_HOST/,
        );
        assert.match(questSource, /data\.hostname !== Q01_WEB_HOME_HOST/);
        assert.match(questSource, /data\.pathname !== Q01_WEB_AUDIT_PATH/);
    });

    it("does not auto-complete Objective 01 in OnStart; it only completes once the player reads Adrian's mail", () => {
        assert.match(questSource, /"Mail\.Read"/);
        assert.match(questSource, /handleMailRead/);
        assert.match(
            questSource,
            /data\.from !== Q01_ADRIAN_EMAIL \|\| data\.subject !== Q01_REPORT_SUBJECT/,
        );

        const onStartMatch = questSource.match(
            /override OnStart\(\) \{[\s\S]*?\n {4}\}/,
        );
        assert.ok(onStartMatch, "expected to find OnStart() body");
        assert.doesNotMatch(
            onStartMatch![0],
            /completeObjective\(Q01_OBJECTIVE_IDS\.reviewScope\)/,
        );
    });

    it("deposits the money reward into the player's real bank account via the native Bank API", () => {
        assert.match(questSource, /import \{[\s\S]*?\bBank\b[\s\S]*?\} from "@hotbunny\/hackhub-content-sdk";/);
        assert.match(
            questSource,
            /const moneyGranted = gameRuntime\.economy\.applyMissionReward\(/,
        );
        assert.match(
            questSource,
            /if \(moneyGranted\) \{\s*Bank\.transaction\(\{/,
        );
    });

    it("shares Q01_OBJECTIVES between production and replay with no hint on submitAudit (GoMail compose template teaches the format interactively instead)", () => {
        assert.match(q01ContentSource, /export const Q01_OBJECTIVES/);
        assert.match(questSource, /override Objectives = Q01_OBJECTIVES;/);
        assert.match(replayQuestSource, /override Objectives = Q01_OBJECTIVES;/);

        const submitAudit = Q01_OBJECTIVES.find(
            (objective) => objective.name === Q01_OBJECTIVE_IDS.submitAudit,
        );
        assert.ok(submitAudit, "expected to find the submitAudit objective");
        assert.equal((submitAudit as { hint?: string }).hint, undefined);
    });

    it("registers a GoMail compose template for the audit report in both production and replay, and validates its raw JSON field payload", () => {
        assert.match(questSource, /Mail\.registerTemplate\(\{/);
        assert.match(questSource, /id: Q01_REPORT_TEMPLATE_ID/);
        assert.match(questSource, /fields: \["company", "ports", "url"\]/);
        assert.match(replayQuestSource, /Mail\.registerTemplate\(\{/);
        // Deliberately NOT unregistered — confirmed live that unregistering
        // breaks GoMail's re-render of the player's own already-sent mail.
        assert.doesNotMatch(questSource, /Mail\.unregisterTemplate\(/);
        assert.doesNotMatch(replayQuestSource, /Mail\.unregisterTemplate\(/);
        assert.match(questSource, /label: Q01_REPORT_TEMPLATE_LABEL/);
        assert.match(replayQuestSource, /label: Q01_REPORT_TEMPLATE_LABEL/);
        assert.equal(Q01_REPORT_TEMPLATE_LABEL, "Audit Report");

        assert.match(questSource, /isTemplateAuditReport/);
        assert.match(questSource, /subject !== Q01_REPORT_TEMPLATE_ID/);
        assert.match(questSource, /JSON\.parse\(content\)/);
        assert.match(
            questSource,
            /company === Q01_CLIENT_NAME &&\s*ports === Q01_OPEN_PORTS &&\s*url === Q01_WEB_AUDIT_URL/,
        );
        assert.equal(Q01_OPEN_PORTS, "443");
    });

    it("delays submitAudit completion 7s after the report is validated, so the completion mail + reward don't land the same tick", () => {
        assert.match(q01ContentSource, /Q01_SUBMIT_AUDIT_DELAY_MS = 7_000/);
        assert.match(
            questSource,
            /setTimeout\(\(\) => \{\s*this\.completeObjective\(Q01_OBJECTIVE_IDS\.submitAudit\);\s*\}, Q01_SUBMIT_AUDIT_DELAY_MS\);/,
        );
        assert.match(
            replayQuestSource,
            /setTimeout\(\(\) => \{\s*this\.completeObjective\(Q01_OBJECTIVE_IDS\.submitAudit\);\s*\}, Q01_SUBMIT_AUDIT_DELAY_MS\);/,
        );
    });

    it("shares Q01_COMPLETION_MAIL_CONTENT_PRODUCTION / _REPLAY from content/q01.ts instead of duplicating the literal in each quest file — production mentions the real money reward, replay does not", () => {
        assert.match(q01ContentSource, /export const Q01_COMPLETION_MAIL_CONTENT_PRODUCTION/);
        assert.match(q01ContentSource, /export const Q01_COMPLETION_MAIL_CONTENT_REPLAY/);
        assert.match(q01ContentSource, /Payment's on the way\./);
        assert.match(q01ContentSource, /DEV replay complete\./);
        assert.match(questSource, /Q01_COMPLETION_MAIL_CONTENT_PRODUCTION/);
        assert.match(replayQuestSource, /Q01_COMPLETION_MAIL_CONTENT_REPLAY/);
        assert.doesNotMatch(questSource, /const Q01_COMPLETION_MAIL_CONTENT/);
        assert.doesNotMatch(replayQuestSource, /const Q01_COMPLETION_MAIL_CONTENT/);
    });

    it("no longer dumps the report format as plain text inside the incoming mail — the compose template teaches it interactively", () => {
        assert.doesNotMatch(questSource, /Format report audit:/);
        assert.doesNotMatch(replayQuestSource, /Format report audit:/);
    });

    it("declares HackhubPost and the incoming mail in content/q01.ts instead of as inline literals in the quest files — a teaser that points to the mail, not a near-duplicate of its body", () => {
        assert.match(q01ContentSource, /export const Q01_HACKHUB_POST_PRODUCTION: QuestHackhubPostDefinition = \{/);
        assert.match(q01ContentSource, /export const Q01_HACKHUB_POST_REPLAY: QuestHackhubPostDefinition = \{/);
        assert.match(q01ContentSource, /Short audit for a client in Jakarta\. Details in your mail\./);
        assert.match(q01ContentSource, /export const Q01_INCOMING_MAIL_CONTENT = \[/);

        assert.match(questSource, /override HackhubPost = Q01_HACKHUB_POST_PRODUCTION;/);
        assert.match(replayQuestSource, /override HackhubPost = Q01_HACKHUB_POST_REPLAY;/);
        assert.doesNotMatch(questSource, /override HackhubPost = \{/);
        assert.doesNotMatch(replayQuestSource, /override HackhubPost = \{/);
        assert.doesNotMatch(questSource, /const Q01_INCOMING_MAIL_CONTENT =/);
        assert.doesNotMatch(replayQuestSource, /const Q01_INCOMING_MAIL_CONTENT =/);
    });

    it("sends the identical incoming mail body in production and replay — matches Q02_INCOMING_MAIL_CONTENT's already-shared pattern; the DEV signal comes through Title/HackhubPost/author instead", () => {
        assert.doesNotMatch(q01ContentSource, /Q01_INCOMING_MAIL_CONTENT_PRODUCTION/);
        assert.doesNotMatch(q01ContentSource, /Q01_INCOMING_MAIL_CONTENT_REPLAY/);
        assert.doesNotMatch(q01ContentSource, /DEV REPLAY — Q01 TEST CONTRACT/);
        assert.match(questSource, /sendAdrianMail\(Q01_REPORT_SUBJECT, Q01_INCOMING_MAIL_CONTENT\);/);
        assert.match(replayQuestSource, /content: Q01_INCOMING_MAIL_CONTENT,/);
    });

    it("reuses Q01_REPORT_SUBJECT as a constant/template everywhere instead of a duplicated magic-string literal", () => {
        assert.doesNotMatch(questSource, /"Security Audit — Jakarta"/);
        assert.match(questSource, /description: Q01_REPORT_SUBJECT,/);
        assert.match(questSource, /sendAdrianMail\(`Re: \$\{Q01_REPORT_SUBJECT\}`, Q01_COMPLETION_MAIL_CONTENT_PRODUCTION\);/);
    });

    it("defines the canonical email identity and player-facing report template", () => {
        assert.equal(Q01_ADRIAN_EMAIL, "adrian.cole@phantom-net.void");
        assert.equal(Q01_REPORT_RECIPIENT, Q01_ADRIAN_EMAIL);
        assert.equal(Q01_REPORT_SUBJECT, "Security Audit — Jakarta");
        assert.equal(
            Q01_REPORT_BODY_TEMPLATE,
            "Target: {{company}}\n\nFindings:\n- Open ports: {{ports}}\n- Public web presence: {{url}}\n- No critical vulnerabilities identified.\n\nRecommendation: Further internal assessment is recommended.",
        );
        assert.equal(
            Q01_REPORT_BODY,
            `Target: Skynet Logistics\n\nFindings:\n- Open ports: 443\n- Public web presence: ${Q01_WEB_AUDIT_URL}\n- No critical vulnerabilities identified.\n\nRecommendation: Further internal assessment is recommended.`,
        );
    });

    it("defines six player objective ids (experimental path-based redesign added Enumerate hidden pages, not yet locked)", () => {
        assert.deepEqual(Q01_OBJECTIVE_IDS, {
            reviewScope: "q01.objective.01",
            scanNetwork: "q01.objective.02",
            identifyServices: "q01.objective.03",
            enumeratePaths: "q01.objective.04",
            basicVulnerabilityChecks: "q01.objective.05",
            submitAudit: "q01.objective.06",
        });
    });

    it("uses the canonical completion flag as its runtime completion boundary", () => {
        const stateStore = new StateStore(createDefaultRuntimeState());
        const flagStore = new FlagStore(stateStore);
        const service = new QuestService(
            new DomainStateAccess(stateStore),
            new ConditionEvaluator(flagStore),
        );

        assert.equal(service.areObjectivesComplete(Q01_THE_CONTRACT), false);
        flagStore.set(Q01_FINAL_STATE_FLAG, true);
        assert.equal(service.areObjectivesComplete(Q01_THE_CONTRACT), true);
    });

    it("preserves the Phase 8 Q01 XP allocation and final money reward", () => {
        assert.deepEqual(Q01_REWARDS, {
            externalAudit: 35,
            networkServiceEnumeration: 20,
            basicVulnerabilityAssessment: 10,
            submitCorrectReport: 15,
            money: 200,
        });
        assert.equal(
            Q01_REWARDS.externalAudit +
                Q01_REWARDS.networkServiceEnumeration +
                Q01_REWARDS.basicVulnerabilityAssessment +
                Q01_REWARDS.submitCorrectReport,
            80,
        );
    });
});
