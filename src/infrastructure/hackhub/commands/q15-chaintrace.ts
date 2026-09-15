import { Command, RegisterCommand } from "@hotbunny/hackhub-content-sdk";

type Q15ChaintraceTools = Parameters<Command["Run"]>[0];

// TODO: implement when Q15 becomes the active implementation target.
// See DEAD_SIGNAL_Q15_THE_EVIDENCE_LOCKED_v1.0.docx via content/q15.ts's
// header comment (traceRizkyPipeline objective).
@RegisterCommand({ default: true, scope: "remote" })
export class Q15ChaintraceCommand extends Command {
    CommandName = "chaintrace";
    Description = "TODO";

    override async Run(tools: Q15ChaintraceTools): Promise<void> {
        tools.printError("chaintrace: not yet implemented.");
    }
}
