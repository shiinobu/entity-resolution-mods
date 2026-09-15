// Fixture data for Q12's POL-1847 policy history. Facts (policy id, legacy
// vs current field values, deployment date) sourced from
// docs/phase13-q04-q16-design-recovered.md. Filenames are this project's own
// naming choice (source describes content, not literal file paths).

import type { NetworkFileMap } from "@hotbunny/hackhub-content-sdk";

export const Q12_POLICY_LEGACY_CONTENT = [
    "policy: POL-1847 (legacy)",
    "relationship_review_mode: REQUIRED",
    "approved_source_bypass: DISABLED",
].join("\n");

export const Q12_POLICY_CURRENT_CONTENT = [
    "policy: POL-1847 (current)",
    "relationship_review_mode: CONDITIONAL",
    "approved_source_bypass: ENABLED",
    "deployed: 2026-07-14",
].join("\n");

export const Q12_COM07_BEHAVIOR_CONTENT = [
    "policy: POL-1847",
    "source: COM-07",
    "review_requirement: NOT_REQUIRED",
].join("\n");

// Sourced fact: approver identity is redacted in the change history.
export const Q12_CHANGE_HISTORY_CONTENT = [
    "policy: POL-1847",
    "change_log:",
    "  2026-07-14  deployed  approved_by: [REDACTED]",
].join("\n");

export const Q12_ROOT_FILES: NetworkFileMap[] = [
    {
        name: "policy",
        isFolder: true,
        children: [
            { name: "POL-1847_legacy", extension: "txt", data: Q12_POLICY_LEGACY_CONTENT },
            { name: "POL-1847_current", extension: "txt", data: Q12_POLICY_CURRENT_CONTENT },
            { name: "POL-1847_com07", extension: "txt", data: Q12_COM07_BEHAVIOR_CONTENT },
            { name: "POL-1847_history", extension: "txt", data: Q12_CHANGE_HISTORY_CONTENT },
        ],
    },
];
