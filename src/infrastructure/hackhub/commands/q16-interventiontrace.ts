import { Command, RegisterCommand } from "@hotbunny/hackhub-content-sdk";

type Q16InterventiontraceTools = Parameters<Command["Run"]>[0];

// TODO: implement when Q16 becomes the active implementation target.
// See docs/source-current.md (reconstructInterventionPattern objective).
@RegisterCommand({ default: true, scope: "remote" })
export class Q16InterventiontraceCommand extends Command {
    CommandName = "interventiontrace";
    Description = "TODO";

    override async Run(tools: Q16InterventiontraceTools): Promise<void> {
        tools.printError("interventiontrace: not yet implemented.");
    }
}
