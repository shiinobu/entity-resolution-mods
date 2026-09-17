import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
    applyDevGating,
    isQuestDevFocus,
    Q03_ACCESS_HASH,
    Q03_BOOT_HISTORY,
    Q03_CLIENT_NAME,
    Q03_FILESTAT_METADATA,
    Q03_FINAL_STATE_FLAG,
    Q03_GATEWAY_GZ_FILES,
    Q03_HOLD_MAIL_BACKUP_SEGMENT,
    Q03_HOLD_MAIL_BASE_CONTENT,
    Q03_INCOMING_MAIL_CONTENT,
    Q03_LAST_ACTIVITY_DATE,
    Q03_LOGS_START_DATE,
    Q03_MISSING_LOGS,
    Q03_MISSING_ROTATIONS,
    Q03_OBJECTIVE_IDS,
    Q03_OBJECTIVES,
    Q03_REPORT_BODY,
    Q03_REPORT_SUBJECT,
    Q03_REWARDS,
    Q03_ROOT_FILES,
    Q03_SSH_PASSWORD,
    Q03_TARGET_IP,
    Q03_WEB_HOST,
    Q03_ZGREP_NO_RESULT_PATTERNS,
} from "../src/content/index.js";

import {
    extractSortedNumbers,
    formatBootHistory,
    formatFileStat,
    formatSearchMatches,
    matchGlobPattern,
    monthDayMatches,
    normalizeMonthDay,
    numberSetsMatch,
    parseLogLine,
    renderAsciiTable,
    searchFilesForPattern,
} from "../src/infrastructure/hackhub/commands/q03-log-tools.js";

import { ConditionEvaluator } from "../src/domain/shared/index.js";

import {
    DomainStateAccess,
    FlagStore,
    StateStore,
    createDefaultRuntimeState,
} from "../src/state/index.js";

import { QuestService } from "../src/application/index.js";

const readSource = (relativePath: string): string =>
    readFileSync(
        resolve(fileURLToPath(new URL(relativePath, import.meta.url))),
        "utf8",
    );

const q03ContentSource = readSource("../src/content/q03.ts");
// Q03_DIALOG (moved into content/q03.ts 2026-09-17) legitimately contains the
// player's own rejected theory ("I think someone removed the logs.", branch
// postReportC) — Adrian explicitly shoots it down ("Don't make that
// assumption yet."). That's the hard narrative constraint working as
// designed (the player may *speculate* "removed"; the game/NPCs never
// *assert* it), not a violation — exclude the Dialog block from the
// blanket narrator-text scan below so this legitimate player line doesn't
// trip it.
const q03ContentSourceWithoutDialog = q03ContentSource.replace(
    /export const Q03_DIALOG:[\s\S]*?\r?\n};\r?\n/,
    "",
);
const questSource = readSource("../src/infrastructure/hackhub/q03-quest.ts");
const filestatSource = readSource("../src/infrastructure/hackhub/commands/q03-filestat.ts");
const bootlogSource = readSource("../src/infrastructure/hackhub/commands/q03-bootlog.ts");
const zgrepSource = readSource("../src/infrastructure/hackhub/commands/q03-zgrep.ts");
const crackhashSource = readSource("../src/infrastructure/hackhub/commands/q03-crackhash.ts");
const manifestSource = readSource("../manifest.json");

describe("Q03 — MISSING LOGS (FINAL LOCK, live-in-game passed)", () => {
    it("targets the same host Q02 already investigated — no re-resolve puzzle", () => {
        assert.equal(Q03_CLIENT_NAME, "Skynet Logistics");
        assert.equal(Q03_WEB_HOST, "edge-03.skynet-logistics.idx");
        assert.equal(Q03_TARGET_IP, "203.0.113.77");
        assert.equal(Q03_MISSING_LOGS.id, "entity_resolution.q03");
        assert.equal(Q03_MISSING_LOGS.title, "MISSING LOGS");
    });

    it("mail never states the password in cleartext — only a note that an access-hash backup is attached", () => {
        assert.doesNotMatch(Q03_INCOMING_MAIL_CONTENT, new RegExp(Q03_SSH_PASSWORD));
        assert.doesNotMatch(Q03_INCOMING_MAIL_CONTENT, /Account:/);
        assert.match(Q03_INCOMING_MAIL_CONTENT, /Old access backup attached\./);
    });

    it("defines seven mandatory objective ids plus the optional backup check", () => {
        assert.deepEqual(Q03_OBJECTIVE_IDS, {
            findAccess: "q03.objective.00",
            accessHost: "q03.objective.01",
            checkLogs: "q03.objective.02",
            checkTimestamp: "q03.objective.03",
            reviewBootHistory: "q03.objective.04",
            checkGatewayLogs: "q03.objective.05",
            checkBackup: "q03.objective.05b",
            reportFindings: "q03.objective.06",
        });
    });

    it("gates accessHost on findAccess — the player must read the mail (and its access-hash attachment) before SSH unlocks", () => {
        const accessHostObjective = Q03_OBJECTIVES.find(
            (objective) => objective.name === Q03_OBJECTIVE_IDS.accessHost,
        );
        assert.ok(accessHostObjective, "expected to find the accessHost objective");
        assert.deepEqual(
            (accessHostObjective as { unlocksAfter?: string[] }).unlocksAfter,
            [Q03_OBJECTIVE_IDS.findAccess],
        );

        const findAccessObjective = Q03_OBJECTIVES.find(
            (objective) => objective.name === Q03_OBJECTIVE_IDS.findAccess,
        );
        assert.ok(findAccessObjective, "expected to find the findAccess objective");
        assert.equal("unlocksAfter" in findAccessObjective, false);
    });

    it("registers a custom crackhash command as the only way to recover credentials from the mail attachment — no native tool involved", () => {
        assert.match(crackhashSource, /CommandName = "crackhash"/);
        assert.match(crackhashSource, /Q03_ACCESS_HASH/);
        assert.doesNotMatch(crackhashSource, /Shell\.(add|remove)CommandData\("hydra"/);
        assert.equal(Q03_ACCESS_HASH.length, 64);
        assert.match(Q03_ACCESS_HASH, /^[0-9a-f]{64}$/);
    });

    it("does not gate the mandatory report objective on the optional backup check (avoids a Q02-optional-bonus soft-lock)", () => {
        const reportObjective = Q03_OBJECTIVES.find(
            (objective) => objective.name === Q03_OBJECTIVE_IDS.reportFindings,
        );
        assert.ok(reportObjective, "expected to find the reportFindings objective");
        assert.deepEqual(
            (reportObjective as { unlocksAfter?: string[] }).unlocksAfter,
            [Q03_OBJECTIVE_IDS.checkGatewayLogs],
        );
    });

    it("strips unlocksAfter from every objective when q03 is the dev focus, via applyDevGating", () => {
        const isFocused = isQuestDevFocus("q03");
        const gated = applyDevGating(Q03_OBJECTIVES, isFocused);

        if (isFocused) {
            for (const objective of gated) {
                assert.equal("unlocksAfter" in objective, false);
            }
        } else {
            assert.deepEqual(gated, Q03_OBJECTIVES);
        }
        assert.equal(gated.length, Q03_OBJECTIVES.length);
        assert.match(questSource, /applyDevGating\(Q03_OBJECTIVES, isQuestDevFocus\("q03"\)\)/);
        assert.match(
            questSource,
            /QuestsToComplete = questGate\("q03", \["entity_resolution\.q02"\]\)/,
        );
        assert.match(questSource, /if \(!isQuestDevFocus\("q03"\)\) \{/);
    });

    it("preserves the recovered Phase 8 reward allocation (100 XP max, $300)", () => {
        assert.deepEqual(Q03_REWARDS, {
            investigateServerHistory: 20,
            checkFileTimestamp: 10,
            reviewBootHistory: 10,
            identifyLogGaps: 20,
            correlateMissingRecords: 20,
            checkBackupArchive: 10,
            identifyCriPolicy: 10,
            money: 300,
        });
        assert.equal(
            Q03_REWARDS.investigateServerHistory +
                Q03_REWARDS.checkFileTimestamp +
                Q03_REWARDS.reviewBootHistory +
                Q03_REWARDS.identifyLogGaps +
                Q03_REWARDS.correlateMissingRecords,
            80,
        );
        assert.equal(
            Q03_REWARDS.investigateServerHistory +
                Q03_REWARDS.checkFileTimestamp +
                Q03_REWARDS.reviewBootHistory +
                Q03_REWARDS.identifyLogGaps +
                Q03_REWARDS.correlateMissingRecords +
                Q03_REWARDS.checkBackupArchive +
                Q03_REWARDS.identifyCriPolicy,
            100,
        );
    });

    it("reproduces the source's exact locked report body, with the report template sharing the same discovered facts", () => {
        assert.equal(Q03_REPORT_SUBJECT, "Server History Report — Skynet Logistics");
        assert.match(Q03_REPORT_BODY, /do not cover the full operational/);
        assert.match(Q03_REPORT_BODY, /do not restore the missing period/);
        assert.equal(Q03_LAST_ACTIVITY_DATE, "Sep 08");
        assert.equal(Q03_LOGS_START_DATE, "Sep 03");
        assert.equal(Q03_MISSING_ROTATIONS, "5, 6");
    });

    it("never tells the player the logs were deleted — only that they are incomplete/missing (hard narrative constraint)", () => {
        for (const text of [Q03_INCOMING_MAIL_CONTENT, Q03_REPORT_BODY, Q03_HOLD_MAIL_BASE_CONTENT]) {
            assert.doesNotMatch(text, /delet|removed|erased|wiped/i);
        }
        assert.doesNotMatch(q03ContentSourceWithoutDialog, /"[^"]*\b(delet|removed|erased|wiped)\w*[^"]*"/i);
    });

    it("splices the backup-specific line into the hold mail conditionally, keeping the unconditional wording identical either way", () => {
        assert.match(Q03_HOLD_MAIL_BASE_CONTENT, /Don't include the backup finding in the client report yet\./);
        assert.match(Q03_HOLD_MAIL_BACKUP_SEGMENT, /backup is restricted/);
        assert.doesNotMatch(Q03_HOLD_MAIL_BASE_CONTENT, /backup is restricted/);
    });

    it("keeps port 80 absent from Q03_NETWORK_PORTS (defaults CLOSE), consistent with the mandatory protocol-gating rule on the shared Q02EdgeWebsite host", () => {
        assert.doesNotMatch(q03ContentSource, /\{ external: 80,/);
    });

    it("omits gateway.log.5.gz and gateway.log.6.gz from the fixture tree — the gap is the omission itself", () => {
        const gatewayFolder = JSON.stringify(Q03_ROOT_FILES);
        assert.doesNotMatch(gatewayFolder, /gateway\.log\.5/);
        assert.doesNotMatch(gatewayFolder, /gateway\.log\.6/);
        assert.match(gatewayFolder, /gateway\.log\.2/);
        assert.match(gatewayFolder, /gateway\.log\.7/);
    });

    it("hides the CRI-07 policy clue in backup metadata without ever explaining it", () => {
        const gatewayFolder = JSON.stringify(Q03_ROOT_FILES);
        assert.match(gatewayFolder, /policy_id: CRI-07/);
        assert.doesNotMatch(q03ContentSource, /CRI-07 (means|refers to|is the)/i);
    });

    it("uses the canonical completion flag as its runtime completion boundary", () => {
        const stateStore = new StateStore(createDefaultRuntimeState());
        const flagStore = new FlagStore(stateStore);
        const service = new QuestService(
            new DomainStateAccess(stateStore),
            new ConditionEvaluator(flagStore),
        );

        assert.equal(service.areObjectivesComplete(Q03_MISSING_LOGS), false);
        flagStore.set(Q03_FINAL_STATE_FLAG, true);
        assert.equal(service.areObjectivesComplete(Q03_MISSING_LOGS), true);
    });

    describe("custom commands — filestat / bootlog / zgrep", () => {
        for (const [name, source] of [
            ["filestat", filestatSource],
            ["bootlog", bootlogSource],
            ["zgrep", zgrepSource],
        ] as const) {
            it(`${name} is registered with scope: "remote"`, () => {
                assert.match(source, /scope: "remote"/);
            });
        }

        it("filestat and zgrep resolve every path through Files.resolvePath before Files.getByPath/getChildren — relative-path-against-cwd resolution is not automatic (confirmed live 2026-09-15)", () => {
            for (const source of [filestatSource, zgrepSource]) {
                assert.match(source, /await Files\.resolvePath\(/);

                const resolveIndex = source.indexOf("Files.resolvePath(");
                const getByPathIndex = source.indexOf("Files.getByPath(");
                assert.ok(resolveIndex >= 0 && getByPathIndex >= 0);
                assert.ok(resolveIndex < getByPathIndex, `${source === filestatSource ? "filestat" : "zgrep"}: resolvePath must run before getByPath`);
            }
        });

        it("does not register the source's literal stat/journalctl names — those collide with tools HackHub likely reserves natively; zgrep was confirmed live not to collide (native grep/zgrep cannot decompress .gz content at all)", () => {
            assert.doesNotMatch(filestatSource, /CommandName = "stat"/);
            assert.doesNotMatch(bootlogSource, /CommandName = "journalctl"/);
            assert.match(filestatSource, /CommandName = "filestat"/);
            assert.match(bootlogSource, /CommandName = "bootlog"/);
            assert.match(zgrepSource, /CommandName = "zgrep"/);
        });
    });

    it("declares the 'filesystem' permission required by any Files.* call from a custom command", () => {
        const manifest = JSON.parse(manifestSource) as { permissions: string[] };
        assert.ok(manifest.permissions.includes("filesystem"));
    });
});

describe("Q03 — log-tools (pure, SDK-free)", () => {
    describe("renderAsciiTable", () => {
        it("borders the table and sizes columns to the widest cell", () => {
            const lines = renderAsciiTable(["A", "BB"], [["1", "22"], ["333", "4"]]);

            assert.equal(lines.length, 6);
            assert.equal(lines[0], lines[2]);
            assert.equal(lines[2], lines[5]);
            assert.match(lines[0] as string, /^\+-+\+-+\+$/);
            assert.match(lines[1] as string, /^\| A\s+\| BB\s+\|$/);
        });

        it("pads with a non-breaking space (U+00A0), not a plain space, so HackHub's terminal (confirmed live 2026-09-15 to collapse runs of plain spaces) still renders columns aligned", () => {
            const lines = renderAsciiTable(["BB"], [["much-longer-value"]]);
            const headerRow = lines[1] as string;

            assert.ok(headerRow.includes(" "), "expected header padding to use U+00A0, not a plain space");
            assert.ok(!/[^ ] {2,}/.test(headerRow), "expected no run of 2+ plain spaces in a padded cell");
        });

        it("keeps a capped column at a fixed width regardless of shorter content", () => {
            const lines = renderAsciiTable(["FILE", "MSG"], [["a.log", "short"]], [undefined, 20]);

            assert.match(lines[0] as string, /^\+-+\+----------------------\+$/);
        });

        it("word-wraps a cell exceeding its column cap onto additional rows, leaving other columns blank", () => {
            const lines = renderAsciiTable(
                ["FILE", "MESSAGE"],
                [["a.log", "one two three four five six seven eight nine ten"]],
                [undefined, 20],
            );

            // border, header, border, N data rows, border
            const dataRows = lines.slice(3, -1);
            assert.ok(dataRows.length > 1, "expected the long message to wrap onto more than one row");

            const firstDataRow = dataRows[0] as string;
            assert.match(firstDataRow, /^\| a\.log \|/);

            for (const row of dataRows.slice(1)) {
                assert.match(row as string, /^\|\s+\|/, "continuation row's FILE column should be blank");
            }

            // No wrapped line inside the MESSAGE column should exceed the 20-char cap.
            for (const row of dataRows) {
                const messageCell = (row as string).split("|")[2] ?? "";
                assert.ok(messageCell.trim().length <= 20);
            }
        });

        it("never drops content — every word from the source text still appears somewhere in the wrapped output", () => {
            const message = "one two three four five six seven eight nine ten";
            const lines = renderAsciiTable(["MESSAGE"], [[message]], [20]);
            const rejoined = lines
                .slice(3, -1)
                .map((line) => (line as string).replace(/^\|\s?/, "").replace(/\s?\|$/, "").trim())
                .join(" ");

            assert.equal(rejoined, message);
        });
    });

    describe("formatFileStat", () => {
        it("renders a FILE/MODIFY/BIRTH table row for a known file", () => {
            const lines = formatFileStat("access.log", Q03_FILESTAT_METADATA["access.log"]);

            assert.ok(lines.some((line) => /FILE/.test(line) && /MODIFY/.test(line) && /BIRTH/.test(line)));
            assert.ok(lines.some((line) => line.includes("access.log") && line.includes("Sep 08") && line.includes("Sep 03")));
        });

        it("reports missing metadata instead of throwing", () => {
            const lines = formatFileStat("unknown.log", undefined);

            assert.equal(lines.length, 1);
            assert.match(lines[0] as string, /no metadata recorded/);
        });
    });

    describe("formatBootHistory", () => {
        it("lists every recorded boot as a BOOT/START/END table row, title-casing 'present'", () => {
            const lines = formatBootHistory(Q03_BOOT_HISTORY);
            const joined = lines.join("\n");

            assert.ok(lines.some((line) => /BOOT/.test(line) && /START/.test(line) && /END/.test(line)));
            assert.match(joined, /Aug 19 03:34/);
            assert.match(joined, /Present/);
            assert.doesNotMatch(joined, /present/);
        });

        it("reports no history for an empty list", () => {
            assert.deepEqual(formatBootHistory([]), ["No boot history recorded."]);
        });
    });

    describe("matchGlobPattern", () => {
        const names = ["gateway.log.2.gz", "gateway.log.3.gz", "gateway.log", "access.log"];

        it("matches every file for a wildcard extension pattern", () => {
            assert.deepEqual(matchGlobPattern("*.gz", names), [
                "gateway.log.2.gz",
                "gateway.log.3.gz",
            ]);
        });

        it("returns an empty array when nothing matches", () => {
            assert.deepEqual(matchGlobPattern("*.tar", names), []);
        });

        it("matches an exact name with no wildcard", () => {
            assert.deepEqual(matchGlobPattern("access.log", names), ["access.log"]);
        });
    });

    describe("searchFilesForPattern", () => {
        it("finds matching lines across multiple files", () => {
            const files = [
                { name: "a.log", content: "hello world\nfoo bar" },
                { name: "b.log", content: "another foo line" },
            ];

            const matches = searchFilesForPattern(files, "foo");

            assert.equal(matches.length, 2);
            assert.deepEqual(matches[0], { file: "a.log", line: "foo bar" });
            assert.deepEqual(matches[1], { file: "b.log", line: "another foo line" });
        });

        it("returns an empty array when the pattern is absent", () => {
            const matches = searchFilesForPattern(
                [{ name: "a.log", content: "nothing interesting here" }],
                "missing-pattern",
            );

            assert.deepEqual(matches, []);
        });

        it("returns an empty array for an empty file list", () => {
            assert.deepEqual(searchFilesForPattern([], "anything"), []);
        });

        it("returns zero results for both of Q03's canonical zgrep searches against the real gateway .gz fixtures", () => {
            for (const pattern of Q03_ZGREP_NO_RESULT_PATTERNS) {
                assert.deepEqual(searchFilesForPattern(Q03_GATEWAY_GZ_FILES, pattern), []);
            }
        });
    });

    describe("parseLogLine", () => {
        it("splits a canonical log line into timestamp/source/message", () => {
            const parsed = parseLogLine(
                "Sep 06 02:15:51 gateway-relay: forward 203.0.113.77:443 -> internal pool",
            );

            assert.deepEqual(parsed, {
                timestamp: "Sep 06 02:15:51",
                source: "gateway-relay",
                message: "forward 203.0.113.77:443 -> internal pool",
            });
        });

        it("falls back to an empty timestamp/source with the whole line as message when the shape doesn't match", () => {
            const parsed = parseLogLine("not a log line");

            assert.deepEqual(parsed, { timestamp: "", source: "", message: "not a log line" });
        });
    });

    describe("formatSearchMatches", () => {
        // REVISED 2026-09-15 (session discussion, screenshot evidence): the
        // table format wrapped mid-cell and broke the box grid at HackHub's
        // minimum terminal window size — replaced with a per-match
        // "file — timestamp — source" header line plus an indented,
        // "└─ "-prefixed message line, which never needs a wide single
        // line regardless of window size.
        it("renders a 'file — timestamp — source' header line plus an indented '└─ ' message line", () => {
            const lines = formatSearchMatches([
                {
                    file: "gateway.log.2.gz",
                    line: "Sep 06 02:15:51 gateway-relay: forward 203.0.113.77:443 -> internal pool",
                },
            ]);

            assert.deepEqual(lines, [
                "gateway.log.2.gz — Sep 06 02:15:51 — gateway-relay",
                "  └─ forward 203.0.113.77:443 -> internal pool",
            ]);
        });

        it("skips empty header parts instead of leaving stray ' — ' separators when a line doesn't match the expected log shape", () => {
            const lines = formatSearchMatches([{ file: "weird-file.log", line: "some raw non-log line" }]);

            assert.equal(lines[0], "weird-file.log");
            assert.doesNotMatch(lines[0] as string, /—/);
        });

        it("separates multiple matches with a blank line", () => {
            const lines = formatSearchMatches([
                { file: "a.gz", line: "Sep 06 02:15:51 relay: first" },
                { file: "b.gz", line: "Sep 05 08:33:12 relay: second" },
            ]);

            assert.equal(lines.length, 5);
            assert.equal(lines[2], "");
        });

        it("does not wrap Q03's real fixture message onto multiple lines (41 chars, under the 50-char MESSAGE cap)", () => {
            const lines = formatSearchMatches([
                {
                    file: "gateway.log.2.gz",
                    line: "Sep 06 02:15:51 gateway-relay: forward 203.0.113.77:443 -> internal pool",
                },
            ]);

            // header line + 1 message line
            assert.equal(lines.length, 2);
        });

        it("word-wraps a message longer than the 50-char cap onto additional indented lines, with '└─ ' only on the first", () => {
            const lines = formatSearchMatches([
                {
                    file: "a.log",
                    line: "Sep 06 02:15:51 relay: this message is deliberately much longer than fifty characters wide",
                },
            ]);

            assert.ok(lines.length > 2, "expected the over-long message to wrap onto more than one line");
            assert.match(lines[1] as string, /^  └─ /);

            for (const line of lines.slice(2)) {
                assert.doesNotMatch(line as string, /└─/, "continuation lines should not repeat the '└─' connector");
                assert.match(line as string, /^ {5}/, "continuation lines should align under the connector");
            }
        });
    });

    describe("extractSortedNumbers", () => {
        it("extracts and sorts digit sequences regardless of order", () => {
            assert.deepEqual(extractSortedNumbers("6, 5"), [5, 6]);
        });

        it("returns an empty array when there are no digits", () => {
            assert.deepEqual(extractSortedNumbers("none here"), []);
        });
    });

    describe("numberSetsMatch", () => {
        it("accepts the canonical comma-separated answer", () => {
            assert.equal(numberSetsMatch("5, 6", "5, 6"), true);
        });

        it("accepts different separators and wording for the same numbers", () => {
            assert.equal(numberSetsMatch("5,6", "5, 6"), true);
            assert.equal(numberSetsMatch("5 and 6", "5, 6"), true);
            assert.equal(numberSetsMatch("6, 5", "5, 6"), true);
            assert.equal(numberSetsMatch("5-6", "5, 6"), true);
        });

        it("rejects a genuinely wrong answer", () => {
            assert.equal(numberSetsMatch("5, 7", "5, 6"), false);
            assert.equal(numberSetsMatch("5", "5, 6"), false);
            assert.equal(numberSetsMatch("5, 6, 7", "5, 6"), false);
        });

        it("rejects an answer with no numbers at all", () => {
            assert.equal(numberSetsMatch("none", "5, 6"), false);
        });
    });

    describe("normalizeMonthDay", () => {
        it("pads a single-digit day and title-cases a lowercase month", () => {
            assert.equal(normalizeMonthDay("sep 8"), "Sep 08");
        });

        it("accepts the full month name", () => {
            assert.equal(normalizeMonthDay("September 08"), "Sep 08");
        });

        it("returns null when no valid month is present", () => {
            assert.equal(normalizeMonthDay("Notamonth 08"), null);
        });

        it("returns null when there is no day number", () => {
            assert.equal(normalizeMonthDay("September"), null);
        });
    });

    describe("monthDayMatches", () => {
        it("accepts the canonical form", () => {
            assert.equal(monthDayMatches("Sep 08", "Sep 08"), true);
        });

        it("accepts a missing leading zero, different case, and the full month name", () => {
            assert.equal(monthDayMatches("Sep 8", "Sep 08"), true);
            assert.equal(monthDayMatches("sep 08", "Sep 08"), true);
            assert.equal(monthDayMatches("September 08", "Sep 08"), true);
        });

        it("rejects a genuinely wrong date", () => {
            assert.equal(monthDayMatches("Sep 09", "Sep 08"), false);
            assert.equal(monthDayMatches("Aug 08", "Sep 08"), false);
        });
    });
});
