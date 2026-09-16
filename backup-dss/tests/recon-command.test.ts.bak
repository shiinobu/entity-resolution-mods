import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const reconCommandSource = readFileSync(
    resolve(
        fileURLToPath(
            new URL("../src/infrastructure/hackhub/commands/recon.ts", import.meta.url),
        ),
    ),
    "utf8",
);

describe("DSS recon command", () => {
    it("registers the original recon command instead of a third-party tool name", () => {
        assert.match(reconCommandSource, /@RegisterCommand\(\{\s*default:\s*true\s*\}\)/);
        assert.match(reconCommandSource, /CommandName\s*=\s*"recon"/);
        assert.doesNotMatch(reconCommandSource, /CommandName\s*=\s*"subfinders"/);
        assert.doesNotMatch(reconCommandSource, /projectdiscovery\.io/);
    });

    it("delegates reconnaissance behavior to the shared Ops runtime", () => {
        assert.match(reconCommandSource, /opsRuntime\.runRecon/);
        assert.match(reconCommandSource, /formatReconProgressBar/);
        assert.match(reconCommandSource, /normalizeReconTarget/);
    });

    it("parses -d and --domain target forms in the command adapter", () => {
        assert.match(
            reconCommandSource,
            /arg === "-d" \|\| arg === "--domain"/,
        );
        assert.match(
            reconCommandSource,
            /return args\[domainFlagIndex \+ 1\] \?\? null/,
        );
    });

    it("does not clear or emit ANSI terminal control sequences", () => {
        assert.doesNotMatch(reconCommandSource, /tools\.clear\(\)/);
        assert.doesNotMatch(reconCommandSource, /\\u001B\[/);
        assert.doesNotMatch(reconCommandSource, /ANSI_CURSOR/);
    });

    it("renders DSS-native branding and delegates timing to the shared service", () => {
        assert.match(reconCommandSource, /DSS \/\/ Data Surveillance System/);
        assert.match(reconCommandSource, /RECONNAISSANCE MODULE/);
        assert.match(reconCommandSource, /sleep: \(ms\) => tools\.sleep\(ms\)/);
    });
});