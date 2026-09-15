// Fixture data for Q06's classification database. Facts (Rizky's record,
// model version, schema names) are sourced from
// docs/phase13-q04-q16-design-recovered.md; the manifest FILE this is
// wrapped in (`classification_snapshot.db`, discoverable via `ls`/`cat` the
// same way Q03's backup archives were) is this project's own naming choice —
// the source never gives a literal filename, only the schema/content facts.
// A future sqlmap fixture registration (`Shell.addCommandData("sqlmap",
// ...)`) should read the row-level constants below directly, not the
// manifest string.

import type { NetworkFileMap } from "@hotbunny/hackhub-content-sdk";

// Sourced: schema table names from the design doc.
export const Q06_DB_MANIFEST_CONTENT = [
    "classification_snapshot.db",
    "",
    "tables:",
    "  subjects",
    "  classifications",
    "  events",
    "  organizations",
    "  system_metadata",
    "  model_versions",
    "  data_sources",
    "",
    "owner: cri-ops",
    "snapshot_taken: 2026-08-19",
].join("\n");

// Sourced: Rizky's classification record facts.
export const Q06_RIZKY_CLASSIFICATION_CONTENT = [
    "table: classifications",
    "subject: RIZKY PRATAMA",
    "risk_level: HIGH",
    "risk_score: 74",
    "confidence: 0.58",
    "status: PENDING",
    "review_type: AUTOMATED",
    "reason: association threshold exceeded",
].join("\n");

// Sourced: score history trend (LOW -> MEDIUM -> HIGH); exact intermediate
// dates/scores are not given in the source — structural filler only for the
// two intermediate rows, the LOW->MEDIUM->HIGH progression itself is sourced.
export const Q06_RIZKY_SCORE_HISTORY_CONTENT = [
    "table: events (score history for RIZKY PRATAMA)",
    "2026-05-02  LOW     score=22",
    "2026-06-14  MEDIUM  score=48", // TODO: exact date/score invented, trend direction (LOW->MEDIUM) is sourced
    "2026-08-19  HIGH    score=74",
].join("\n");

// Sourced: model version + update date.
export const Q06_MODEL_VERSION_CONTENT = [
    "table: model_versions",
    "model: CRI-Core",
    "version: v3.7",
    "updated: 2026-07-14",
].join("\n");

export const Q06_ROOT_FILES: NetworkFileMap[] = [
    {
        name: "var",
        isFolder: true,
        children: [
            {
                name: "db",
                isFolder: true,
                children: [
                    { name: "classification_snapshot", extension: "db.txt", data: Q06_DB_MANIFEST_CONTENT },
                ],
            },
        ],
    },
];

// Flat lookups for a future sqlmap fixture (Shell.addCommandData("sqlmap", ...))
// — table dumps aren't filesystem content, kept separate from Q06_ROOT_FILES.
export const Q06_SQLMAP_TABLES = {
    classifications: Q06_RIZKY_CLASSIFICATION_CONTENT,
    events: Q06_RIZKY_SCORE_HISTORY_CONTENT,
    model_versions: Q06_MODEL_VERSION_CONTENT,
} as const;
