import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runtimeSource = readFileSync(
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

describe("DSS command bridge lifecycle", () => {
    it("registers the cross-surface request listener in reusable runtime code", () => {
        assert.match(runtimeSource, /export const executeDssCommand/);
        assert.match(runtimeSource, /export const registerDssCommandBridge/);
        assert.match(runtimeSource, /Events\.on\(\s*DSS_COMMAND_EVENTS\.request/);
        assert.match(runtimeSource, /void executeDssCommand\(commandLine\)/);
    });

    it("registers the command bridge from both mod lifecycle entrypoints", () => {
        assert.match(productionEntrySource, /registerDssCommandBridge\(\);/);
        assert.match(replayEntrySource, /registerDssCommandBridge\(\);/);
        assert.match(
            productionEntrySource,
            /override OnModPackageLoaded\(\)\s*\{\s*registerDssCommandBridge\(\);/,
        );
        assert.match(
            replayEntrySource,
            /override OnModPackageLoaded\(\)\s*\{\s*registerDssCommandBridge\(\);/,
        );
    });
});
