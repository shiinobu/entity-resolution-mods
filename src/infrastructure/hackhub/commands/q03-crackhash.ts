import {
    Command,
    Events,
    Files,
    RegisterCommand,
} from "@hotbunny/hackhub-content-sdk";

import { Q03_ACCESS_HASH, Q03_SSH_PASSWORD, Q03_SSH_USERNAME } from "../../../content/q03.js";

declare module "@hotbunny/hackhub-content-sdk" {
    interface ModEventMap {
        "Q03.CrackhashSuccess": undefined;
    }
}

type Q03CrackhashTools = Parameters<Command["Run"]>[0];

const PROGRESS_STEPS = [10, 30, 50, 70, 100] as const;
const PROGRESS_BAR_WIDTH = 10;
const PROGRESS_FRAME_DELAY_MS = 400;

const renderProgressBar = (percent: number): string => {
    const filled = Math.round((percent / 100) * PROGRESS_BAR_WIDTH);
    const bar = "#".repeat(filled) + "-".repeat(PROGRESS_BAR_WIDTH - filled);
    return `[${bar}] ${percent}%`;
};

@RegisterCommand({ default: true })
export class Q03CrackhashCommand extends Command {
    CommandName = "crackhash";
    Description = "Attempt to recover credentials from a password hash file.";

    override async Run(tools: Q03CrackhashTools): Promise<void> {
        const [path] = tools.getArgs();

        if (!path) {
            tools.printError("Usage: crackhash <file>");
            return;
        }

        const resolvedPath = await Files.resolvePath(path);
        const file = await Files.getByPath(resolvedPath);

        if (!file || file.isFolder) {
            tools.printError(`crackhash: cannot open '${path}': No such file or directory`);
            return;
        }

        if (file.data?.trim().toLowerCase() !== Q03_ACCESS_HASH) {
            tools.println("No match found.");
            return;
        }

        tools.println("Cracking hash...");

        for (const percent of PROGRESS_STEPS) {
            await tools.sleep(PROGRESS_FRAME_DELAY_MS);
            tools.clear();
            tools.println("Cracking hash...");
            tools.println(renderProgressBar(percent));
        }

        tools.println("Match found in local database.");
        tools.println(`Account: ${Q03_SSH_USERNAME}`);
        tools.println(`Password: ${Q03_SSH_PASSWORD}`);
        Events.emit("Q03.CrackhashSuccess");
    }
}
