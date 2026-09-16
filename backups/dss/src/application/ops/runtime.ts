import {
    OpsCommandRegistry,
} from "./command-registry.js";
import {
    OpsEventBus,
} from "./event-bus.js";
import type {
    OpsEventMap,
} from "./event-types.js";
import {
    ReconService,
    type ReconObserver,
} from "./recon-service.js";
import type {
    ReconProgress,
    ReconResult,
} from "../../domain/recon/index.js";
import {
    PacketCaptureService,
    type PacketCaptureObserver,
    type PacketCaptureResult,
    type PacketCapturedEvent,
    type PacketCaptureStartedEvent,
} from "./packet-capture-service.js";
import {
    OpsSessionStore,
} from "./session-store.js";
import {
    PacketSessionStore,
} from "./packet-session-store.js";
import {
    OpsToolRegistry,
} from "./tool-registry.js";

export interface OpsRuntimeServices {
    readonly commands: OpsCommandRegistry;
    readonly events: OpsEventBus<OpsEventMap>;
    readonly recon: ReconService;
    readonly session: OpsSessionStore;
    readonly packets: PacketCaptureService;
    readonly packetSession: PacketSessionStore;
    readonly tools: OpsToolRegistry;
}

export class OpsRuntime {
    readonly commands: OpsCommandRegistry;
    readonly events: OpsEventBus<OpsEventMap>;
    readonly recon: ReconService;
    readonly session: OpsSessionStore;
    readonly packets: PacketCaptureService;
    readonly packetSession: PacketSessionStore;
    readonly tools: OpsToolRegistry;

    constructor(services?: Partial<OpsRuntimeServices>) {
        this.commands = services?.commands ?? new OpsCommandRegistry();
        this.events = services?.events ?? new OpsEventBus<OpsEventMap>();
        this.recon = services?.recon ?? new ReconService();
        this.session = services?.session ?? new OpsSessionStore();
        this.packets = services?.packets ?? new PacketCaptureService();
        this.packetSession = services?.packetSession ?? new PacketSessionStore();
        this.tools = services?.tools ?? new OpsToolRegistry();
    }

    async runRecon(
        rawTarget: string,
        observer: ReconObserver,
    ): Promise<ReconResult | null> {
        return this.recon.run(rawTarget, {
            ...observer,
            onStarted: (event) => {
                this.session.startRecon(
                    event.profileId,
                    event.target,
                    event.totalSources,
                );
                this.events.emit("reconStarted", event);
                observer.onStarted(event);
            },
            onSourceStarted: (event: ReconProgress) => {
                this.session.applySourceProgress(event, false);
                this.events.emit("reconSourceStarted", event);
                observer.onSourceStarted(event);
            },
            onSourceCompleted: (event: ReconProgress) => {
                this.session.applySourceProgress(event, true);
                this.events.emit("reconSourceCompleted", event);
                observer.onSourceCompleted(event);
            },
            onHostDiscovered: (host: string) => {
                this.session.addHost(host);
                this.events.emit("reconHostDiscovered", { host });
                observer.onHostDiscovered(host);
            },
            onCompleted: (result: ReconResult) => {
                this.session.completeRecon(result);
                this.events.emit("reconCompleted", result);
                observer.onCompleted(result);
            },
        });
    }

    async runCapture(
        rawTarget: string,
        observer: PacketCaptureObserver,
    ): Promise<PacketCaptureResult | null> {
        const reconSnapshot = this.session.getSnapshot();
        const relatedHosts = reconSnapshot.target === rawTarget.trim().toLowerCase()
            && reconSnapshot.status === "completed"
            ? reconSnapshot.discoveredHosts
            : [];

        return this.packets.run(rawTarget, relatedHosts, {
            ...observer,
            onStarted: (event: PacketCaptureStartedEvent) => {
                this.packetSession.startCapture(
                    event.target,
                    event.localHost,
                    event.totalPackets,
                );
                this.events.emit("captureStarted", event);
                observer.onStarted(event);
            },
            onPacketCaptured: (event: PacketCapturedEvent) => {
                this.packetSession.addPacket(event.packet);
                this.events.emit("packetCaptured", event);
                observer.onPacketCaptured(event);
            },
            onCompleted: (result: PacketCaptureResult) => {
                this.packetSession.completeCapture(result);
                this.events.emit("captureCompleted", result);
                observer.onCompleted(result);
            },
        });
    }
}

export const opsRuntime = new OpsRuntime();
