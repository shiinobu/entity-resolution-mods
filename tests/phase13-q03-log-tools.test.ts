import { describe, it } from "node:test";
import assert from "node:assert/strict";

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

import {
    Q03_BOOT_HISTORY,
    Q03_FILESTAT_METADATA,
    Q03_GATEWAY_GZ_FILES,
    Q03_ZGREP_NO_RESULT_PATTERNS,
} from "../src/content/index.js";

describe("Phase 13 Q03 — log-tools (pure, SDK-free)", () => {
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

            assert.ok(headerRow.includes(" "), "expected header padding to use U+00A0, not a plain space");
            assert.ok(!/[^ ] {2,}/.test(headerRow), "expected no run of 2+ plain spaces in a padded cell");
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
