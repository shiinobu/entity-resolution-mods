import { Command, RegisterCommand } from "@hotbunny/hackhub-content-sdk";

type Q15TimelineTools = Parameters<Command["Run"]>[0];

// TODO: implement when Q15 becomes the active implementation target.
// See docs/phase13-q04-q16-design-recovered.md (reconstructSession objective).
@RegisterCommand({ default: true, scope: "remote" })
export class Q15TimelineCommand extends Command {
    CommandName = "timeline";
    Description = "TODO";

    override async Run(tools: Q15TimelineTools): Promise<void> {
        tools.printError("timeline: not yet implemented.");
    }
}
