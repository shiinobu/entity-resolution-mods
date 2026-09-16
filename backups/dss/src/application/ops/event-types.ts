import type {
    ReconProgress,
    ReconResult,
} from "../../domain/recon/index.js";
import type {
    ReconStartedEvent,
} from "./recon-service.js";
import type {
    PacketCaptureResult,
    PacketCapturedEvent,
    PacketCaptureStartedEvent,
} from "./packet-capture-service.js";

export interface OpsEventMap {
    reconStarted: ReconStartedEvent;
    reconSourceStarted: ReconProgress;
    reconSourceCompleted: ReconProgress;
    reconHostDiscovered: { readonly host: string };
    reconCompleted: ReconResult;
    reconFailed: {
        readonly target: string;
        readonly reason: string;
    };
    captureStarted: PacketCaptureStartedEvent;
    packetCaptured: PacketCapturedEvent;
    captureCompleted: PacketCaptureResult;
    captureFailed: {
        readonly target: string;
        readonly reason: string;
    };
}
