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

describe("DSS recon workspace scrolling", () => {
    it("allows only the Recon view to scroll vertically", () => {
        assert.match(
            appHtml,
            /#view-recon\.active\{[^}]*overflow-y:auto/,
        );
        assert.match(appHtml, /html,body\{[^}]*overflow:hidden/);
        assert.match(appHtml, /\.content\{[^}]*overflow:hidden/);
        assert.doesNotMatch(appHtml, /#view-terminal\.active\{[^}]*overflow-y:auto/);
        assert.doesNotMatch(appHtml, /#view-wireshark\.active\{[^}]*overflow-y:auto/);
    });

    it("targets the view elements by id, not by a class that never exists on them", () => {
        // Regression guard: #view-recon / #view-terminal / #view-wireshark are only
        // ever given the classes "view" and "active" at runtime (see the `show()`
        // function below). A selector like `.view-recon.active` looks plausible but
        // never matches anything, so any rule written that way is silently dead CSS.
        assert.doesNotMatch(appHtml, /\.view-recon\.active/);
        assert.doesNotMatch(appHtml, /\.view-terminal\.active/);
        assert.doesNotMatch(appHtml, /\.view-wireshark\.active/);
        assert.match(
            appHtml,
            /classList\.toggle\('active',\s*key===activeView\)/,
        );
    });
});
