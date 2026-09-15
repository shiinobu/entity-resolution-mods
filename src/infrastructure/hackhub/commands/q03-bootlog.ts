import {
    Command,
    Files,
    RegisterCommand,
} from "@hotbunny/hackhub-content-sdk";

import { Q03_BOOT_HISTORY } from "../../../content/index.js";
import { formatBootHistory } from "./q03-log-tools.js";

type Q03BootlogTools = Parameters<Command["Run"]>[0];

// No path argument, so no Files.resolvePath/getByPath is needed here — but
// this still only makes sense inside an SSH session, matching the source's
// `journalctl --list-boots` invocation against the remote host.
@RegisterCommand({ default: true, scope: "remote" })
export class Q03BootlogCommand extends Command {
    CommandName = "bootlog";
    Description = "Show boot history for the current host.";

    override async Run(tools: Q03BootlogTools): Promise<void> {
        if (!Files.isRemoteSession()) {
            tools.printError("bootlog: only available inside an SSH session.");
            return;
        }

        const args = tools.getArgs();

        if (!args.includes("--list-boots")) {
            tools.printError("Usage: bootlog --list-boots");
            return;
        }

        // println() does not interpret embedded "\n" as separate terminal
        // lines — confirmed live 2026-09-15 — so every table line is its
        // own println() call.
        for (const line of formatBootHistory(Q03_BOOT_HISTORY)) {
            tools.println(line);
        }
    }
}
