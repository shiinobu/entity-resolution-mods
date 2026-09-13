import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
    Q02_ADRIAN_EMAIL,
    Q02_CLIENT_NAME,
    Q02_FINAL_STATE_FLAG,
    Q02_HIDDEN_HOSTNAME,
    Q02_HIDDEN_HOSTNAME_IP,
    Q02_OBJECTIVE_IDS,
    Q02_REPORT_BODY,
    Q02_REPORT_SUBJECT,
    Q02_REWARDS,
    Q02_TARGET_IP,
    Q02_THE_ANOMALY,
    Q02_WEB_HOST,
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
            new URL("../src/infrastructure/hackhub/q02-quest.ts", import.meta.url),
        ),
    ),
    "utf8",
);

const productionEntrySource = readFileSync(
    resolve(fileURLToPath(new URL("../src/index.ts", import.meta.url))),
    "utf8",
);

describe("Phase 13 Q02 — THE ANOMALY (recovered source, live validation pending)", () => {
    it("matches the recovered quest identity and target", () => {
        assert.equal(Q02_THE_ANOMALY.id, "entity_resolution.q02");
        assert.equal(Q02_THE_ANOMALY.title, "THE ANOMALY");
        assert.equal(Q02_CLIENT_NAME, "Skynet Logistics");
        assert.equal(Q02_WEB_HOST, "edge-03.skynet-logistics.idx");
        assert.equal(Q02_ADRIAN_EMAIL, "adrian.cole@entityresolution.lock");
        assert.equal(Q02_TARGET_IP, "203.0.113.77");
    });

    it("defines the hidden certificate-SAN clue toward CRI", () => {
        assert.equal(Q02_HIDDEN_HOSTNAME, "cri-gateway.internal");
        assert.equal(Q02_HIDDEN_HOSTNAME_IP, "10.42.7.18");
    });

    it("defines five player objective ids", () => {
        assert.deepEqual(Q02_OBJECTIVE_IDS, {
            checkTarget: "q02.objective.01",
            scanHost: "q02.objective.02",
            identifyService: "q02.objective.03",
            inspectCertificate: "q02.objective.04",
            reportAnomaly: "q02.objective.05",
        });
    });

    it("preserves the recovered Phase 8 reward allocation (90 XP max, $250)", () => {
        assert.deepEqual(Q02_REWARDS, {
            investigateTarget: 20,
            serviceEnumeration: 15,
            certificateInspection: 15,
            reportAnomaly: 20,
            identifyCriHostname: 10,
            checkDns: 10,
            money: 250,
        });
        assert.equal(
            Q02_REWARDS.investigateTarget +
                Q02_REWARDS.serviceEnumeration +
                Q02_REWARDS.certificateInspection +
                Q02_REWARDS.reportAnomaly +
                Q02_REWARDS.identifyCriHostname,
            80,
        );
        assert.equal(
            Q02_REWARDS.investigateTarget +
                Q02_REWARDS.serviceEnumeration +
                Q02_REWARDS.certificateInspection +
                Q02_REWARDS.reportAnomaly +
                Q02_REWARDS.identifyCriHostname +
                Q02_REWARDS.checkDns,
            90,
        );
    });

    it("defines the resolved report body used to validate Objective 05", () => {
        assert.equal(Q02_REPORT_SUBJECT, "Anomaly Report — edge-03");
        assert.match(Q02_REPORT_BODY, /gateway\.internal/);
        assert.match(Q02_REPORT_BODY, /ARKA Secure Infrastructure/);
    });

    it("uses the canonical completion flag as its runtime completion boundary", () => {
        const stateStore = new StateStore(createDefaultRuntimeState());
        const flagStore = new FlagStore(stateStore);
        const service = new QuestService(
            new DomainStateAccess(stateStore),
            new ConditionEvaluator(flagStore),
        );

        assert.equal(service.areObjectivesComplete(Q02_THE_ANOMALY), false);
        flagStore.set(Q02_FINAL_STATE_FLAG, true);
        assert.equal(service.areObjectivesComplete(Q02_THE_ANOMALY), true);
    });

    it("requires Q01 completion before Q02 becomes available", () => {
        assert.match(
            questSource,
            /QuestsToComplete = \["entity_resolution\.q01"\]/,
        );
    });

    it("gates Objective 01 on reading Adrian's mail, not an OnStart auto-complete", () => {
        assert.match(questSource, /"Mail\.Read"/);
        assert.match(questSource, /handleMailRead/);

        const onStartMatch = questSource.match(
            /override OnStart\(\) \{[\s\S]*?\n {4}\}/,
        );
        assert.ok(onStartMatch, "expected to find OnStart() body");
        assert.doesNotMatch(
            onStartMatch![0],
            /completeObjective\(Q02_OBJECTIVE_IDS\.checkTarget\)/,
        );
    });

    it("gates Objective 03 on nmap's -sV service-version flag, not a separate command", () => {
        assert.match(questSource, /data\.args\.includes\("-sV"\)/);
    });

    it("gates Objective 04 on visiting the certificate page over HTTPS on port 8443", () => {
        assert.match(questSource, /data\.port !== "8443"/);
        assert.match(questSource, /data\.hostname !== Q02_WEB_HOST/);
    });

    it("deposits the money reward into the player's real bank account via the native Bank API", () => {
        assert.match(
            questSource,
            /import \{[\s\S]*?\bBank\b[\s\S]*?\} from "@hotbunny\/hackhub-content-sdk";/,
        );
        assert.match(
            questSource,
            /const moneyGranted = gameRuntime\.economy\.applyMissionReward\(/,
        );
        assert.match(questSource, /if \(moneyGranted\) \{\s*Bank\.transaction\(\{/);
    });

    it("is registered in the production bootstrap", () => {
        assert.match(
            productionEntrySource,
            /import "\.\/infrastructure\/hackhub\/q02-quest\.js";/,
        );
        assert.match(
            productionEntrySource,
            /import "\.\/infrastructure\/hackhub\/websites\/q02-gateway-portal\.js";/,
        );
    });
});
