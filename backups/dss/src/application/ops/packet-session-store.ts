import type {
    PacketDefinition,
} from "../../domain/packet/index.js";
import type {
    PacketCaptureResult,
} from "./packet-capture-service.js";

export type PacketSessionStatus = "idle" | "running" | "completed" | "failed";

export interface PacketSessionSnapshot {
    readonly status: PacketSessionStatus;
    readonly target: string | null;
    readonly localHost: string | null;
    readonly totalPackets: number;
    readonly capturedPackets: readonly PacketDefinition[];
    readonly lastElapsedMs: number | null;
}

export class PacketSessionStore {
    private snapshot: PacketSessionSnapshot = {
        status: "idle",
        target: null,
        localHost: null,
        totalPackets: 0,
        capturedPackets: [],
        lastElapsedMs: null,
    };

    getSnapshot(): PacketSessionSnapshot {
        return {
            ...this.snapshot,
            capturedPackets: [...this.snapshot.capturedPackets],
        };
    }

    startCapture(target: string, localHost: string, totalPackets: number): void {
        this.snapshot = {
            status: "running",
            target,
            localHost,
            totalPackets,
            capturedPackets: [],
            lastElapsedMs: null,
        };
    }

    addPacket(packet: PacketDefinition): void {
        this.snapshot = {
            ...this.snapshot,
            capturedPackets: [...this.snapshot.capturedPackets, packet],
        };
    }

    completeCapture(result: PacketCaptureResult): void {
        this.snapshot = {
            ...this.snapshot,
            status: "completed",
            target: result.target,
            localHost: result.localHost,
            totalPackets: result.packets.length,
            capturedPackets: [...result.packets],
            lastElapsedMs: result.elapsedMs,
        };
    }

    fail(): void {
        this.snapshot = {
            ...this.snapshot,
            status: "failed",
        };
    }
}
