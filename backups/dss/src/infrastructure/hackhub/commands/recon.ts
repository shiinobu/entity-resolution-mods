import {
    Command,
    Events,
    RegisterCommand,
} from "@hotbunny/hackhub-content-sdk";

import {
    formatReconProgressBar,
    normalizeReconTarget,
} from "../../../application/ops/recon-service.js";
import {
    DSS_RECON_EVENTS,
} from "../../../application/ops/events.js";
import { opsRuntime } from "../../../application/ops/runtime.js";

type ReconTools = Parameters<Command["Run"]>[0];

const DSS_RECON_BANNER = [
    "  ____  _____ ____    ____   _  _ ____ _  _ ",
    " |  _ \\| ____|  _ \\  / ___| | || / ___| || |",
    " | | | |  _| | |_) | \\___ \\ | || \\___ \\ || |_",
    " | |_| | |___|  _ <   ___) ||__   _|___) /__   _|",
    " |____/|_____|_| \\_\\ |____/    |_| |____/   |_| ",
] as const;

const getTargetArgument = (args: string[]): string | null => {
    const domainFlagIndex = args.findIndex(
        (arg) => arg === "-d" || arg === "--domain",
    );

    if (domainFlagIndex >= 0) {
        return args[domainFlagIndex + 1] ?? null;
    }

    return args[0] ?? null;
};

const printBanner = (tools: ReconTools): void => {
    for (const line of DSS_RECON_BANNER) {
        tools.println(line);
    }

    tools.println("");
    tools.println("        DSS // Data Surveillance System");
    tools.println("        RECONNAISSANCE MODULE");
};

@RegisterCommand({ default: true })
export class ReconCommand extends Command {
    CommandName = "recon";
    Description = "Run the ENTITY RESOLUTION reconnaissance module.";

    override async Run(tools: ReconTools): Promise<void> {
        const args = tools.getArgs();
        const rawTarget = getTargetArgument(args);

        if (!rawTarget) {
            tools.println("Usage: recon -d <domain>");
            return;
        }

        const normalizedTarget = normalizeReconTarget(rawTarget);

        if (!normalizedTarget) {
            tools.println("Usage: recon -d <domain>");
            return;
        }

        const result = await opsRuntime.runRecon(rawTarget, {
            onStarted: (event) => {
                printBanner(tools);
                tools.println("");
                tools.println(`[INF] Reconnaissance started for ${event.target}`);
                Events.emit(DSS_RECON_EVENTS.started, event);
            },

            onSourceStarted: (event) => {
                tools.println("");
                tools.println(
                    `[>] ${event.source.name.padEnd(18, ".")} ${event.spinnerFrame} scanning ${event.source.description}`,
                );
                Events.emit(DSS_RECON_EVENTS.sourceStarted, event);
            },

            onSourceCompleted: (event) => {
                tools.println(
                    `[✓] ${event.source.name.padEnd(18, ".")} ${event.source.candidates.length} found`,
                );
                tools.println(
                    `Progress: ${formatReconProgressBar(event.progressPercent)} ${event.progressPercent}%`,
                );
                tools.println(
                    `Sources:  ${event.sourceIndex + 1}/${event.totalSources}`,
                );
                tools.println(`Candidates: ${event.candidatesFound}`);
                tools.println(`Unique:     ${event.uniqueHostsFound}`);
                Events.emit(DSS_RECON_EVENTS.sourceCompleted, event);
            },

            onCompleted: (event) => {
                tools.println("");
                tools.println("[INF] Reconnaissance completed");
                tools.println("");
                Events.emit(DSS_RECON_EVENTS.completed, event);
            },

            onHostDiscovered: (host) => {
                tools.println(host);
                Events.emit(DSS_RECON_EVENTS.hostDiscovered, { host });
            },

            sleep: (ms) => tools.sleep(ms),
        });

        if (!result) {
            printBanner(tools);
            tools.println("");
            const reason = `No reconnaissance profile matched ${normalizedTarget}`;
            tools.println(`[WRN] ${reason}`);
            Events.emit(DSS_RECON_EVENTS.failed, {
                target: normalizedTarget,
                reason,
            });
            return;
        }

        tools.println(
            `[INF] Found ${result.uniqueHostsFound} unique hosts for ${result.target} in ${result.elapsedMs} milliseconds`,
        );
    }
}
