// Fixture data for Q15's encrypted forensic export — REBUILT verbatim from
// `DEAD_SIGNAL_Q15_THE_EVIDENCE_LOCKED_v1.0.docx` (the authoritative
// locked source, see content/q15.ts's header comment). Supersedes the
// previous version's "structural filler" timeline — the LOCKED source
// gives exact, real timestamps for the A-77402 action log (contrary to
// the earlier Phase-8-derived note that assumed only the AR-44192 window
// was known). Path (`/exports/operations/`) and every table field below
// are sourced directly; only the individual file NAMES splitting the
// decrypted archive's tables across files are this project's own
// structural choice.

import type { NetworkFileMap } from "@hotbunny/hackhub-content-sdk";

// Objective 01 — RETRIEVE THE PRIMARY AUDIT EXPORT (pre-decryption
// metadata; the file itself needs an `openssl`-style decrypt step before
// the folder tree below becomes readable).
export const Q15_FORENSIC_EXPORT_MANIFEST_CONTENT = [
    "EXPORT TYPE: Forensic",
    "IDENTITY DATA: Sanitized",
    "SESSION DATA: Included",
    "ACTION DATA: Included",
    "PERSONNEL DATA: Excluded",
].join("\n");

// Objective 02 — RECONSTRUCT SESSION A-77402 (metadata record).
export const Q15_SESSION_A77402_CONTENT = [
    "SESSION",
    "ID: A-77402",
    "IDENTITY: OVERRIDE_OPERATOR",
    "AUTHORIZATION: AR-44192",
    "START: 2026-08-18 02:12:19",
    "END: 2026-08-18 02:19:06",
    "ORIGIN: 10.42.7.31",
    "AUTHENTICATION: INTERNAL",
    "CLIENT: ops-console-04",
    "AUTH CONTEXT: delegated-privileged",
    "USER REFERENCE: USR-REDACTED-17",
    "SESSION TOKEN: ST-884192",
].join("\n");

// Objective 03 — TRACE THE USER REFERENCE.
export const Q15_USER_REFERENCE_CONTENT = [
    "USER REFERENCE: USR-REDACTED-17",
    "IDENTITY SOURCE: Primary Identity Service",
    "EXPORT STATUS: Sanitized",
    "",
    "IDENTITY HASH: 7f91c8...",
    "(same hash is associated with AR-44192)",
].join("\n");

// Objective 04 — RECONSTRUCT THE SESSION. Real sourced timestamps — NOT
// structural filler (corrects the previous version of this file, which
// assumed the LOCKED source never gave literal minutes; it does).
export const Q15_SESSION_TIMELINE = [
    { time: "02:12:19", action: "LOGIN" },
    { time: "02:12:43", action: "OPEN relationship-policy" },
    { time: "02:13:17", action: "VIEW policy version" },
    { time: "02:14:33", action: "CONFIGURATION_OVERRIDE" },
    { time: "02:15:02", action: "SAVE" },
    { time: "02:15:18", action: "VALIDATE" },
    { time: "02:15:49", action: "RELOAD" },
    { time: "02:17:03", action: "OPEN COM-07 configuration" },
    { time: "02:18:12", action: "VIEW resolver configuration" },
    { time: "02:19:06", action: "LOGOUT" },
] as const;

export const Q15_SESSION_TIMELINE_CONTENT = Q15_SESSION_TIMELINE.map(
    ({ time, action }) => `${time} ${action}`,
).join("\n");

// Objective 05 — COMPARE POLICY VERSIONS.
export const Q15_POLICY_PREVIOUS_CONTENT = [
    "relationship_review_mode: REQUIRED",
    "approved_source_bypass: DISABLED",
    "uncertain_match: REVIEW_REQUIRED",
].join("\n");

export const Q15_POLICY_MODIFIED_CONTENT = [
    "relationship_review_mode: CONDITIONAL",
    "approved_source_bypass: ENABLED",
    "uncertain_match: AUTO_ACCEPT_IF_SOURCE_APPROVED",
].join("\n");

// Objective 06 — TRACE RIZKY THROUGH THE PIPELINE.
export const Q15_RIZKY_CHAIN = [
    "SOURCE: COM-07-88421 (subject: Rizky Pratama, counterparty: unresolved)",
    "ENTITY RESOLUTION: candidate SUBJECT-88172, match_method PROBABILISTIC, confidence 0.67, decision ACCEPT",
    "RELATIONSHIP: PERSON-19382 -> COMMUNICATION -> SUBJECT-88172, source COM-07, status ACCEPTED",
    "POLICY: source APPROVED, review NOT_REQUIRED",
    "CRI: risk_score 74, risk_level HIGH, confidence 0.58",
] as const;

export const Q15_RIZKY_CHAIN_CONTENT = Q15_RIZKY_CHAIN.join("\n");

// Optional objective — CHECK THE PREVIOUS POLICY (historical COM-07 record;
// same confidence, review requirement flipped).
export const Q15_COM07_HISTORICAL_CONTENT = [
    "COM-07 (historical)",
    "candidate: SUBJECT-88172",
    "confidence: 0.67",
    "review_required: TRUE",
    "relationship_status: PENDING",
    "",
    "COM-07 (modified)",
    "candidate: SUBJECT-88172",
    "confidence: 0.67",
    "review_required: FALSE",
    "relationship_status: ACCEPTED",
].join("\n");

// Objective 07 — CORRELATE THE OPERATOR IDENTITY.
export const Q15_OPERATOR_IDENTITY_CONTENT = [
    "IDENTITY CORRELATION",
    "REFERENCE: ARKA-OPS-0441",
    "ROLE: Operations Security",
    "STATUS: ACTIVE",
    "NAME: RESTRICTED",
    "DIRECTORY ACCESS: REQUIRED",
    "",
    "IDENTITY ACCESS REQUEST",
    "REQUEST: IR-90217",
    "REFERENCE: ARKA-OPS-0441",
    "REQUESTED BY: FORENSIC EXPORT",
    "STATUS: RESTRICTED",
    "REVIEW AUTHORITY: SECURITY ADMINISTRATION",
].join("\n");

// "14. Final Evidence Package" — the closing evidence-assembly summary,
// not tied to a single numbered objective; useful as the correlateOperatorIdentity
// objective's closing read ("assemble the evidence package").
export const Q15_FINAL_EVIDENCE_PACKAGE_CONTENT = [
    "DEAD SIGNAL — FORENSIC EVIDENCE PACKAGE",
    "CASE: CRI / RELATIONSHIP PIPELINE",
    "",
    "EVIDENCE",
    "01 — COM-07 SOURCE",
    "02 — ENTITY RESOLUTION, confidence 0.67",
    "03 — POLICY VERSION CHANGE",
    "04 — OVERRIDE_OPERATOR SESSION",
    "05 — CONFIGURATION_OVERRIDE",
    "06 — RIZKY PROCESSING CHAIN",
    "07 — ACCESS AUTHORIZATION, AR-44192",
    "08 — OPERATOR IDENTITY REFERENCE, ARKA-OPS-0441",
    "",
    "STATUS",
    "CHAIN OF EVENTS: VERIFIED",
    "IDENTITY: CORRELATED",
    "OPERATOR NAME: WITHHELD",
    "INTENT: UNDETERMINED",
    "PUBLIC DISCLOSURE: NOT AUTHORIZED",
].join("\n");

export const Q15_ROOT_FILES: NetworkFileMap[] = [
    {
        name: "exports",
        isFolder: true,
        children: [
            {
                name: "operations",
                isFolder: true,
                children: [
                    {
                        name: "operations_audit_2026-08-18",
                        extension: "enc",
                        data: Q15_FORENSIC_EXPORT_MANIFEST_CONTENT,
                    },
                    {
                        name: "operations_audit_2026-08-18",
                        isFolder: true,
                        children: [
                            {
                                name: "sessions",
                                isFolder: true,
                                children: [
                                    { name: "A-77402", extension: "txt", data: Q15_SESSION_A77402_CONTENT },
                                ],
                            },
                            {
                                name: "actions",
                                isFolder: true,
                                children: [
                                    { name: "A-77402", extension: "log", data: Q15_SESSION_TIMELINE_CONTENT },
                                ],
                            },
                            {
                                name: "identity",
                                isFolder: true,
                                children: [
                                    { name: "USR-REDACTED-17", extension: "txt", data: Q15_USER_REFERENCE_CONTENT },
                                    { name: "ARKA-OPS-0441", extension: "txt", data: Q15_OPERATOR_IDENTITY_CONTENT },
                                ],
                            },
                            {
                                name: "configuration",
                                isFolder: true,
                                children: [
                                    { name: "policy-previous", extension: "txt", data: Q15_POLICY_PREVIOUS_CONTENT },
                                    { name: "policy-modified", extension: "txt", data: Q15_POLICY_MODIFIED_CONTENT },
                                    { name: "com07-historical", extension: "txt", data: Q15_COM07_HISTORICAL_CONTENT },
                                ],
                            },
                            {
                                name: "authorizations",
                                isFolder: true,
                                children: [
                                    { name: "rizky-chain", extension: "txt", data: Q15_RIZKY_CHAIN_CONTENT },
                                    { name: "evidence-package", extension: "txt", data: Q15_FINAL_EVIDENCE_PACKAGE_CONTENT },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
];
