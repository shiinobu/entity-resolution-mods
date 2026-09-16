import type {
    ReconResult,
} from "../../domain/recon/index.js";
import type {
    ReconObserver,
} from "./recon-service.js";
import type {
    PacketCaptureObserver,
    PacketCaptureResult,
} from "./packet-capture-service.js";
import {
    OpsCommandRegistry,
} from "./command-registry.js";
import {
    OpsRuntime,
} from "./runtime.js";

export interface OpsCommandContext {
    readonly observer: ReconObserver;
    readonly captureObserver?: PacketCaptureObserver;
}

export interface OpsCommandResult {
    readonly command: string;
    readonly ok: boolean;
    readonly result: ReconResult | PacketCaptureResult | null;
    readonly message?: string;
}

export class OpsCommandRouter {
    constructor(
        private readonly runtime: OpsRuntime,
        private readonly commands: OpsCommandRegistry = runtime.commands,
    ) {}

    async execute(
        commandLine: string,
        context: OpsCommandContext,
    ): Promise<OpsCommandResult> {
        const parts = commandLine.trim().split(/\s+/).filter(Boolean);
        const commandName = parts[0]?.toLowerCase() ?? "";

        if (!commandName) {
            return {
                command: "",
                ok: false,
                result: null,
                message: "Command cannot be empty.",
            };
        }

        const definition = this.commands.get(commandName);
        if (!definition) {
            return {
                command: commandName,
                ok: false,
                result: null,
                message: `Command not found: ${commandName}`,
            };
        }

        if (definition.name === "recon") {
            const rawTarget = this.getReconTarget(parts.slice(1));
            if (!rawTarget) {
                return {
                    command: commandName,
                    ok: false,
                    result: null,
                    message: "Usage: recon -d <domain>",
                };
            }

            const result = await this.runtime.runRecon(
                rawTarget,
                context.observer,
            );

            if (!result) {
                return {
                    command: commandName,
                    ok: false,
                    result: null,
                    message: "No reconnaissance profile matched the target.",
                };
            }

            return {
                command: commandName,
                ok: true,
                result,
            };
        }

        if (definition.name === "wireshark") {
            if (!context.captureObserver) {
                return {
                    command: commandName,
                    ok: false,
                    result: null,
                    message: "Wireshark+ observer is not available.",
                };
            }

            const rawTarget = this.getCaptureTarget(parts.slice(1));
            if (!rawTarget) {
                return {
                    command: commandName,
                    ok: false,
                    result: null,
                    message: "Usage: wireshark -t <target>",
                };
            }

            const result = await this.runtime.runCapture(
                rawTarget,
                context.captureObserver,
            );

            if (!result) {
                return {
                    command: commandName,
                    ok: false,
                    result: null,
                    message: "Wireshark+ could not resolve a capture target.",
                };
            }

            return {
                command: commandName,
                ok: true,
                result,
            };
        }

        return {
            command: commandName,
            ok: false,
            result: null,
            message: `Command is registered but not executable: ${commandName}`,
        };
    }

    private getReconTarget(args: readonly string[]): string | null {
        const flagIndex = args.findIndex(
            (arg) => arg === "-d" || arg === "--domain",
        );

        if (flagIndex >= 0) {
            return args[flagIndex + 1] ?? null;
        }

        return args[0] ?? null;
    }

    private getCaptureTarget(args: readonly string[]): string | null {
        const flagIndex = args.findIndex(
            (arg) => arg === "-t" || arg === "--target",
        );

        if (flagIndex >= 0) {
            return args[flagIndex + 1] ?? null;
        }

        return args[0] ?? null;
    }
}
