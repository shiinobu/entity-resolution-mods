import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
    Q03_CLIENT_NAME,
    Q03_FINAL_STATE_FLAG,
    Q03_HOLD_MAIL_BACKUP_SEGMENT,
    Q03_HOLD_MAIL_BASE_CONTENT,
    Q03_INCOMING_MAIL_CONTENT,
    Q03_LAST_ACTIVITY_DATE,
    Q03_LOGS_START_DATE,
    Q03_MISSING_LOGS,
    Q03_MISSING_ROTATIONS,
    Q03_OBJECTIVE_IDS,
    Q03_OBJECTIVES,
    Q03_REPLAY_OBJECTIVES,
    Q03_REPORT_BODY,
    Q03_REPORT_SUBJECT,
    Q03_REWARDS,
    Q03_ROOT_FILES,
    Q03_SSH_PASSWORD,
    Q03_SSH_USERNAME,
    Q03_TARGET_IP,
    Q03_WEB_HOST,
} from "../src/content/index.js";

import { ConditionEvaluator } from "../src/domain/shared/index.js";

import {
    DomainStateAccess,
    FlagStore,
    StateStore,
    createDefaultRuntimeState,
} from "../src/state/index.js";

import { QuestService } from "../src/application/index.js";

const readSource = (relativePath: string): string =>
    readFileSync(
        resolve(fileURLToPath(new URL(relativePath, import.meta.url))),
        "utf8",
    );

const q03ContentSource = readSource("../src/content/q03.ts");
const filestatSource = readSource("../src/infrastructure/hackhub/commands/q03-filestat.ts");
const bootlogSource = readSource("../src/infrastructure/hackhub/commands/q03-bootlog.ts");
const zgrepSource = readSource("../src/infrastructure/hackhub/commands/q03-zgrep.ts");
const manifestSource = readSource("../manifest.json");

describe("Phase 13 Q03 — MISSING LOGS (recovered source, quest wiring not yet implemented)", () => {
    it("targets the same host Q02 already investigated — no re-resolve puzzle", () => {
        assert.equal(Q03_CLIENT_NAME, "Skynet Logistics");
        assert.equal(Q03_WEB_HOST, "edge-03.skynet-logistics.idx");
        assert.equal(Q03_TARGET_IP, "203.0.113.77");
        assert.equal(Q03_MISSING_LOGS.id, "entity_resolution.q03");
        assert.equal(Q03_MISSING_LOGS.title, "MISSING LOGS");
    });

    it("mail states only the SSH username — password is cracked via hydra, never in cleartext", () => {
        assert.match(Q03_INCOMING_MAIL_CONTENT, new RegExp(`Account: ${Q03_SSH_USERNAME}`));
        assert.doesNotMatch(Q03_INCOMING_MAIL_CONTENT, new RegExp(Q03_SSH_PASSWORD));
    });

    it("defines six mandatory objective ids plus the optional backup check", () => {
        assert.deepEqual(Q03_OBJECTIVE_IDS, {
            accessHost: "q03.objective.01",
            checkLogs: "q03.objective.02",
            checkTimestamp: "q03.objective.03",
            reviewBootHistory: "q03.objective.04",
            checkGatewayLogs: "q03.objective.05",
            checkBackup: "q03.objective.05b",
            reportFindings: "q03.objective.06",
        });
    });

    it("does not gate the mandatory report objective on the optional backup check (avoids a Q02-optional-bonus soft-lock)", () => {
        const reportObjective = Q03_OBJECTIVES.find(
            (objective) => objective.name === Q03_OBJECTIVE_IDS.reportFindings,
        );
        assert.ok(reportObjective, "expected to find the reportFindings objective");
        assert.deepEqual(
            (reportObjective as { unlocksAfter?: string[] }).unlocksAfter,
            [Q03_OBJECTIVE_IDS.checkGatewayLogs],
        );
    });

    it("provides a QA-shortcut replay objective list without unlocksAfter gating (available starting Q03)", () => {
        for (const objective of Q03_REPLAY_OBJECTIVES) {
            assert.equal("unlocksAfter" in objective, false);
        }
        assert.equal(Q03_REPLAY_OBJECTIVES.length, Q03_OBJECTIVES.length);
    });

    it("preserves the recovered Phase 8 reward allocation (100 XP max, $300)", () => {
        assert.deepEqual(Q03_REWARDS, {
            investigateServerHistory: 20,
            checkFileTimestamp: 10,
            reviewBootHistory: 10,
            identifyLogGaps: 20,
            correlateMissingRecords: 20,
            checkBackupArchive: 10,
            identifyCriPolicy: 10,
            money: 300,
        });
        assert.equal(
            Q03_REWARDS.investigateServerHistory +
                Q03_REWARDS.checkFileTimestamp +
                Q03_REWARDS.reviewBootHistory +
                Q03_REWARDS.identifyLogGaps +
                Q03_REWARDS.correlateMissingRecords,
            80,
        );
        assert.equal(
            Q03_REWARDS.investigateServerHistory +
                Q03_REWARDS.checkFileTimestamp +
                Q03_REWARDS.reviewBootHistory +
                Q03_REWARDS.identifyLogGaps +
                Q03_REWARDS.correlateMissingRecords +
                Q03_REWARDS.checkBackupArchive +
                Q03_REWARDS.identifyCriPolicy,
            100,
        );
    });

    it("reproduces the source's exact locked report body, with the report template sharing the same discovered facts", () => {
        assert.equal(Q03_REPORT_SUBJECT, "Server History Report — Skynet Logistics");
        assert.match(Q03_REPORT_BODY, /do not cover the full operational/);
        assert.match(Q03_REPORT_BODY, /do not restore the missing period/);
        assert.equal(Q03_LAST_ACTIVITY_DATE, "Sep 08");
        assert.equal(Q03_LOGS_START_DATE, "Sep 03");
        assert.equal(Q03_MISSING_ROTATIONS, "5, 6");
    });

    it("never tells the player the logs were deleted — only that they are incomplete/missing (hard narrative constraint)", () => {
        for (const text of [Q03_INCOMING_MAIL_CONTENT, Q03_REPORT_BODY, Q03_HOLD_MAIL_BASE_CONTENT]) {
            assert.doesNotMatch(text, /delet|removed|erased|wiped/i);
        }
        assert.doesNotMatch(q03ContentSource, /"[^"]*\b(delet|removed|erased|wiped)\w*[^"]*"/i);
    });

    it("splices the backup-specific line into the hold mail conditionally, keeping the unconditional wording identical either way", () => {
        assert.match(Q03_HOLD_MAIL_BASE_CONTENT, /Don't include the backup finding in the client report yet\./);
        assert.match(Q03_HOLD_MAIL_BACKUP_SEGMENT, /backup is restricted/);
        assert.doesNotMatch(Q03_HOLD_MAIL_BASE_CONTENT, /backup is restricted/);
    });

    it("keeps port 80 absent from Q03_NETWORK_PORTS (defaults CLOSE), consistent with the mandatory protocol-gating rule on the shared Q02EdgeWebsite host", () => {
        assert.doesNotMatch(q03ContentSource, /\{ external: 80,/);
    });

    it("omits gateway.log.5.gz and gateway.log.6.gz from the fixture tree — the gap is the omission itself", () => {
        const gatewayFolder = JSON.stringify(Q03_ROOT_FILES);
        assert.doesNotMatch(gatewayFolder, /gateway\.log\.5/);
        assert.doesNotMatch(gatewayFolder, /gateway\.log\.6/);
        assert.match(gatewayFolder, /gateway\.log\.2/);
        assert.match(gatewayFolder, /gateway\.log\.7/);
    });

    it("hides the CRI-07 policy clue in backup metadata without ever explaining it", () => {
        const gatewayFolder = JSON.stringify(Q03_ROOT_FILES);
        assert.match(gatewayFolder, /policy_id: CRI-07/);
        assert.doesNotMatch(q03ContentSource, /CRI-07 (means|refers to|is the)/i);
    });

    it("uses the canonical completion flag as its runtime completion boundary", () => {
        const stateStore = new StateStore(createDefaultRuntimeState());
        const flagStore = new FlagStore(stateStore);
        const service = new QuestService(
            new DomainStateAccess(stateStore),
            new ConditionEvaluator(flagStore),
        );

        assert.equal(service.areObjectivesComplete(Q03_MISSING_LOGS), false);
        flagStore.set(Q03_FINAL_STATE_FLAG, true);
        assert.equal(service.areObjectivesComplete(Q03_MISSING_LOGS), true);
    });

    describe("custom commands — filestat / bootlog / zgrep", () => {
        for (const [name, source] of [
            ["filestat", filestatSource],
            ["bootlog", bootlogSource],
            ["zgrep", zgrepSource],
        ] as const) {
            it(`${name} is registered with scope: "remote"`, () => {
                assert.match(source, /scope: "remote"/);
            });
        }

        it("filestat and zgrep resolve every path through Files.resolvePath before Files.getByPath/getChildren — relative-path-against-cwd resolution is not automatic (confirmed live 2026-09-15)", () => {
            for (const source of [filestatSource, zgrepSource]) {
                assert.match(source, /await Files\.resolvePath\(/);

                const resolveIndex = source.indexOf("Files.resolvePath(");
                const getByPathIndex = source.indexOf("Files.getByPath(");
                assert.ok(resolveIndex >= 0 && getByPathIndex >= 0);
                assert.ok(resolveIndex < getByPathIndex, `${source === filestatSource ? "filestat" : "zgrep"}: resolvePath must run before getByPath`);
            }
        });

        it("does not register the source's literal stat/journalctl names — those collide with tools HackHub likely reserves natively; zgrep was confirmed live not to collide (native grep/zgrep cannot decompress .gz content at all)", () => {
            assert.doesNotMatch(filestatSource, /CommandName = "stat"/);
            assert.doesNotMatch(bootlogSource, /CommandName = "journalctl"/);
            assert.match(filestatSource, /CommandName = "filestat"/);
            assert.match(bootlogSource, /CommandName = "bootlog"/);
            assert.match(zgrepSource, /CommandName = "zgrep"/);
        });
    });

    it("declares the 'filesystem' permission required by any Files.* call from a custom command", () => {
        const manifest = JSON.parse(manifestSource) as { permissions: string[] };
        assert.ok(manifest.permissions.includes("filesystem"));
    });
});
