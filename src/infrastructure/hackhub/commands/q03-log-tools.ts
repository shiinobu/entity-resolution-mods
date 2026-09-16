// Pure formatting/matching helpers for Q03 — the three custom commands
// (filestat, bootlog, zgrep) plus the report-template validation in
// q03-quest.ts. Deliberately free of any
// @hotbunny/hackhub-content-sdk import so this module is testable under
// plain `tsx --test` with no game runtime — see tests/q03.test.ts.

// Greedy word-wrap: breaks on spaces, only hard-breaking a single word that
// alone exceeds maxWidth (should not happen for Q03's own fixture data, but
// this helper is generic). Never returns an empty array — an empty `text`
// still yields one empty line, so a wrapped cell always occupies at least
// one row.
const wrapText = (text: string, maxWidth: number): string[] => {
    if (text.length <= maxWidth) {
        return [text];
    }

    const lines: string[] = [];
    let current = "";

    for (const word of text.split(" ")) {
        if (word.length > maxWidth) {
            if (current) {
                lines.push(current);
                current = "";
            }

            let remaining = word;

            while (remaining.length > maxWidth) {
                lines.push(remaining.slice(0, maxWidth));
                remaining = remaining.slice(maxWidth);
            }

            current = remaining;
            continue;
        }

        const candidate = current ? `${current} ${word}` : word;

        if (candidate.length > maxWidth) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }

    lines.push(current);

    return lines;
};

// Bordered ASCII table shared by filestat/bootlog/zgrep — decided
// 2026-09-15 (session discussion) after live-testing showed `println()`
// does not interpret embedded "\n" as separate terminal lines, so every
// caller must println() once per returned line rather than join and print
// once.
//
// `columnMaxWidths` (decided 2026-09-15, same discussion): an optional
// per-column cap, by index, for columns whose content length can't be
// bounded in advance (e.g. zgrep's MESSAGE column — a log line's length
// depends on quest content, unlike a filename or a fixed-format
// timestamp). A capped column gets a FIXED display width (not shrunk to
// fit shorter content) and wraps any cell exceeding it onto additional
// rows; other columns show blank on those continuation rows. Columns with
// no cap keep the original behavior: width sized to the longest cell
// (header or data).
export const renderAsciiTable = (
    headers: readonly string[],
    rows: readonly (readonly string[])[],
    columnMaxWidths?: readonly (number | undefined)[],
): string[] => {
    const widths = headers.map((header, index) => {
        const maxWidth = columnMaxWidths?.[index];

        if (maxWidth !== undefined) {
            return maxWidth;
        }

        return Math.max(header.length, ...rows.map((row) => (row[index] ?? "").length));
    });

    const buildSeparator = (): string =>
        `+${widths.map((width) => "-".repeat(width + 2)).join("+")}+`;

    // Confirmed live 2026-09-15 (screenshot evidence): HackHub's terminal
    // collapses runs of regular space characters down to one visible space
    // — standard HTML whitespace-collapsing behavior, present even though
    // the dash border (non-whitespace) renders at the correct width. U+00A0
    // (non-breaking space) is excluded from that collapsing rule by the
    // HTML spec, so padding with it instead of a plain space keeps columns
    // visually aligned in-game. The single space that separates each cell
    // from its `|` border stays a plain space — it is never adjacent to
    // another space, so collapsing never affects it.
    const buildRow = (cells: readonly string[]): string =>
        `|${cells.map((cell, index) => ` ${(cell ?? "").padEnd(widths[index] ?? 0, " ")} `).join("|")}|`;

    const buildDataRows = (row: readonly string[]): string[] => {
        const wrappedCells = row.map((cell, index) => {
            const maxWidth = columnMaxWidths?.[index];
            return maxWidth !== undefined ? wrapText(cell ?? "", maxWidth) : [cell ?? ""];
        });

        const lineCount = Math.max(1, ...wrappedCells.map((cellLines) => cellLines.length));

        return Array.from({ length: lineCount }, (_unused, lineIndex) =>
            buildRow(wrappedCells.map((cellLines) => cellLines[lineIndex] ?? "")),
        );
    };

    return [
        buildSeparator(),
        buildRow(headers),
        buildSeparator(),
        ...rows.flatMap(buildDataRows),
        buildSeparator(),
    ];
};

export interface FileStatMetadata {
    readonly modified: string;
    readonly created: string;
}

export const formatFileStat = (
    fileName: string,
    metadata: FileStatMetadata | undefined,
): string[] => {
    if (!metadata) {
        return [`filestat: no metadata recorded for '${fileName}'`];
    }

    return renderAsciiTable(
        ["FILE", "MODIFY", "BIRTH"],
        [[fileName, metadata.modified, metadata.created]],
    );
};

// Parses the recorded "boot N — <start> — <end>" strings (see
// Q03_BOOT_HISTORY) into BOOT/START/END table cells. "present" is
// title-cased to "Present" per the session's UI-polish decision — the
// source data itself stays lowercase.
const parseBootEntry = (entry: string): readonly [string, string, string] => {
    const [bootLabel = "", start = "", end = ""] = entry.split(" — ");
    const boot = bootLabel.replace(/^boot\s*/i, "");
    const formattedEnd = end.toLowerCase() === "present" ? "Present" : end;

    return [boot, start, formattedEnd];
};

export const formatBootHistory = (bootHistory: readonly string[]): string[] => {
    if (bootHistory.length === 0) {
        return ["No boot history recorded."];
    }

    return renderAsciiTable(["BOOT", "START", "END"], bootHistory.map(parseBootEntry));
};

const globToRegExp = (pattern: string): RegExp => {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escaped.replace(/\*/g, ".*")}$`);
};

export const matchGlobPattern = (
    pattern: string,
    names: readonly string[],
): string[] => {
    const regExp = globToRegExp(pattern);
    return names.filter((name) => regExp.test(name));
};

export interface SearchableFile {
    readonly name: string;
    readonly content: string;
}

export interface SearchMatch {
    readonly file: string;
    readonly line: string;
}

export const searchFilesForPattern = (
    files: readonly SearchableFile[],
    pattern: string,
): SearchMatch[] => {
    const matches: SearchMatch[] = [];

    for (const file of files) {
        for (const line of file.content.split("\n")) {
            if (line.includes(pattern)) {
                matches.push({ file: file.name, line });
            }
        }
    }

    return matches;
};

export interface ParsedLogLine {
    readonly timestamp: string;
    readonly source: string;
    readonly message: string;
}

// Q03's log fixtures share one line shape throughout (see
// src/content/q03-filesystem.ts): "Mon DD HH:MM:SS source: message", e.g.
// "Sep 06 02:15:51 gateway-relay: forward 203.0.113.77:443 -> internal
// pool". A line that doesn't match (should not happen against Q03's own
// fixtures, but zgrep is a generic tool) falls back to an empty
// timestamp/source with the whole line as the message, rather than
// throwing.
const LOG_LINE_PATTERN = /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+([^:]+):\s?(.*)$/;

export const parseLogLine = (line: string): ParsedLogLine => {
    const match = line.match(LOG_LINE_PATTERN);

    if (!match) {
        return { timestamp: "", source: "", message: line };
    }

    const [, timestamp = "", source = "", message = ""] = match;

    return { timestamp, source, message };
};

// A log message's length depends on quest content, unlike FILE/TIMESTAMP/
// SOURCE (filename, fixed "Mon DD HH:MM:SS" format, and a short service
// name respectively) — capped and word-wrapped so one long message can't
// produce an unreadably long line.
const ZGREP_MESSAGE_MAX_WIDTH = 50;

// REVISED 2026-09-15 (session discussion, screenshot evidence): the
// original FILE/TIMESTAMP/SOURCE/MESSAGE table (~108 chars wide at full
// content) wraps mid-cell and breaks the box grid at HackHub's minimum
// terminal window size (~55-60 chars) — structurally unfixable by
// shrinking columns, since FILE+TIMESTAMP+SOURCE alone already need ~58
// chars without even counting MESSAGE. Replaced with a per-match block: a
// "file — timestamp — source" header line (empty parts skipped, so a line
// that doesn't match LOG_LINE_PATTERN degrades to just the filename
// instead of a line full of stray " — " separators), then the message on
// its own indented, word-wrapped line(s) — every line this produces stays
// well under the minimum terminal width regardless of window size. The
// indent uses U+00A0 (non-breaking space), same reasoning as
// renderAsciiTable's column padding: HackHub's terminal collapses runs of
// plain spaces.
const MESSAGE_INDENT = "  ";
const MESSAGE_CONNECTOR = "└─ "; // "└─ "
const MESSAGE_CONTINUATION_INDENT = `${MESSAGE_INDENT}   `; // aligns under the connector

const formatMatchHeader = (match: SearchMatch, timestamp: string, source: string): string =>
    [match.file, timestamp, source].filter((part) => part.length > 0).join(" — ");

export const formatSearchMatches = (matches: readonly SearchMatch[]): string[] => {
    const lines: string[] = [];

    matches.forEach((match, index) => {
        if (index > 0) {
            lines.push("");
        }

        const { timestamp, source, message } = parseLogLine(match.line);
        lines.push(formatMatchHeader(match, timestamp, source));

        wrapText(message, ZGREP_MESSAGE_MAX_WIDTH).forEach((wrappedLine, lineIndex) => {
            const prefix = lineIndex === 0 ? `${MESSAGE_INDENT}${MESSAGE_CONNECTOR}` : MESSAGE_CONTINUATION_INDENT;
            lines.push(`${prefix}${wrappedLine}`);
        });
    });

    return lines;
};

// A free-text report field like "missing rotations" has no single natural
// format ("5, 6" vs "5,6" vs "5 and 6" vs "6, 5") — unlike Q02's report
// fields, which were each a single unambiguous value. Comparing the sorted
// set of digits tolerates separator/spacing/wording/order differences while
// still rejecting a genuinely wrong answer.
export const extractSortedNumbers = (text: string): number[] =>
    Array.from(text.matchAll(/\d+/g), (match) => Number(match[0])).sort((a, b) => a - b);

export const numberSetsMatch = (a: string, b: string): boolean => {
    const numbersA = extractSortedNumbers(a);
    const numbersB = extractSortedNumbers(b);

    return (
        numbersA.length > 0 &&
        numbersA.length === numbersB.length &&
        numbersA.every((value, index) => value === numbersB[index])
    );
};

const MONTH_ALIASES: Readonly<Record<string, string>> = {
    jan: "Jan",
    january: "Jan",
    feb: "Feb",
    february: "Feb",
    mar: "Mar",
    march: "Mar",
    apr: "Apr",
    april: "Apr",
    may: "May",
    jun: "Jun",
    june: "Jun",
    jul: "Jul",
    july: "Jul",
    aug: "Aug",
    august: "Aug",
    sep: "Sep",
    sept: "Sep",
    september: "Sep",
    oct: "Oct",
    october: "Oct",
    nov: "Nov",
    november: "Nov",
    dec: "Dec",
    december: "Dec",
};

// A date field the player types from memory ("Sep 08", seen verbatim in
// filestat's own output) has less format risk than missingRotations, but
// still allows reasonable variance: a missing leading zero ("Sep 8"),
// different case ("sep 08"), or the full month name ("September 08"). This
// normalizes to a canonical "Mon DD" form (or null if no valid month+day is
// found) so those variants compare equal without accepting a wrong date.
export const normalizeMonthDay = (text: string): string | null => {
    const match = text.trim().match(/([A-Za-z]+)\.?\s+(\d{1,2})\b/);

    if (!match) {
        return null;
    }

    const [, monthText, dayText] = match;

    if (!monthText || !dayText) {
        return null;
    }

    const month = MONTH_ALIASES[monthText.toLowerCase()];

    if (!month) {
        return null;
    }

    return `${month} ${dayText.padStart(2, "0")}`;
};

export const monthDayMatches = (a: string, b: string): boolean => {
    const normalizedA = normalizeMonthDay(a);
    const normalizedB = normalizeMonthDay(b);

    return normalizedA !== null && normalizedA === normalizedB;
};
