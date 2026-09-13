import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
    DSS_RECON_EVENTS,
    OpsCommandRegistry,
    OpsCommandRouter,
    OpsEventBus,
    OpsRuntime,
    OpsSessionStore,
    OpsToolRegistry,
    ReconService,
} from "../src/application/ops/index.js";
import type { OpsEventMap } from "../src/application/ops/index.js";
import type { ReconResult } from "../src/domain/recon/index.js";
import {
    Q01_RECON_INPUT,
    Q01_RECON_PROFILE,
} from "../src/content/q01.js";

const appSource = readFileSync(
    resolve(
        fileURLToPath(
            new URL(
                "../src/infrastructure/hackhub/apps/entity-resolution.ts",
                import.meta.url,
            ),
        ),
    ),
    "utf8",
);

const commandRuntimeSource = readFileSync(
    resolve(
        fileURLToPath(
            new URL(
                "../src/infrastructure/hackhub/dss-command-runtime.ts",
                import.meta.url,
            ),
        ),
    ),
    "utf8",
);

const appHtml = readFileSync(
    resolve(
        fileURLToPath(
            new URL("../src/entity-resolution.html", import.meta.url),
        ),
    ),
    "utf8",
);

const commandSource = readFileSync(
    resolve(
        fileURLToPath(
            new URL(
                "../src/infrastructure/hackhub/commands/recon.ts",
                import.meta.url,
            ),
        ),
    ),
    "utf8",
);

const productionEntrySource = readFileSync(
    resolve(
        fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    ),
    "utf8",
);

const replayEntrySource = readFileSync(
    resolve(
        fileURLToPath(new URL("../dev/q01-replay-entry.ts", import.meta.url)),
    ),
    "utf8",
);

const replayQuestSource = readFileSync(
    resolve(
        fileURLToPath(new URL("../dev/q01-replay-quest.ts", import.meta.url)),
    ),
    "utf8",
);

describe("DSS operations application foundation", () => {
    it("registers DSS as the canonical desktop application", () => {
        assert.match(appSource, /@RegisterApp/);
        assert.match(appSource, /AppName\s*=\s*"dss"/);
        assert.match(appSource, /Title\s*=\s*"DSS"/);
        assert.match(appSource, /import appHTML from "\.\.\/\.\.\/\.\.\/entity-resolution\.html"/);
        assert.match(appSource, /HTML\s*=\s*dssHTML/);
        assert.match(appSource, /DefaultSize\s*=\s*\{\s*width:\s*1220,\s*height:\s*800\s*\}/);
        assert.match(appSource, /override\s+Unlocked\s*=\s*true/);
        assert.match(appSource, /override\s+Exports\s*=/);
    });

    it("exposes the DSS runtime boundary to the desktop application", () => {
        assert.match(commandRuntimeSource, /const commandRouter = new OpsCommandRouter\(opsRuntime\)/);
        assert.match(commandRuntimeSource, /export const executeDssCommand/);
        assert.match(commandRuntimeSource, /DSS_RECON_EVENTS\.started/);
        assert.match(commandRuntimeSource, /DSS_RECON_EVENTS\.sourceStarted/);
        assert.match(commandRuntimeSource, /DSS_RECON_EVENTS\.sourceCompleted/);
        assert.match(commandRuntimeSource, /DSS_RECON_EVENTS\.hostDiscovered/);
        assert.match(commandRuntimeSource, /DSS_RECON_EVENTS\.completed/);
        assert.match(commandRuntimeSource, /Events\.emit\(DSS_COMMAND_EVENTS\.result/);
        assert.match(commandRuntimeSource, /export const registerDssCommandBridge/);
        assert.match(commandRuntimeSource, /Events\.on\(\s*DSS_COMMAND_EVENTS\.request/);
        assert.match(appSource, /executeDssCommand\(commandLine/);
        assert.match(appSource, /getCommandCatalog/);
        assert.match(appSource, /startRecon:\s*\(target: string\)/);
        assert.match(appSource, /executeCommand:\s*\(commandLine: string\)/);
    });

    it("contains a single-workspace navigator for the initial DSS tools", () => {
        assert.match(appHtml, /DSS/);
        assert.match(appHtml, /DATA SURVEILLANCE SYSTEM/);
        assert.match(appHtml, /Terminal\+/);
        assert.match(appHtml, />Recon</);
        assert.match(appHtml, /Wireshark\+/);
        assert.match(appHtml, /OPERATIONS WORKSPACE/);
        assert.match(appHtml, /DSS Shell/);
        assert.match(appHtml, /Run Recon/);
    });

    it("locks the DSS workspace canvas and avoids responsive collapse", () => {
        assert.match(appHtml, /min-width:1180px/);
        assert.match(appHtml, /min-height:740px/);
        assert.match(appHtml, /grid-template-columns:250px minmax\(930px,1fr\)/);
        assert.match(appHtml, /font:700 14px\/1 ui-monospace/);
        assert.match(appHtml, /font:600 13px\/1 ui-monospace/);
        assert.doesNotMatch(appHtml, /@media\(/);
    });

    it("keeps the complete DSS document free of page and panel scrollbars", () => {
        assert.match(appHtml, /html,body\{[^}]*overflow:hidden/);
        assert.match(appHtml, /\.app\{[^}]*overflow:hidden/);
        assert.match(appHtml, /\.content\{[^}]*overflow:hidden/);
        assert.match(appHtml, /\.view\{[^}]*overflow:hidden/);
        assert.match(appHtml, /\.output\{[^}]*overflow:hidden/);
        assert.doesNotMatch(appHtml, /overflow:(?:auto|scroll)/);
        assert.doesNotMatch(appHtml, /scrollTop/);
    });

    it("is imported by both production and Q01 replay entries", () => {
        assert.match(
            productionEntrySource,
            /import "\.\/infrastructure\/hackhub\/apps\/entity-resolution\.js";/,
        );
        assert.match(
            replayEntrySource,
            /import "\.\.\/src\/infrastructure\/hackhub\/apps\/entity-resolution\.js";/,
        );
    });

    it("keeps the DSS app stable while making only the Q01 replay quest instance unique", () => {
        assert.match(appSource, /AppName\s*=\s*"dss"/);
        assert.match(appSource, /Title\s*=\s*"DSS"/);
        assert.doesNotMatch(appSource, /DEV_Q01_REPLAY_ID/);
        assert.match(
            replayQuestSource,
            /export const Q01_REPLAY_QUEST_NAME = `entity_resolution\.dev\.q01\.\$\{DEV_Q01_REPLAY_ID\}`;/,
        );
        assert.match(replayQuestSource, /override Name = Q01_REPLAY_QUEST_NAME;/);
        assert.match(replayQuestSource, /override Title = "THE CONTRACT — DEV REPLAY";/);
        assert.match(replayEntrySource, /opsRuntime\.recon\.registerProfile\(Q01_RECON_PROFILE\)/);
    });

    it("wires the Q01 replay to the native Terminal.Dirhunter event (experimental path-based redesign, not the shared recon command)", () => {
        assert.match(replayQuestSource, /"Terminal\.Dirhunter"/);
        assert.match(replayQuestSource, /handleDirhunter/);
        assert.match(replayQuestSource, /normalizeHost/);
        assert.doesNotMatch(replayQuestSource, /data\.command === "recon"/);
        assert.doesNotMatch(replayQuestSource, /data\.command === "subfinder"/);
    });

    it("defines stable DSS recon event names", () => {
        assert.equal(DSS_RECON_EVENTS.started, "DSS.Recon.Started");
        assert.equal(DSS_RECON_EVENTS.sourceStarted, "DSS.Recon.SourceStarted");
        assert.equal(DSS_RECON_EVENTS.sourceCompleted, "DSS.Recon.SourceCompleted");
        assert.equal(DSS_RECON_EVENTS.hostDiscovered, "DSS.Recon.HostDiscovered");
        assert.equal(DSS_RECON_EVENTS.completed, "DSS.Recon.Completed");
        assert.equal(DSS_RECON_EVENTS.failed, "DSS.Recon.Failed");
    });

    it("provides a canonical DSS command registry", () => {
        const registry = new OpsCommandRegistry();
        assert.deepEqual(registry.getAll(), [
            {
                name: "recon",
                description: "Run the ENTITY RESOLUTION reconnaissance module.",
                toolId: "recon",
            },
            {
                name: "wireshark",
                description: "Run an ENTITY RESOLUTION Wireshark+ packet capture.",
                toolId: "wireshark",
            },
        ]);
        assert.equal(registry.get("RECON")?.toolId, "recon");
        assert.equal(registry.get("wireshark")?.toolId, "wireshark");
        assert.equal(registry.get("unknown"), null);
    });

    it("provides a framework-agnostic typed event bus", () => {
        const bus = new OpsEventBus<OpsEventMap>();
        const received: string[] = [];

        const unsubscribe = bus.on("reconHostDiscovered", ({ host }) => {
            received.push(host);
        });

        bus.emit("reconHostDiscovered", { host: "example.test" });
        unsubscribe();
        bus.emit("reconHostDiscovered", { host: "ignored.test" });

        assert.deepEqual(received, ["example.test"]);
    });

    it("keeps the initial tool catalog centralized and extensible", () => {
        const registry = new OpsToolRegistry();
        assert.deepEqual(
            registry.getAll().map((tool) => tool.id),
            ["terminal", "recon", "wireshark"],
        );
        assert.equal(registry.get("recon")?.status, "ready");
        assert.equal(registry.get("terminal")?.status, "foundation");
        assert.equal(registry.get("wireshark")?.status, "ready");
    });

    it("keeps investigation context separate from quest state", () => {
        const session = new OpsSessionStore();
        session.startRecon("q01", "www.skynet-logistics.idx", 5);

        assert.deepEqual(session.getSnapshot(), {
            status: "running",
            target: "www.skynet-logistics.idx",
            profileId: "q01",
            totalSources: 5,
            completedSources: 0,
            candidatesFound: 0,
            uniqueHostsFound: 0,
            discoveredHosts: [],
            lastElapsedMs: null,
        });
    });

    it("centralizes recon session updates in OpsRuntime", async () => {
        const runtime = new OpsRuntime({
            recon: new ReconService({
                animation: {
                    sourceDurationMs: 0,
                    resultDelayMs: 0,
                },
            }),
        });
        runtime.recon.registerProfile(Q01_RECON_PROFILE);

        const result = await runtime.runRecon(
            Q01_RECON_INPUT.replace("-d ", ""),
            {
                onStarted: () => undefined,
                onSourceStarted: () => undefined,
                onSourceCompleted: () => undefined,
                onHostDiscovered: () => undefined,
                onCompleted: () => undefined,
                sleep: async () => undefined,
            },
        );

        assert.ok(result);
        assert.equal(runtime.session.getSnapshot().status, "completed");
        assert.equal(runtime.session.getSnapshot().completedSources, 5);
        assert.equal(runtime.session.getSnapshot().uniqueHostsFound, 4);
        assert.deepEqual(runtime.session.getSnapshot().discoveredHosts, [
            "portal.skynet-logistics.idx",
            "security.skynet-logistics.idx",
            "status.skynet-logistics.idx",
            "www.skynet-logistics.idx",
        ]);
    });

    it("routes recon through the shared command router", async () => {
        const runtime = new OpsRuntime({
            recon: new ReconService({
                animation: {
                    sourceDurationMs: 0,
                    resultDelayMs: 0,
                },
            }),
        });
        runtime.recon.registerProfile(Q01_RECON_PROFILE);
        const router = new OpsCommandRouter(runtime);

        const result = await router.execute(`recon ${Q01_RECON_INPUT}`, {
            observer: {
                onStarted: () => undefined,
                onSourceStarted: () => undefined,
                onSourceCompleted: () => undefined,
                onHostDiscovered: () => undefined,
                onCompleted: () => undefined,
                sleep: async () => undefined,
            },
        });

        assert.equal(result.ok, true);
        assert.equal(result.command, "recon");
        assert.equal((result.result as ReconResult | null)?.uniqueHostsFound, 4);
    });

    it("bridges native recon command progress into the DSS event surface", () => {
        assert.match(commandSource, /import \{\s*DSS_RECON_EVENTS,\s*\}/);
        assert.match(commandSource, /Events\.emit\(DSS_RECON_EVENTS\.started/);
        assert.match(commandSource, /Events\.emit\(DSS_RECON_EVENTS\.sourceStarted/);
        assert.match(commandSource, /Events\.emit\(DSS_RECON_EVENTS\.sourceCompleted/);
        assert.match(commandSource, /Events\.emit\(DSS_RECON_EVENTS\.hostDiscovered/);
        assert.match(commandSource, /Events\.emit\(DSS_RECON_EVENTS\.completed/);
    });

    it("bridges DSS Terminal+ nmap and lynx commands to HackHub terminal events", () => {
        assert.match(commandRuntimeSource, /Shell\.getCommandData\(command, input\)/);
        assert.match(commandRuntimeSource, /Events\.emit\("Terminal\.Command"/);
        assert.match(commandRuntimeSource, /Events\.emit\("Terminal\.NmapScan"/);
        assert.match(commandRuntimeSource, /command === "nmap"/);
        assert.match(commandRuntimeSource, /command === "lynx"/);
    });

    it("uses a lifecycle-registered DSS command bridge and exported app entrypoints", () => {
        assert.match(appSource, /override\s+Exports\s*=\s*\{[\s\S]*startRecon/);
        assert.match(appSource, /override\s+Exports\s*=\s*\{[\s\S]*executeCommand/);
        assert.match(appSource, /startRecon:\s*\(target: string\)\s*:\s*Promise<boolean>\s*=>\s*executeDssCommand/);
        assert.match(appSource, /executeCommand:\s*\(commandLine: string\)\s*:\s*Promise<boolean>\s*=>\s*executeDssCommand/);
        assert.match(commandRuntimeSource, /export const registerDssCommandBridge/);
        assert.match(commandRuntimeSource, /Events\.on\(\s*DSS_COMMAND_EVENTS\.request/);
        assert.doesNotMatch(appSource, /Events\.on\(\s*DSS_COMMAND_EVENTS\.request/);
        assert.doesNotMatch(appSource, /throw new Error\(/);
        assert.match(productionEntrySource, /registerDssCommandBridge\(\);/);
        assert.match(replayEntrySource, /registerDssCommandBridge\(\);/);
    });
});
