import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { synthesizePacketCapture } from "../src/domain/packet/index.js";
import { PacketCaptureService } from "../src/application/ops/packet-capture-service.js";

describe("DSS packet capture", () => {
    it("synthesizes a deterministic capture for a target with no related hosts", () => {
        const first = synthesizePacketCapture("example.test");
        const second = synthesizePacketCapture("example.test");

        assert.deepEqual(first, second);
        assert.ok(first.packets.length >= 8 && first.packets.length <= 16);
        for (const packet of first.packets) {
            assert.ok(
                packet.source === first.localHost || packet.destination === first.localHost,
            );
        }
    });

    it("varies capture content by target and related hosts", () => {
        const withoutHosts = synthesizePacketCapture("example.test");
        const withHosts = synthesizePacketCapture("example.test", [
            "api.example.test",
            "mail.example.test",
        ]);

        assert.notDeepEqual(withoutHosts, withHosts);
    });

    it("runs a full capture through PacketCaptureService with deterministic timing", async () => {
        const service = new PacketCaptureService({
            animation: { packetIntervalMs: 0 },
        });

        const events: string[] = [];
        const result = await service.run(
            "example.test",
            ["api.example.test"],
            {
                onStarted: ({ target, totalPackets }) =>
                    events.push(`started:${target}:${totalPackets}`),
                onPacketCaptured: ({ packet, index }) =>
                    events.push(`packet:${index}:${packet.protocol}`),
                onCompleted: ({ packets }) =>
                    events.push(`completed:${packets.length}`),
                sleep: async () => undefined,
            },
        );

        assert.ok(result);
        assert.equal(result?.target, "example.test");
        assert.ok(events[0]?.startsWith("started:example.test:"));
        assert.equal(events.at(-1), `completed:${result?.packets.length}`);
    });

    it("returns null for an empty target", async () => {
        const service = new PacketCaptureService({
            animation: { packetIntervalMs: 0 },
        });

        const result = await service.run("   ", [], {
            onStarted: () => undefined,
            onPacketCaptured: () => undefined,
            onCompleted: () => undefined,
            sleep: async () => undefined,
        });

        assert.equal(result, null);
    });
});
