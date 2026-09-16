export type OpsToolStatus = "ready" | "foundation";

export type OpsToolId = "terminal" | "recon" | "wireshark";

export interface OpsToolDefinition {
    readonly id: OpsToolId;
    readonly name: string;
    readonly description: string;
    readonly status: OpsToolStatus;
    readonly capability?: string;
}

const TOOL_DEFINITIONS: readonly OpsToolDefinition[] = [
    {
        id: "terminal",
        name: "Terminal+",
        description: "ENTITY RESOLUTION command workspace and native HackHub integration boundary.",
        status: "foundation",
        capability: "terminal.basic",
    },
    {
        id: "recon",
        name: "Recon",
        description: "Reusable reconnaissance workspace backed by DSS ReconService.",
        status: "ready",
        capability: "tool.recon",
    },
    {
        id: "wireshark",
        name: "Wireshark+",
        description: "ENTITY RESOLUTION forensic packet-analysis workspace.",
        status: "ready",
        capability: "tool.wireshark",
    },
];

export class OpsToolRegistry {
    getAll(): readonly OpsToolDefinition[] {
        return TOOL_DEFINITIONS;
    }

    get(id: OpsToolId): OpsToolDefinition | null {
        return TOOL_DEFINITIONS.find((tool) => tool.id === id) ?? null;
    }
}
