import type { ReconProgress, ReconResult } from "../../domain/recon/index.js";

export type OpsSessionStatus = "idle" | "running" | "completed" | "failed";

export interface OpsSessionSnapshot {
    readonly status: OpsSessionStatus;
    readonly target: string | null;
    readonly profileId: string | null;
    readonly totalSources: number;
    readonly completedSources: number;
    readonly candidatesFound: number;
    readonly uniqueHostsFound: number;
    readonly discoveredHosts: readonly string[];
    readonly lastElapsedMs: number | null;
}

export class OpsSessionStore {
    private snapshot: OpsSessionSnapshot = {
        status: "idle",
        target: null,
        profileId: null,
        totalSources: 0,
        completedSources: 0,
        candidatesFound: 0,
        uniqueHostsFound: 0,
        discoveredHosts: [],
        lastElapsedMs: null,
    };

    getSnapshot(): OpsSessionSnapshot {
        return {
            ...this.snapshot,
            discoveredHosts: [...this.snapshot.discoveredHosts],
        };
    }

    startRecon(profileId: string, target: string, totalSources: number): void {
        this.snapshot = {
            status: "running",
            target,
            profileId,
            totalSources,
            completedSources: 0,
            candidatesFound: 0,
            uniqueHostsFound: 0,
            discoveredHosts: [],
            lastElapsedMs: null,
        };
    }

    applySourceProgress(progress: ReconProgress, completed: boolean): void {
        this.snapshot = {
            ...this.snapshot,
            completedSources: completed
                ? progress.sourceIndex + 1
                : progress.sourceIndex,
            candidatesFound: progress.candidatesFound,
            uniqueHostsFound: progress.uniqueHostsFound,
        };
    }

    addHost(host: string): void {
        if (this.snapshot.discoveredHosts.includes(host)) {
            return;
        }

        this.snapshot = {
            ...this.snapshot,
            discoveredHosts: [...this.snapshot.discoveredHosts, host],
        };
    }

    completeRecon(result: ReconResult): void {
        this.snapshot = {
            ...this.snapshot,
            status: "completed",
            target: result.target,
            profileId: result.profileId,
            totalSources: result.sources.length,
            completedSources: result.sources.length,
            candidatesFound: result.candidatesFound,
            uniqueHostsFound: result.uniqueHostsFound,
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
