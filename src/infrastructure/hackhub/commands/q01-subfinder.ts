import {
    Command,
    RegisterCommand,
} from "@hotbunny/hackhub-content-sdk";

import {
    Q01_SUBFINDER_RESULT,
    Q01_WEB_HOST,
    Q01_WEB_HOME_HOST,
} from "../../../content/q01.js";

const SOURCE_DURATION_MS = 1000;
const RESULT_DELAY_MS = 90;

const SOURCES = [
    {
        name: "crtsh",
        description: "certificate transparency",
        candidates: [
            "www.skynet-logistics.idx",
            "security.skynet-logistics.idx",
        ],
    },
    {
        name: "rapiddns",
        description: "passive DNS",
        candidates: [
            "security.skynet-logistics.idx",
            "portal.skynet-logistics.idx",
        ],
    },
    {
        name: "hackertarget",
        description: "host intelligence",
        candidates: [
            "status.skynet-logistics.idx",
            "www.skynet-logistics.idx",
        ],
    },
    {
        name: "alienvault",
        description: "OTX passive DNS",
        candidates: ["status.skynet-logistics.idx"],
    },
    {
        name: "urlscan",
        description: "indexed URLs",
        candidates: ["portal.skynet-logistics.idx"],
    },
] as const;

const SUBFINDER_BANNER = [
    "               __    _____           __         ",
    "   _______  __/ /_  / __(_)___  ____/ /__  _____",
    "  / ___/ / / / __ \\/ /_/ / __ \\/ __  / _ \\/ ___/",
    " (__  ) /_/ / /_/ / __/ / / / / /_/ /  __/ /    ",
    "/____/\\__,_/_.___/_/ /_/_/ /_/\\__,_/\\___/_/",
] as const;

const SUBFINDER_WARNINGS = [
    "[WRN] Use with caution. You are responsible for your actions.",
    "[WRN] Developers assume no liability and are not responsible for any misuse or damage.",
    "[WRN] By using subfinder, you also agree to the terms of the APIs used.",
] as const;

const SPINNER_FRAMES = [
    "⠋",
    "⠙",
    "⠹",
    "⠸",
    "⠼",
    "⠴",
    "⠦",
    "⠧",
    "⠇",
    "⠏",
] as const;

const getDomainArgument = (args: string[]): string | null => {
    const domainFlagIndex = args.findIndex(
        (arg) => arg === "-d" || arg === "--domain",
    );

    if (domainFlagIndex >= 0) {
        return args[domainFlagIndex + 1] ?? null;
    }

    return args[0] ?? null;
};

const normalizeTarget = (rawTarget: string): string | null => {
    const value = rawTarget.trim().replace(/^['"]|['"]$/g, "");

    if (!value) {
        return null;
    }

    try {
        const url = value.includes("://")
            ? new URL(value)
            : new URL(`https://${value}`);

        return url.hostname.toLowerCase().replace(/\.$/, "");
    } catch {
        return null;
    }
};

type Q01SubfinderTools = Parameters<Command["Run"]>[0];
type Source = (typeof SOURCES)[number];

const getCompletedCandidates = (completedSources: Source[]): string[] =>
    completedSources.flatMap((source) => source.candidates);

const getUniqueCandidates = (completedSources: Source[]): string[] => [
    ...new Set(getCompletedCandidates(completedSources)),
];

const formatProgressBar = (percent: number, width = 24): string => {
    const filled = Math.round((percent / 100) * width);
    return `[${"█".repeat(filled)}${"░".repeat(width - filled)}]`;
};

@RegisterCommand({ default: true })
export class Q01SubfinderCommand extends Command {
    /**
     * Registered as "subfinders" (plural) because HackHub's production runtime
     * rejects a mod command that shadows the native "subfinder" executable.
     * Q01 keeps terminal output append-only; each source emits discrete
     * scanning/completion events plus cumulative progress counters instead of
     * clearing the player's terminal history.
     *
     * The candidates are deterministic Q01 fixtures; no external enumeration
     * or network dependency is used at runtime.
     */
    CommandName = "subfinders";
    Description = "Enumerate subdomains for a target domain.";

    private printHeader(tools: Q01SubfinderTools): void {
        for (const line of SUBFINDER_BANNER) {
            tools.println(line);
        }

        tools.println("");
        tools.println("\t\tprojectdiscovery.io");
        tools.println("");

        for (const warning of SUBFINDER_WARNINGS) {
            tools.println(warning);
        }
    }

    private printProgress(
        tools: Q01SubfinderTools,
        completedSources: Source[],
    ): void {
        const progress = Math.round(
            (completedSources.length / SOURCES.length) * 100,
        );
        const candidateCount = getCompletedCandidates(completedSources).length;
        const uniqueCount = getUniqueCandidates(completedSources).length;

        tools.println(`Progress: ${formatProgressBar(progress)} ${progress}%`);
        tools.println(`Sources:  ${completedSources.length}/${SOURCES.length}`);
        tools.println(`Candidates: ${candidateCount}`);
        tools.println(`Unique:     ${uniqueCount}`);
    }

    override async Run(tools: Q01SubfinderTools) {
        const args = tools.getArgs();
        const rawTarget = getDomainArgument(args);
        const normalizedTarget = rawTarget ? normalizeTarget(rawTarget) : null;

        if (!normalizedTarget) {
            tools.println("Usage: subfinders -d <domain>");
            return;
        }

        if (
            normalizedTarget !== Q01_WEB_HOST &&
            normalizedTarget !== Q01_WEB_HOME_HOST
        ) {
            this.printHeader(tools);
            tools.println("");
            tools.println(`[WRN] No subdomains found for ${normalizedTarget}`);
            return;
        }

        this.printHeader(tools);
        tools.println("");
        tools.println(`[INF] Enumerating subdomains for ${normalizedTarget}`);

        const completedSources: Source[] = [];

        for (let index = 0; index < SOURCES.length; index += 1) {
            const source = SOURCES[index]!;
            const frame = SPINNER_FRAMES[index % SPINNER_FRAMES.length]!;

            tools.println("");
            tools.println(
                `[>] ${source.name.padEnd(18, ".")} ${frame} scanning ${source.description}`,
            );

            await tools.sleep(SOURCE_DURATION_MS);

            completedSources.push(source);

            tools.println(
                `[✓] ${source.name.padEnd(18, ".")} ${source.candidates.length} found`,
            );
            this.printProgress(tools, completedSources);
        }

        tools.println("");
        tools.println("[INF] Enumeration completed");
        tools.println("");

        const subdomains = Q01_SUBFINDER_RESULT.split("\n");
        for (const subdomain of subdomains) {
            await tools.sleep(RESULT_DELAY_MS);
            tools.println(subdomain);
        }

        tools.println("");
        tools.println(
            `[INF] Found ${subdomains.length} unique subdomains for ${normalizedTarget}`,
        );
    }
}
