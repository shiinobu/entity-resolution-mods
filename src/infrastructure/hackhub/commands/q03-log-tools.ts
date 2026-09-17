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

const LOG_LINE_PATTERN = /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+([^:]+):\s?(.*)$/;

export const parseLogLine = (line: string): ParsedLogLine => {
    const match = line.match(LOG_LINE_PATTERN);

    if (!match) {
        return { timestamp: "", source: "", message: line };
    }

    const [, timestamp = "", source = "", message = ""] = match;

    return { timestamp, source, message };
};

const ZGREP_MESSAGE_MAX_WIDTH = 50;

const MESSAGE_INDENT = "  ";
const MESSAGE_CONNECTOR = "└─ ";
const MESSAGE_CONTINUATION_INDENT = `${MESSAGE_INDENT}   `;

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
