import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

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

describe("DSS native window sizing", () => {
    it("declares a native minimum size matching the supported DSS workspace", () => {
        assert.match(
            appSource,
            /DefaultSize\s*=\s*\{\s*width:\s*1220,\s*height:\s*800\s*\}/,
        );
        assert.match(
            appSource,
            /MinSize\s*=\s*\{\s*width:\s*1200,\s*height:\s*780\s*\}/,
        );
    });
});
