import type { OpsToolId } from "./tool-registry.js";

export interface OpsCommandDefinition {
    readonly name: string;
    readonly description: string;
    readonly toolId: OpsToolId;
}

const COMMAND_DEFINITIONS: readonly OpsCommandDefinition[] = [
    {
        name: "recon",
        description: "Run the ENTITY RESOLUTION reconnaissance module.",
        toolId: "recon",
    },
    {
        name: "wireshark",
        description: "Run an ENTITY RESOLUTION Wireshark+ packet capture.",
        toolId: "wireshark",
    },
];

export class OpsCommandRegistry {
    getAll(): readonly OpsCommandDefinition[] {
        return COMMAND_DEFINITIONS;
    }

    get(name: string): OpsCommandDefinition | null {
        const normalized = name.trim().toLowerCase();
        return COMMAND_DEFINITIONS.find(
            (command) => command.name === normalized,
        ) ?? null;
    }
}
