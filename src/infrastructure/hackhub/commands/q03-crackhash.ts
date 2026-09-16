import {
    Command,
    RegisterCommand,
} from "@hotbunny/hackhub-content-sdk";

import { Q03_ACCESS_HASH, Q03_SSH_PASSWORD, Q03_SSH_USERNAME } from "../../../content/q03.js";

type Q03CrackhashTools = Parameters<Command["Run"]>[0];

// ADDED 2026-09-16 — fully custom, mod-controlled hash cracker. Replaces two
// earlier native-tool attempts that both failed for reasons outside our
// control: `john` ignores mod fixtures entirely (its own internal crack
// simulation), and `hydra` hit an undocumented "Invalid wordlist file."
// validation that never accepted any wordlist we constructed. See
// content/q03.ts's Q03_SSH_PASSWORD comment for the full history.
//
// This is a simple fixed lookup against the one hash Q03 ever hands out
// (Q03_ACCESS_HASH, the SHA-256 of "username:password") — not a real
// cracker. The player types the hash from the `old-creds.bak` mail
// attachment; a match reveals both credentials at once.
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
