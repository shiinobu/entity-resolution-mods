import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

describe("DSS direct desktop controls", () => {
    it("binds native button clicks independently of form submission", () => {
        assert.match(appSource, /DSS_DIRECT_INTERACTION_PATCH/);
        assert.match(appSource, /reconButton\.type\s*=\s*'button'/);
        assert.match(appSource, /commandButton\.type\s*=\s*'button'/);
        assert.match(appSource, /reconButton\.addEventListener\('click'/);
        assert.match(appSource, /commandButton\.addEventListener\('click'/);
        assert.match(appSource, /sdk\.Events\.emit\('DSS\.Command\.Request'/);
    });
});
