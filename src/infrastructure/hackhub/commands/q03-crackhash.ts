import {
    Command,
    RegisterCommand,
} from "@hotbunny/hackhub-content-sdk";

import { Q03_ACCESS_HASH, Q03_SSH_PASSWORD, Q03_SSH_USERNAME } from "../../../content/q03.js";

type Q03CrackhashTools = Parameters<Command["Run"]>[0];

@RegisterCommand({ default: true })
export class Q03CrackhashCommand extends Command {
    CommandName = "crackhash";
    Description = "Attempt to recover credentials from a password hash.";

    override Run(tools: Q03CrackhashTools): void {
        const [hash] = tools.getArgs();

        if (!hash) {
            tools.printError("Usage: crackhash <hash>");
            return;
        }

        if (hash.toLowerCase() !== Q03_ACCESS_HASH) {
            tools.println("No match found.");
            return;
        }

        tools.println("Cracking hash...");
        tools.println("Match found in local database.");
        tools.println(`Account: ${Q03_SSH_USERNAME}`);
        tools.println(`Password: ${Q03_SSH_PASSWORD}`);
    }
}
