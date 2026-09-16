import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
    DEFAULT_RECON_ANIMATION,
    ReconService,
} from "../src/application/ops/recon-service.js";
import { Q01_RECON_PROFILE, Q01_RECON_RESULT, Q01_RECON_INPUT } from "../src/content/q01.js";

describe("DSS recon service", () => {
    it("keeps animation behavior in the shared service instead of the Q01 command", () => {
        assert.equal(DEFAULT_RECON_ANIMATION.sourceDurationMs, 1000);
        assert.equal(DEFAULT_RECON_ANIMATION.resultDelayMs, 90);
        assert.deepEqual(DEFAULT_RECON_ANIMATION.spinnerFrames, [
            "⠋", "⠙", "⠹", "⠸", "⠼",
            "⠴", "⠦", "⠧", "⠇", "⠏",
        ]);
        assert.equal(DEFAULT_RECON_ANIMATION.progressBarWidth, 24);
    });

    it("resolves a registered profile from normalized URL input", () => {
        const service = new ReconService();
        service.registerProfile(Q01_RECON_PROFILE);

        assert.equal(
            service.resolveProfile(Q01_RECON_INPUT.replace("-d ", ""))?.id,
            "q01",
        );
        assert.equal(
            service.resolveProfile("https://SKYNET-LOGISTICS.IDX/")?.id,
            "q01",
        );
    });

    it("executes a deterministic profile without any external dependency", async () => {
        const service = new ReconService({
            animation: {
                sourceDurationMs: 0,
                resultDelayMs: 0,
            },
        });
        service.registerProfile(Q01_RECON_PROFILE);

        const events: string[] = [];
        const result = await service.run(Q01_RECON_INPUT.replace("-d ", ""), {
            onStarted: ({ profileId, sources }) => {
                events.push(`started:${profileId}:${sources.length}`);
            },
            onSourceStarted: ({ source }) => events.push(`scan:${source.id}`),
            onSourceCompleted: ({ source, progressPercent }) =>
                events.push(`done:${source.id}:${progressPercent}`),
            onCompleted: ({ uniqueHostsFound }) => events.push(`completed:${uniqueHostsFound}`),
            onHostDiscovered: (host) => events.push(`host:${host}`),
            sleep: async () => undefined,
        });

        assert.ok(result);
        assert.equal(result?.profileId, "q01");
        assert.equal(result?.candidatesFound, 8);
        assert.equal(result?.uniqueHostsFound, 4);
        assert.equal(
            result?.hosts.join("\n"),
            Q01_RECON_RESULT,
        );
        assert.equal(events[0], "started:q01:5");
        assert.equal(events.at(-5), "completed:4");
        assert.deepEqual(events.slice(-4), [
            "host:portal.skynet-logistics.idx",
            "host:security.skynet-logistics.idx",
            "host:status.skynet-logistics.idx",
            "host:www.skynet-logistics.idx",
        ]);
    });

    it("synthesizes a deterministic generic profile for targets with no curated quest profile", () => {
        const service = new ReconService();

        const profile = service.resolveProfile("https://example.test/");

        assert.ok(profile);
        assert.match(profile!.id, /^generic:example\.test$/);
        assert.equal(profile!.sources.length, 5);
        assert.ok(profile!.resultHosts.length >= 3 && profile!.resultHosts.length <= 6);
        for (const host of profile!.resultHosts) {
            assert.match(host, /\.example\.test$/);
        }
    });

    it("keeps generic profile synthesis reproducible for the same target", () => {
        const service = new ReconService();

        const first = service.resolveProfile("unregistered-site.test");
        const second = service.resolveProfile("unregistered-site.test");

        assert.deepEqual(first, second);
    });

    it("still prefers a curated quest profile over the generic fallback", () => {
        const service = new ReconService();
        service.registerProfile(Q01_RECON_PROFILE);

        assert.equal(service.resolveProfile(Q01_RECON_INPUT.replace("-d ", ""))?.id, "q01");
    });

    it("completes a full recon run against a generic (non-quest) target", async () => {
        const service = new ReconService({
            animation: { sourceDurationMs: 0, resultDelayMs: 0 },
        });

        const result = await service.run("some-random-company.test", {
            onStarted: () => undefined,
            onSourceStarted: () => undefined,
            onSourceCompleted: () => undefined,
            onHostDiscovered: () => undefined,
            onCompleted: () => undefined,
            sleep: async () => undefined,
        });

        assert.ok(result);
        assert.match(result!.profileId, /^generic:some-random-company\.test$/);
        assert.ok(result!.uniqueHostsFound >= 3 && result!.uniqueHostsFound <= 6);
    });

    it("prefers a native subdomain resolver over the synthetic fallback", async () => {
        const service = new ReconService({
            animation: { sourceDurationMs: 0, resultDelayMs: 0 },
            resolveNativeSubdomains: async (domain) => [
                `legal-experience.${domain}`,
                `upset-final.${domain}`,
                `diligent-beret.${domain}`,
            ],
        });

        const result = await service.run("bcc.com", {
            onStarted: () => undefined,
            onSourceStarted: () => undefined,
            onSourceCompleted: () => undefined,
            onHostDiscovered: () => undefined,
            onCompleted: () => undefined,
            sleep: async () => undefined,
        });

        assert.ok(result);
        assert.equal(result!.profileId, "native:bcc.com");
        assert.equal(result!.uniqueHostsFound, 3);
        assert.deepEqual(
            [...result!.hosts].sort(),
            ["diligent-beret.bcc.com", "legal-experience.bcc.com", "upset-final.bcc.com"],
        );
    });

    it("falls back to the synthetic profile when the native resolver returns nothing", async () => {
        const service = new ReconService({
            animation: { sourceDurationMs: 0, resultDelayMs: 0 },
            resolveNativeSubdomains: async () => null,
        });

        const result = await service.run("no-native-data.test", {
            onStarted: () => undefined,
            onSourceStarted: () => undefined,
            onSourceCompleted: () => undefined,
            onHostDiscovered: () => undefined,
            onCompleted: () => undefined,
            sleep: async () => undefined,
        });

        assert.ok(result);
        assert.match(result!.profileId, /^generic:no-native-data\.test$/);
    });

    it("falls back to the synthetic profile when the native resolver throws", async () => {
        const service = new ReconService({
            animation: { sourceDurationMs: 0, resultDelayMs: 0 },
            resolveNativeSubdomains: async () => {
                throw new Error("native bridge exploded");
            },
        });

        const result = await service.run("throws.test", {
            onStarted: () => undefined,
            onSourceStarted: () => undefined,
            onSourceCompleted: () => undefined,
            onHostDiscovered: () => undefined,
            onCompleted: () => undefined,
            sleep: async () => undefined,
        });

        assert.ok(result);
        assert.match(result!.profileId, /^generic:throws\.test$/);
    });

    it("still prefers a curated quest profile over the native resolver", async () => {
        const service = new ReconService({
            animation: { sourceDurationMs: 0, resultDelayMs: 0 },
            resolveNativeSubdomains: async () => ["should-not-be-used.skynet-logistics.idx"],
        });
        service.registerProfile(Q01_RECON_PROFILE);

        const result = await service.run(Q01_RECON_INPUT.replace("-d ", ""), {
            onStarted: () => undefined,
            onSourceStarted: () => undefined,
            onSourceCompleted: () => undefined,
            onHostDiscovered: () => undefined,
            onCompleted: () => undefined,
            sleep: async () => undefined,
        });

        assert.equal(result?.profileId, "q01");
    });
});
