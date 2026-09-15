// Fixture data for Q14's access registry — REBUILT verbatim from
// `DEAD_SIGNAL_Q14_THE_OWNER_LOCKED_v1.0.docx` (the authoritative locked
// source, see content/q14.ts's header comment). Path
// (`/archives/security/access/`) and every table field below are sourced
// directly; only the individual file NAMES splitting the tables across
// files are this project's own structural choice (the source describes
// "Search: X / Result: [table]" results, not literal file paths per
// table).

import type { NetworkFileMap } from "@hotbunny/hackhub-content-sdk";

// Objective 01 — FIND THE ACCESS REGISTRY. Both tables ("PRIVILEGED
// IDENTITY REGISTRY" + "ACCESS DELEGATION") are returned by the same
// search in the source, so kept in one file.
export const Q14_IDENTITY_REGISTRY_CONTENT = [
    "PRIVILEGED IDENTITY REGISTRY",
    "IDENTITY: OVERRIDE_OPERATOR",
    "IDENTITY TYPE: PRIVILEGED OPERATIONAL IDENTITY",
    "ACCESS MODEL: DELEGATED",
    "OWNER: OPERATIONS",
    "APPROVAL REQUIRED: YES",
    "REVIEW FREQUENCY: QUARTERLY",
    "",
    "ACCESS DELEGATION",
    "IDENTITY: OVERRIDE_OPERATOR",
    "AUTHORIZED GROUP: OPERATIONS-SECURITY",
    "ACCESS LEVEL: PRIVILEGED",
    "APPROVAL AUTHORITY: SECURITY ADMINISTRATION",
].join("\n");

// Objective 02 — TRACE THE ACCESS WINDOW. Both sessions are returned by
// the same date-range search in the source.
export const Q14_SESSION_HISTORY_CONTENT = [
    "SESSION",
    "ID: A-77319",
    "IDENTITY: OVERRIDE_OPERATOR",
    "START: 2026-08-17 01:51:58",
    "END: 2026-08-17 02:03:41",
    "ORIGIN: 10.42.7.31",
    "AUTHENTICATION: INTERNAL",
    "",
    "SESSION",
    "ID: A-77402",
    "IDENTITY: OVERRIDE_OPERATOR",
    "START: 2026-08-18 02:12:19",
    "END: 2026-08-18 02:19:06",
    "ORIGIN: 10.42.7.31",
    "AUTHENTICATION: INTERNAL",
    "LINKED AUTHORIZATION: AR-44192",
].join("\n");

// Objective 03 — FIND THE AUTHORIZATION.
export const Q14_AR44192_CONTENT = [
    "ACCESS REQUEST",
    "REQUEST ID: AR-44192",
    "IDENTITY: OVERRIDE_OPERATOR",
    "REQUESTED ACCESS: PRIVILEGED OPERATIONS",
    "ACCESS WINDOW: 2026-08-18 01:45 — 03:00",
    "REQUESTED BY: OPERATIONS",
    "APPROVER: M.REED",
    "STATUS: APPROVED",
    "APPROVED: 2026-08-18 01:39:12",
    "LINKED SESSION: A-77402",
].join("\n");

// Objective 04 — RESOLVE THE APPROVER.
export const Q14_APPROVER_IDENTITY_CONTENT = [
    "EMPLOYEE REFERENCE: ARKA-SEC-017",
    "NAME: Marcus Reed",
    "ROLE: Executive Director",
    "AUTHORIZATION ROLE: Security Administration",
    "STATUS: ACTIVE",
].join("\n");

// Objective 07 (optional) — CHECK THE ACCESS JUSTIFICATION.
export const Q14_AR44192_JUSTIFICATION_CONTENT = [
    "ACCESS REQUEST",
    "ID: AR-44192",
    "JUSTIFICATION: Emergency operational maintenance",
    "REQUESTED BY: Operations",
    "APPROVED BY: M.REED",
    "ACCESS WINDOW: 01:45 — 03:00",
    "RELATED SYSTEM: relationship-policy",
    "NOTES: Temporary access",
].join("\n");

// "12. Q14 Final Evidence" — the archive's closing statement that the
// operator identity exists elsewhere (sets up Q15). Not tied to a numbered
// objective in the source; included for completeness/flavor if the final
// implementation wants a closing read.
export const Q14_FINAL_EVIDENCE_CONTENT = [
    "DELEGATED SESSION",
    "SESSION: A-77402",
    "IDENTITY: OVERRIDE_OPERATOR",
    "AUTHORIZATION: AR-44192",
    "OPERATOR: REDACTED",
    "IDENTITY SOURCE: PRIMARY OPERATIONS AUDIT",
    "RETENTION: AVAILABLE",
].join("\n");

export const Q14_ROOT_FILES: NetworkFileMap[] = [
    {
        name: "archives",
        isFolder: true,
        children: [
            {
                name: "security",
                isFolder: true,
                children: [
                    {
                        name: "access",
                        isFolder: true,
                        children: [
                            { name: "identity-registry", extension: "txt", data: Q14_IDENTITY_REGISTRY_CONTENT },
                            { name: "session-history", extension: "txt", data: Q14_SESSION_HISTORY_CONTENT },
                            { name: "AR-44192", extension: "txt", data: Q14_AR44192_CONTENT },
                            { name: "AR-44192-justification", extension: "txt", data: Q14_AR44192_JUSTIFICATION_CONTENT },
                            { name: "directory-M-REED", extension: "txt", data: Q14_APPROVER_IDENTITY_CONTENT },
                            { name: "final-evidence", extension: "txt", data: Q14_FINAL_EVIDENCE_CONTENT },
                        ],
                    },
                ],
            },
        ],
    },
];
