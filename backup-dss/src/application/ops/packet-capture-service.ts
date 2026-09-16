import {
    synthesizePacketCapture,
} from "../../domain/packet/index.js";
import type {
    PacketDefinition,
} from "../../domain/packet/index.js";

export interface PacketCaptureAnimationConfig {
    readonly packetIntervalMs: number;
}

export const DEFAULT_PACKET_CAPTURE_ANIMATION: PacketCaptureAnimationConfig = {
    packetIntervalMs: 250,
};

export interface PacketCaptureStartedEvent {
    readonly target: string;
    readonly localHost: string;
    readonly totalPackets: number;
}

export interface PacketCapturedEvent {
    readonly packet: PacketDefinition;
    readonly index: number;
    readonly totalPackets: number;
}

export interface PacketCaptureResult {
    readonly target: string;
    readonly localHost: string;
    readonly packets: readonly PacketDefinition[];
    readonly elapsedMs: number;
}

export interface PacketCaptureObserver {
    onStarted(event: PacketCaptureStartedEvent): void;
    onPacketCaptured(event: PacketCapturedEvent): void;
    onCompleted(result: PacketCaptureResult): void;
    sleep(ms: number): Promise<void>;
}

export interface PacketCaptureServiceOptions {
    readonly animation?: Partial<PacketCaptureAnimationConfig>;
}

const normalizeCaptureTarget = (rawTarget: string): string | null => {
    const value = rawTarget.trim().replace(/^[\'"]|[\'"]$/g, "");
    return value ? value.toLowerCase() : null;
};

export class PacketCaptureService {
    private readonly animation: PacketCaptureAnimationConfig;

    constructor(options: PacketCaptureServiceOptions = {}) {
        this.animation = {
            ...DEFAULT_PACKET_CAPTURE_ANIMATION,
            ...options.animation,
        };
    }

    getAnimationConfig(): PacketCaptureAnimationConfig {
        return this.animation;
    }

    async run(
        rawTarget: string,
        relatedHosts: readonly string[],
        observer: PacketCaptureObserver,
    ): Promise<PacketCaptureResult | null> {
        const target = normalizeCaptureTarget(rawTarget);

        if (!target) {
            return null;
        }

        const profile = synthesizePacketCapture(target, relatedHosts);
        const startedAt = Date.now();

        observer.onStarted({
            target,
            localHost: profile.localHost,
            totalPackets: profile.packets.length,
        });

        for (let index = 0; index < profile.packets.length; index += 1) {
            await observer.sleep(this.animation.packetIntervalMs);
            observer.onPacketCaptured({
                packet: profile.packets[index]!,
                index,
                totalPackets: profile.packets.length,
            });
        }

        const result: PacketCaptureResult = {
            target,
            localHost: profile.localHost,
            packets: profile.packets,
            elapsedMs: Date.now() - startedAt,
        };

        observer.onCompleted(result);
        return result;
    }
}
