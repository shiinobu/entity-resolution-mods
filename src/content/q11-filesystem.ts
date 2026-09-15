// Fixture data for Q11's historical architecture files. Daniel's change
// record (author, component, change, date) is sourced verbatim from the
// design source document. NOTE for a future pass: the source gives Daniel's
// full name here as "Daniel Ward" — src/content/characters.ts currently has
// only "Daniel" with surname marked unconfirmed; that should be corrected
// when Q07/Q11 are actually implemented (out of scope for this filesystem-only pass).

import type { NetworkFileMap } from "@hotbunny/hackhub-content-sdk";

// Sourced verbatim.
export const Q11_DANIELS_CHANGE_CONTENT = [
    "author: Daniel Ward",
    "component: resolver-service",
    "change: support normalized relationship events",
    "for downstream relationship processing.",
    "date: 2026-01-18",
].join("\n");

// Structural — the source describes the historical (pre-change) vs current
// review-behavior comparison in prose ("review was not removed — it became
// conditional"), not as a literal config file; this file's exact field names
// are this project's own naming choice, the REQUIRED/CONDITIONAL facts are sourced.
export const Q11_LEGACY_ARCHITECTURE_CONTENT = [
    "resolver-service — legacy architecture",
    "human_review: REQUIRED",
    "review_exception: none",
].join("\n");

export const Q11_CURRENT_ARCHITECTURE_CONTENT = [
    "resolver-service — current architecture",
    "human_review: CONDITIONAL",
    "review_exception: approved_source_bypass",
].join("\n");

export const Q11_ROOT_FILES: NetworkFileMap[] = [
    {
        name: "archive",
        isFolder: true,
        children: [
            { name: "resolver_legacy", extension: "txt", data: Q11_LEGACY_ARCHITECTURE_CONTENT },
            { name: "resolver_current", extension: "txt", data: Q11_CURRENT_ARCHITECTURE_CONTENT },
            { name: "change_3g7kpd", extension: "txt", data: Q11_DANIELS_CHANGE_CONTENT },
        ],
    },
];
