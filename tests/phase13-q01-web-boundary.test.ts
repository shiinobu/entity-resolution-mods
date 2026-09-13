import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
    Q01_WEB_AUDIT_PATH,
    Q01_WEB_AUDIT_URL,
    Q01_WEB_FORBIDDEN_PATHS,
    Q01_WEB_HOME_HOST,
    Q01_WEB_HOME_URL,
    Q01_WEB_PATHS,
} from "../src/content/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const websiteDir = resolve(
    __dirname,
    "../src/infrastructure/hackhub/websites",
);

const homePage = readFileSync(resolve(websiteDir, "q01-home.html"), "utf8");
const forbiddenPage = readFileSync(
    resolve(websiteDir, "q01-forbidden.html"),
    "utf8",
);
const securityPage = readFileSync(
    resolve(websiteDir, "q01-security.html"),
    "utf8",
);
const websiteRegistration = readFileSync(
    resolve(websiteDir, "q01-skynet-portal.ts"),
    "utf8",
);

describe("Phase 13 Q01 — web path boundary (experimental path-based redesign, not yet locked)", () => {
    it("defines exactly four pages under one public host", () => {
        assert.equal(Q01_WEB_PATHS.length, 4);
        assert.deepEqual(Q01_WEB_PATHS, ["/", "/portal", "/status", "/security"]);
        assert.deepEqual(Q01_WEB_FORBIDDEN_PATHS, ["/portal", "/status"]);
    });

    it("keeps www as the single public host and /security as the audit target", () => {
        assert.equal(Q01_WEB_HOME_HOST, "www.skynet-logistics.idx");
        assert.equal(Q01_WEB_HOME_URL, "https://www.skynet-logistics.idx/");
        assert.equal(Q01_WEB_AUDIT_PATH, "/security");
        assert.equal(
            Q01_WEB_AUDIT_URL,
            "https://www.skynet-logistics.idx/security",
        );
    });

    it("registers all four pages under a single website host", () => {
        assert.equal(
            (websiteRegistration.match(/@RegisterWebsite/g) ?? []).length,
            1,
        );
        assert.match(websiteRegistration, /Host = Q01_WEB_HOME_HOST/);
        assert.match(websiteRegistration, /Q01_WEB_FORBIDDEN_PATHS\[0\]/);
        assert.match(websiteRegistration, /Q01_WEB_FORBIDDEN_PATHS\[1\]/);
        assert.match(websiteRegistration, /Q01_WEB_AUDIT_PATH/);
        assert.equal(
            (websiteRegistration.match(/\n\s+page\(/g) ?? []).length,
            4,
        );
        assert.match(websiteRegistration, /const page = \(/);
        assert.match(websiteRegistration, /page\(\s*\n\s*"\/",/);
    });

    it("keeps only the /security page as the real audit page", () => {
        assert.match(securityPage, /SECURITY REVIEW/);
        assert.match(securityPage, /Skynet Logistics/);
        assert.match(websiteRegistration, /Q01_WEB_AUDIT_PATH/);
        assert.match(websiteRegistration, /securityPage/);
    });

    it("serves 403 forbidden content on the other paths", () => {
        assert.match(forbiddenPage, /403/);
        assert.match(forbiddenPage, /FORBIDDEN/);
        assert.doesNotMatch(forbiddenPage, /SECURITY REVIEW/);
        assert.match(websiteRegistration, /Q01_WEB_FORBIDDEN_PATHS\[0\]/);
        assert.match(websiteRegistration, /Q01_WEB_FORBIDDEN_PATHS\[1\]/);
        assert.match(websiteRegistration, /forbiddenPage/);
    });

    it("does not expose a direct security link from the home page", () => {
        assert.doesNotMatch(homePage, /security\.skynet-logistics\.idx/);
        assert.doesNotMatch(homePage, /href=["']\/security["']/);
        assert.match(homePage, /Skynet Logistics/);
    });
});
