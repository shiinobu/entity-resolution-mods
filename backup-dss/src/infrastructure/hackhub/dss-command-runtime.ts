import {
    Events,
    Shell,
} from "@hotbunny/hackhub-content-sdk";

import {
    OpsCommandRouter,
} from "../../application/ops/command-router.js";
import {
    DSS_CAPTURE_EVENTS,
    DSS_COMMAND_EVENTS,
    DSS_RECON_EVENTS,
} from "../../application/ops/events.js";
import {
    opsRuntime,
} from "../../application/ops/runtime.js";

interface NativeTerminalCommandResult {
    readonly ok: boolean;
    readonly message?: string;
}

export interface DssCommandResultSnapshot {
    readonly sequence: number;
    readonly commandLine: string;
    readonly ok: boolean;
    readonly message: string | null;
}

const commandRouter = new OpsCommandRouter(opsRuntime);
let commandRunning = false;
let commandBridgeRegistered = false;
let commandResultSequence = 0;
let lastCommandResult: DssCommandResultSnapshot = {
    sequence: 0,
    commandLine: "",
    ok: false,
    message: null,
};

const emitSdkEvent = (eventName: string, payload?: unknown): void => {
    try {
        (Events.emit as unknown as (name: string, data?: unknown) => void)(
            eventName,
            payload,
        );
    } catch (error) {
        console.warn(`[DSS] SDK event emission failed for ${eventName}:`, error);
    }
};

const emitCommandResult = (payload: {
    readonly commandLine: string;
    readonly ok: boolean;
    readonly message?: string;
}): void => {
    lastCommandResult = {
        sequence: ++commandResultSequence,
        commandLine: payload.commandLine,
        ok: payload.ok,
        message: payload.message ?? null,
    };

    try {
        if (payload.message === undefined) {
            Events.emit(DSS_COMMAND_EVENTS.result, {
                commandLine: payload.commandLine,
                ok: payload.ok,
            });
        } else {
            Events.emit(DSS_COMMAND_EVENTS.result, payload);
        }
    } catch (error) {
        console.warn("[DSS] SDK command result emission failed:", error);
    }
};

const parseCommandLine = (commandLine: string): {
    command: string;
    args: string[];
} => {
    const parts = commandLine.trim().split(/\s+/).filter(Boolean);
    return {
        command: parts[0]?.toLowerCase() ?? "",
        args: parts.slice(1),
    };
};

const emitNativeTerminalCommand = (
    command: string,
    args: readonly string[],
): void => {
    try {
        Events.emit("Terminal.Command", {
            command,
            args: [...args],
        });
    } catch (error) {
        console.warn("[DSS] terminal command event emission failed:", error);
    }
};

const emitNativeNmapScan = (ip: string): void => {
    try {
        Events.emit("Terminal.NmapScan", { ip });
    } catch (error) {
        console.warn("[DSS] terminal nmap event emission failed:", error);
    }
};

const formatNmapResult = (result: unknown, target: string): string => {
    const lines = [
        "Starting Nmap — DSS terminal simulation",
        `Nmap scan report for ${target}`,
        "Host is up.",
        "",
        "PORT     STATE    SERVICE",
    ];

    if (!Array.isArray(result)) {
        lines.push("22/tcp   filtered  ssh");
        lines.push("80/tcp   closed    http");
        lines.push("443/tcp  closed    https");
        return lines.join("\n");
    }

    for (const entry of result) {
        if (
            typeof entry !== "object" ||
            entry === null ||
            !("port" in entry) ||
            !("status" in entry) ||
            !("service" in entry)
        ) {
            continue;
        }

        const port = `${String(entry.port)}/tcp`;
        const status = String(entry.status).toLowerCase();
        const service = String(entry.service);
        lines.push(`${port.padEnd(9, " ")}${status.padEnd(9, " ")}${service}`);
    }

    return lines.join("\n");
};

const formatLynxResult = (result: unknown): string => {
    if (typeof result !== "object" || result === null) {
        return "lynx: no response data.";
    }

    const lines = ["Lynx — DSS terminal simulation"];

    if ("ips" in result && Array.isArray(result.ips)) {
        for (const ip of result.ips) {
            lines.push(`IP: ${String(ip)}`);
        }
    }

    if ("address" in result && Array.isArray(result.address)) {
        for (const address of result.address) {
            lines.push(`Address: ${String(address)}`);
        }
    }

    return lines.join("\n");
};

const formatPingResult = (result: unknown, target: string): string => result === true
    ? `PING ${target}: host is reachable.`
    : `PING ${target}: request timed out.`;

const NATIVE_TERMINAL_COMMANDS = ["nmap", "lynx", "ping"] as const;

const executeNativeTerminalCommand = async (
    commandLine: string,
): Promise<NativeTerminalCommandResult | null> => {
    const { command, args } = parseCommandLine(commandLine);

    if (!(NATIVE_TERMINAL_COMMANDS as readonly string[]).includes(command)) {
        return null;
    }

    const input = command === "nmap"
        ? args[0] ?? ""
        : args.join(" ").trim();

    if (command === "nmap" && args.length > 1) {
        return {
            ok: false,
            message: "Usage: nmap [ip]",
        };
    }

    if (!input && command === "lynx") {
        return {
            ok: false,
            message: "Usage: lynx <ip-or-url>",
        };
    }

    if (!input && command === "ping") {
        return {
            ok: false,
            message: "Usage: ping <ip>",
        };
    }

    const result = Shell.getCommandData(command, input);

    if (typeof result === "undefined") {
        return {
            ok: false,
            message: `${command}: no fixture available for '${input || "default"}'.`,
        };
    }

    emitNativeTerminalCommand(command, command === "nmap" ? args : [input]);

    if (command === "nmap" && input) {
        emitNativeNmapScan(input);
    }

    const message = command === "nmap"
        ? formatNmapResult(result, input || "local")
        : command === "lynx"
            ? formatLynxResult(result)
            : formatPingResult(result, input);

    return { ok: true, message };
};

const reconCommand = async (commandLine: string): Promise<boolean> => {
    const resultPromise = commandRouter.execute(commandLine, {
        observer: {
            onStarted: (event) => {
                setTimeout(() => {
                    try {
                        Events.emit(DSS_RECON_EVENTS.started, event);
                    } catch (error) {
                        console.warn("[DSS] recon started event failed:", error);
                    }
                }, 0);
            },
            onSourceStarted: (event) => {
                setTimeout(() => {
                    try {
                        Events.emit(DSS_RECON_EVENTS.sourceStarted, event);
                    } catch (error) {
                        console.warn("[DSS] recon source-started event failed:", error);
                    }
                }, 0);
            },
            onSourceCompleted: (event) => {
                setTimeout(() => {
                    try {
                        Events.emit(DSS_RECON_EVENTS.sourceCompleted, event);
                    } catch (error) {
                        console.warn("[DSS] recon source-completed event failed:", error);
                    }
                }, 0);
            },
            onHostDiscovered: (host) => {
                setTimeout(() => {
                    try {
                        Events.emit(DSS_RECON_EVENTS.hostDiscovered, { host });
                    } catch (error) {
                        console.warn("[DSS] recon host event failed:", error);
                    }
                }, 0);
            },
            onCompleted: (result) => {
                setTimeout(() => {
                    try {
                        Events.emit(DSS_RECON_EVENTS.completed, result);
                    } catch (error) {
                        console.warn("[DSS] recon completed event failed:", error);
                    }
                }, 0);
            },
            sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
        },
    });

    const result = await resultPromise;

    if (!result.ok) {
        const message = result.message ?? "Command execution failed.";
        setTimeout(() => {
            try {
                Events.emit(DSS_RECON_EVENTS.failed, {
                    target: commandLine,
                    reason: message,
                });
            } catch (error) {
                console.warn("[DSS] recon failed event failed:", error);
            }
        }, 0);
        emitCommandResult({
            commandLine,
            ok: false,
            message,
        });
        return false;
    }

    emitCommandResult({
        commandLine,
        ok: true,
    });
    return true;
};

const captureCommand = async (commandLine: string): Promise<boolean> => {
    const resultPromise = commandRouter.execute(commandLine, {
        observer: {
            onStarted: () => undefined,
            onSourceStarted: () => undefined,
            onSourceCompleted: () => undefined,
            onHostDiscovered: () => undefined,
            onCompleted: () => undefined,
            sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
        },
        captureObserver: {
            onStarted: (event) => {
                setTimeout(() => {
                    try {
                        Events.emit(DSS_CAPTURE_EVENTS.started, event);
                    } catch (error) {
                        console.warn("[DSS] capture started event failed:", error);
                    }
                }, 0);
            },
            onPacketCaptured: (event) => {
                setTimeout(() => {
                    try {
                        Events.emit(DSS_CAPTURE_EVENTS.packetCaptured, event);
                    } catch (error) {
                        console.warn("[DSS] capture packet event failed:", error);
                    }
                }, 0);
            },
            onCompleted: (result) => {
                setTimeout(() => {
                    try {
                        Events.emit(DSS_CAPTURE_EVENTS.completed, result);
                    } catch (error) {
                        console.warn("[DSS] capture completed event failed:", error);
                    }
                }, 0);
            },
            sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
        },
    });

    const result = await resultPromise;

    if (!result.ok) {
        const message = result.message ?? "Command execution failed.";
        setTimeout(() => {
            try {
                Events.emit(DSS_CAPTURE_EVENTS.failed, {
                    target: commandLine,
                    reason: message,
                });
            } catch (error) {
                console.warn("[DSS] capture failed event failed:", error);
            }
        }, 0);
        emitCommandResult({
            commandLine,
            ok: false,
            message,
        });
        return false;
    }

    emitCommandResult({
        commandLine,
        ok: true,
    });
    return true;
};

export const executeDssCommand = async (commandLine: string): Promise<boolean> => {
    const trimmed = commandLine.trim();

    if (!trimmed) {
        emitCommandResult({
            commandLine,
            ok: false,
            message: "Command cannot be empty.",
        });
        return false;
    }

    if (commandRunning) {
        emitCommandResult({
            commandLine,
            ok: false,
            message: "Another DSS command is already running.",
        });
        return false;
    }

    commandRunning = true;

    try {
        const parsed = parseCommandLine(trimmed);

        if ((NATIVE_TERMINAL_COMMANDS as readonly string[]).includes(parsed.command)) {
            const nativeResult = await executeNativeTerminalCommand(trimmed);

            if (nativeResult) {
                const nativeResultPayload = nativeResult.message === undefined
                    ? {
                        commandLine: trimmed,
                        ok: nativeResult.ok,
                    }
                    : {
                        commandLine: trimmed,
                        ok: nativeResult.ok,
                        message: nativeResult.message,
                    };

                emitCommandResult(nativeResultPayload);
                return nativeResult.ok;
            }
        }

        if (parsed.command === "help" && parsed.args.length === 0) {
            emitCommandResult({
                commandLine: trimmed,
                ok: true,
                message: [
                    "Available DSS commands:",
                    "  recon -d <domain>",
                    "  subfinder -d <domain>  (alias for recon)",
                    "  wireshark -t <target>",
                    "  nmap [ip]",
                    "  lynx <ip-or-url>",
                    "  ping <ip>",
                    "  clear",
                ].join("\n"),
            });
            return true;
        }

        if (parsed.command === "clear" && parsed.args.length === 0) {
            emitCommandResult({
                commandLine: trimmed,
                ok: true,
                message: "__DSS_CLEAR__",
            });
            return true;
        }

        if (parsed.command === "recon") {
            return await reconCommand(trimmed);
        }

        // "subfinder" is a familiar alias players may type/pick from the
        // Terminal+ command palette; the canonical DSS command remains
        // "recon" per the locked Q01 recon-promotion decision, so this
        // rewrites the leading token before dispatch rather than adding a
        // second, competing implementation.
        if (parsed.command === "subfinder") {
            return await reconCommand(
                trimmed.replace(/^subfinder\b/i, "recon"),
            );
        }

        if (parsed.command === "wireshark") {
            return await captureCommand(trimmed);
        }

        const result = await commandRouter.execute(trimmed, {
            observer: {
                onStarted: (event) => emitSdkEvent(DSS_RECON_EVENTS.started, event),
                onSourceStarted: (event) => emitSdkEvent(DSS_RECON_EVENTS.sourceStarted, event),
                onSourceCompleted: (event) => emitSdkEvent(DSS_RECON_EVENTS.sourceCompleted, event),
                onHostDiscovered: (host) => emitSdkEvent(DSS_RECON_EVENTS.hostDiscovered, { host }),
                onCompleted: (result) => emitSdkEvent(DSS_RECON_EVENTS.completed, result),
                sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
            },
        });

        if (!result.ok) {
            emitCommandResult({
                commandLine: trimmed,
                ok: false,
                message: result.message ?? "Command execution failed.",
            });
            return false;
        }

        emitCommandResult({
            commandLine: trimmed,
            ok: true,
        });
        return true;
    } catch (error) {
        opsRuntime.session.fail();
        const message = error instanceof Error
            ? error.message
            : "Unknown command execution error.";

        console.error("[DSS] command execution failed", {
            commandLine: trimmed,
            error,
        });

        emitCommandResult({
            commandLine: trimmed,
            ok: false,
            message,
        });
        return false;
    } finally {
        commandRunning = false;
    }
};

export const getLastCommandResult = (): DssCommandResultSnapshot => ({
    ...lastCommandResult,
});

export const triggerDssCommand = (commandLine: string): boolean => {
    if (!commandLine.trim()) {
        return false;
    }

    void executeDssCommand(commandLine);
    return true;
};

export const registerDssCommandBridge = (): void => {
    if (commandBridgeRegistered) {
        return;
    }

    Events.on(
        DSS_COMMAND_EVENTS.request,
        (event: { commandLine?: string } | string) => {
            const commandLine = typeof event === "string"
                ? event
                : event?.commandLine;

            if (!commandLine?.trim()) {
                return;
            }

            void executeDssCommand(commandLine);
        },
    );

    commandBridgeRegistered = true;
};
