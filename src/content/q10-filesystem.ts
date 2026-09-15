// Fixture data for Q10's pipeline archive. All facts below (the filename,
// the JSON record, all 5 pipeline stage records) are sourced directly from
// the design source document's "Objective 01 — GET THE PIPELINE RECORD" /
// "Objective 02 — TRACE THE TRANSFORMATION" sections — not invented.

import type { NetworkFileMap } from "@hotbunny/hackhub-content-sdk";

// Sourced verbatim (already-resolved identities is the point — this is what
// tips the player off that it's NOT raw source data, per Daniel's line
// "That's not raw source data.").
export const Q10_PIPELINE_EVENT_CONTENT = [
    "{",
    '  "source": "COM-07",',
    '  "event_id": "COM-07-88421",',
    '  "timestamp": "2026-07-03T14:21:08",',
    '  "subject_a": "RIZKY PRATAMA",',
    '  "subject_b": "SUBJECT-88172",',
    '  "match_confidence": 0.67',
    "}",
].join("\n");

export const Q10_STAGE_1_INGESTION_CONTENT = [
    "stage: 1 — ingestion",
    "source_event_id = COM-07-88421",
    'source_subject = "Rizky Pratama"',
    'target = "unresolved"',
].join("\n");

export const Q10_STAGE_2_NORMALIZATION_CONTENT = [
    "stage: 2 — normalization",
    "source_event_id = COM-07-88421",
    'source_subject = "Rizky Pratama"',
    'target = "unresolved"',
].join("\n");

export const Q10_STAGE_3_ENTITY_RESOLUTION_CONTENT = [
    "stage: 3 — entity resolution",
    "source_event_id = COM-07-88421",
    "",
    "entity_a = PERSON-19382",
    "entity_b = SUBJECT-88172",
    "",
    "match_confidence = 0.67",
].join("\n");

export const Q10_STAGE_4_RELATIONSHIP_CONTENT = [
    "stage: 4 — relationship",
    "relationship_type = COMMUNICATION",
    "entity_a = PERSON-19382",
    "entity_b = SUBJECT-88172",
].join("\n");

export const Q10_ROOT_FILES: NetworkFileMap[] = [
    {
        name: "archive",
        isFolder: true,
        children: [
            { name: "pipeline_event_88421", extension: "json", data: Q10_PIPELINE_EVENT_CONTENT },
            {
                name: "stages",
                isFolder: true,
                children: [
                    { name: "stage1_ingestion", extension: "txt", data: Q10_STAGE_1_INGESTION_CONTENT },
                    { name: "stage2_normalization", extension: "txt", data: Q10_STAGE_2_NORMALIZATION_CONTENT },
                    { name: "stage3_entity_resolution", extension: "txt", data: Q10_STAGE_3_ENTITY_RESOLUTION_CONTENT },
                    { name: "stage4_relationship", extension: "txt", data: Q10_STAGE_4_RELATIONSHIP_CONTENT },
                ],
            },
        ],
    },
];
