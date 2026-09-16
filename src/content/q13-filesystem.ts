// Fixture data for Q13's operational audit trail. Facts (OVERRIDE_OPERATOR
// account, session A-77402, origin IP, dates) sourced from
// docs/source-current.md. Filenames are this project's own
// naming choice.

import type { NetworkFileMap } from "@hotbunny/hackhub-content-sdk";

export const Q13_OVERRIDE_ACCOUNT_CONTENT = [
    "account: OVERRIDE_OPERATOR",
    "status: ACTIVE",
    "active_since: 2026-06-18",
].join("\n");

// Sourced: the account's traced activity (POL-1847 deploy, policy reloads,
// the 08-18 CONFIGURATION_OVERRIDE).
export const Q13_ACTIVITY_LOG_CONTENT = [
    "account: OVERRIDE_OPERATOR",
    "2026-07-14  POL-1847 deploy",
    "2026-07-14  policy reload",
    "2026-08-18  CONFIGURATION_OVERRIDE  session=A-77402",
].join("\n");

export const Q13_SESSION_A77402_CONTENT = [
    "session: A-77402",
    "date: 2026-08-18",
    "action: CONFIGURATION_OVERRIDE",
    "origin_ip: 10.42.7.31",
    "origin_network: ARKA Administrative Network",
].join("\n");

export const Q13_ROOT_FILES: NetworkFileMap[] = [
    {
        name: "audit",
        isFolder: true,
        children: [
            { name: "override_operator_account", extension: "txt", data: Q13_OVERRIDE_ACCOUNT_CONTENT },
            { name: "override_operator_activity", extension: "log", data: Q13_ACTIVITY_LOG_CONTENT },
            { name: "session_A-77402", extension: "txt", data: Q13_SESSION_A77402_CONTENT },
        ],
    },
];
