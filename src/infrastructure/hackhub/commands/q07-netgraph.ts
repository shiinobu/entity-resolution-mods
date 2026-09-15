import { Command, RegisterCommand } from "@hotbunny/hackhub-content-sdk";

type Q07NetgraphTools = Parameters<Command["Run"]>[0];

// TODO: implement when Q07 becomes the active implementation target.
// See docs/phase13-q04-q16-design-recovered.md (mapNetwork objective).
@RegisterCommand({ default: true, scope: "remote" })
export class Q07NetgraphCommand extends Command {
    CommandName = "netgraph";
    Description = "TODO";

    override async Run(tools: Q07NetgraphTools): Promise<void> {
        tools.printError("netgraph: not yet implemented.");
    }
}
