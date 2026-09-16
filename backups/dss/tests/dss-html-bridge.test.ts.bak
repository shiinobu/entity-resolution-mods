import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appHtml = readFileSync(
    resolve(
        fileURLToPath(
            new URL("../src/entity-resolution.html", import.meta.url),
        ),
    ),
    "utf8",
);

const productionEntrySource = readFileSync(
    resolve(
        fileURLToPath(
            new URL("../src/index.ts", import.meta.url),
        ),
    ),
    "utf8",
);

const replayEntrySource = readFileSync(
    resolve(
        fileURLToPath(
            new URL("../dev/q01-replay-entry.ts", import.meta.url),
        ),
    ),
    "utf8",
);

describe("DSS desktop HTML bridge", () => {
    it("keeps a static tool navigator even when exported catalogs are unavailable", () => {
        assert.match(appHtml, /fallbackTools=\[/);
        assert.match(appHtml, /fallbackCommands=\[/);
        assert.match(appHtml, /typeof value==='function'\?/);
        assert.doesNotMatch(appHtml, /window\.getToolCatalog/);
        assert.doesNotMatch(appHtml, /window\.startRecon/);
        assert.doesNotMatch(appHtml, /window\.executeCommand/);
    });

    it("uses the documented HackhubSDK global for DSS events and commands", () => {
        assert.match(appHtml, /globalThis\.HackhubSDK/);
        assert.match(appHtml, /\.Events\.on\(/);
        assert.match(appHtml, /\.Events\.emit\('DSS\.Command\.Request'/);
        assert.match(appHtml, /\.Events\.on\('DSS\.Command\.Result'/);
        assert.doesNotMatch(appHtml, /window\.HackhubSDK/);
    });

    it("initializes the Q01 recon profile before desktop interaction", () => {
        assert.match(productionEntrySource, /opsRuntime\.recon\.registerProfile\(Q01_RECON_PROFILE\);/);
        assert.match(replayEntrySource, /opsRuntime\.recon\.registerProfile\(Q01_RECON_PROFILE\);/);
    });

    it("keeps the terminal workspace inside the native DSS window without an outer scrollbar", () => {
        assert.match(appHtml, /\.content\{[^}]*flex:1;min-height:0;overflow:hidden/);
        assert.match(appHtml, /#view-terminal\.active\{display:flex;flex-direction:column/);
        assert.match(appHtml, /\.termgrid\{[^}]*flex:1;min-height:0/);
        assert.match(appHtml, /\.terminal\{[^}]*min-height:0;height:100%/);
        assert.match(appHtml, /\.output\{[^}]*min-height:0;overflow:hidden/);
        assert.doesNotMatch(appHtml, /overflow:(?:auto|scroll)/);
        assert.doesNotMatch(appHtml, /scrollTop/);
    });
});
