import {
    Command,
    Files,
    RegisterCommand,
} from "@hotbunny/hackhub-content-sdk";

import { Q03_BOOT_HISTORY } from "../../../content/index.js";
import { formatBootHistory } from "./q03-log-tools.js";

type Q03BootlogTools = Parameters<Command["Run"]>[0];

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

        for (const line of formatBootHistory(Q03_BOOT_HISTORY)) {
            tools.println(line);
        }
    }
}
