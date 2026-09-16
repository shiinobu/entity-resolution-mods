import type { NetworkFileMap } from "@hotbunny/hackhub-content-sdk";

// The `/var/log` + `/var/log/gateway` + `/var/backups/gateway` fixture tree
// for Q03's SSH-reachable host, split out from `q03.ts` to keep that file
// under the project's 800-line soft ceiling. Confirmed live 2026-09-15 (see
// docs/source-current.md "Live-Test Findings"): native
// `ls`/`cat` browse this tree correctly, and a `NetworkFileMap` with
// `extension` set renders as `name` + "." + `extension` (e.g.
// `{ name: "gateway.log.2", extension: "gz" }` → `gateway.log.2.gz`).

export const Q03_ACCESS_LOG_CONTENT = [
    "Sep 03 09:12:04 edge-03 access: 203.0.113.77 GET /health 200",
    "Sep 03 09:14:41 edge-03 access: 203.0.113.77 GET /health 200",
    "Sep 04 22:03:17 edge-03 access: 203.0.113.77 GET /status 200",
    "Sep 06 03:41:59 edge-03 access: 203.0.113.77 GET /health 200",
    "Sep 08 11:27:33 edge-03 access: 203.0.113.77 GET /health 200",
].join("\n");

export const Q03_SYSTEM_LOG_CONTENT = [
    "Sep 08 11:20:01 edge-03 systemd: Started health-check.service.",
    "Sep 08 11:20:02 edge-03 systemd: Started gateway-relay.service.",
].join("\n");

export const Q03_AUTH_LOG_CONTENT = [
    "Sep 08 11:19:40 edge-03 sshd: Accepted password for auditor from 203.0.113.10",
].join("\n");

// Current, uncompressed gateway log — not part of the rotation gap.
export const Q03_GATEWAY_LOG_CONTENT = [
    "Sep 08 10:58:02 gateway-relay: forward 203.0.113.77:443 -> internal pool",
    "Sep 08 11:02:47 gateway-relay: forward 203.0.113.77:443 -> internal pool",
].join("\n");

export const Q03_GATEWAY_LOG_1_CONTENT = [
    "Sep 07 04:11:09 gateway-relay: forward 203.0.113.77:443 -> internal pool",
    "Sep 07 18:40:22 gateway-relay: forward 203.0.113.77:443 -> internal pool",
].join("\n");

// Rotated archives 2-4 and 7 exist; 5 and 6 do not — the gap IS the omission
// below, no sentinel value or flag marks it. None of these lines contain
// "10.42.7.18" or "cri-gateway" — both must return zero results, per the
// source's "first real clue" search step.
export const Q03_GATEWAY_LOG_2_GZ_CONTENT = [
    "Sep 06 02:15:51 gateway-relay: forward 203.0.113.77:443 -> internal pool",
].join("\n");

export const Q03_GATEWAY_LOG_3_GZ_CONTENT = [
    "Sep 05 08:33:12 gateway-relay: forward 203.0.113.77:443 -> internal pool",
].join("\n");

export const Q03_GATEWAY_LOG_4_GZ_CONTENT = [
    "Sep 04 21:07:44 gateway-relay: forward 203.0.113.77:443 -> internal pool",
].join("\n");

// .log.5.gz and .log.6.gz deliberately do not exist in Q03_ROOT_FILES below.

export const Q03_GATEWAY_LOG_7_GZ_CONTENT = [
    "Sep 01 06:02:19 gateway-relay: forward 203.0.113.77:443 -> internal pool",
].join("\n");

const Q03_BACKUP_ARCHIVE_HEADER = [
    "gzip archive — tar contents:",
    "gateway.log",
    "gateway.log.1",
    "gateway.log.2.gz",
    "gateway.log.3.gz",
    "gateway.log.4.gz",
    "gateway.log.7.gz",
    "",
    "owner: infrastructure",
    "created_by: backup-service",
    "retention-policy: restricted",
    // Hidden clue, never explained in any string — chains onto Q02's
    // ARKA Secure Infrastructure -> cri-gateway.internal -> 10.42.7.18
    // breadcrumb. Do not add commentary here; the source is explicit this
    // stays unexplained.
    "policy_id: CRI-07",
].join("\n");

export const Q03_BACKUP_2026_08_27_CONTENT = [
    "archive: gateway-2026-08-27.tar.gz",
    "",
    Q03_BACKUP_ARCHIVE_HEADER,
].join("\n");

export const Q03_BACKUP_2026_08_28_CONTENT = [
    "archive: gateway-2026-08-28.tar.gz",
    "",
    Q03_BACKUP_ARCHIVE_HEADER,
].join("\n");

export const Q03_BACKUP_2026_08_29_CONTENT = [
    "archive: gateway-2026-08-29.tar.gz",
    "",
    Q03_BACKUP_ARCHIVE_HEADER,
].join("\n");

export const Q03_ROOT_FILES: NetworkFileMap[] = [
    {
        name: "var",
        isFolder: true,
        children: [
            {
                name: "log",
                isFolder: true,
                children: [
                    { name: "access", extension: "log", data: Q03_ACCESS_LOG_CONTENT },
                    { name: "system", extension: "log", data: Q03_SYSTEM_LOG_CONTENT },
                    { name: "auth", extension: "log", data: Q03_AUTH_LOG_CONTENT },
                    {
                        name: "gateway",
                        isFolder: true,
                        children: [
                            { name: "gateway", extension: "log", data: Q03_GATEWAY_LOG_CONTENT },
                            { name: "gateway.log", extension: "1", data: Q03_GATEWAY_LOG_1_CONTENT },
                            { name: "gateway.log.2", extension: "gz", data: Q03_GATEWAY_LOG_2_GZ_CONTENT },
                            { name: "gateway.log.3", extension: "gz", data: Q03_GATEWAY_LOG_3_GZ_CONTENT },
                            { name: "gateway.log.4", extension: "gz", data: Q03_GATEWAY_LOG_4_GZ_CONTENT },
                            { name: "gateway.log.7", extension: "gz", data: Q03_GATEWAY_LOG_7_GZ_CONTENT },
                        ],
                    },
                ],
            },
            {
                name: "backups",
                isFolder: true,
                children: [
                    {
                        name: "gateway",
                        isFolder: true,
                        children: [
                            // Confirmed live 2026-09-15: native `cat` refuses
                            // to read a `.gz`-extension file at all ("Unable
                            // to read file.") — unlike the rotated gateway
                            // logs (which deliberately stay `.gz`, since that
                            // limitation is WHY `zgrep` exists as a tool),
                            // this objective's whole point is the player
                            // reading the metadata via plain `cat`, so these
                            // use a `.txt` extension instead. The `.tar.gz`
                            // framing is preserved in the content's own
                            // `archive: ...` header line.
                            {
                                name: "gateway-2026-08-27.tar",
                                extension: "txt",
                                data: Q03_BACKUP_2026_08_27_CONTENT,
                            },
                            {
                                name: "gateway-2026-08-28.tar",
                                extension: "txt",
                                data: Q03_BACKUP_2026_08_28_CONTENT,
                            },
                            {
                                name: "gateway-2026-08-29.tar",
                                extension: "txt",
                                data: Q03_BACKUP_2026_08_29_CONTENT,
                            },
                        ],
                    },
                ],
            },
        ],
    },
];

// Flattened for zgrep's glob-search over `/var/log/gateway/*.gz` — kept
// as one source of truth with Q03_ROOT_FILES above rather than re-derived
// at runtime from the tree, so a unit test can exercise the search logic
// without needing a live Files.* session.
export const Q03_GATEWAY_GZ_FILES = [
    { name: "gateway.log.2.gz", content: Q03_GATEWAY_LOG_2_GZ_CONTENT },
    { name: "gateway.log.3.gz", content: Q03_GATEWAY_LOG_3_GZ_CONTENT },
    { name: "gateway.log.4.gz", content: Q03_GATEWAY_LOG_4_GZ_CONTENT },
    { name: "gateway.log.7.gz", content: Q03_GATEWAY_LOG_7_GZ_CONTENT },
];

// The two canonical searches from the source's "first real clue" step —
// both must return zero results against Q03_GATEWAY_GZ_FILES above.
export const Q03_ZGREP_NO_RESULT_PATTERNS = ["10.42.7.18", "cri-gateway"] as const;

export const Q03_FILESTAT_METADATA: Record<string, { readonly modified: string; readonly created: string }> = {
    "access.log": { modified: "Sep 08", created: "Sep 03" },
    "system.log": { modified: "Sep 08", created: "Sep 03" },
    "auth.log": { modified: "Sep 08", created: "Sep 03" },
};

// Boot history predates the log coverage above — the contradiction Objective
// 03 exists to surface (`bootlog --list-boots`).
export const Q03_BOOT_HISTORY: readonly string[] = [
    "boot 7 — Jun 12 02:03 — Jun 14 09:11",
    "boot 8 — Jun 14 09:15 — Jul 02 14:47",
    "boot 9 — Jul 02 14:52 — Aug 19 03:30",
    "boot 10 — Aug 19 03:34 — present",
];
