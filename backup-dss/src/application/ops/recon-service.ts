import {
    buildReconProfileFromNativeSubdomains,
    synthesizeGenericReconProfile,
} from "../../domain/recon/index.js";
import type {
    ReconAnimationConfig,
    ReconProgress,
    ReconProfile,
    ReconResult,
    ReconSourceDefinition,
} from "../../domain/recon/index.js";

// Resolves subdomains from HackHub's own native subfinder command (or any
// other live source), or null when unavailable/timed out. Kept as an
// injectable hook so this domain-agnostic service never imports the HackHub
// SDK directly — the infrastructure layer wires in the real implementation.
export type NativeSubdomainResolver = (
    domain: string,
) => Promise<readonly string[] | null>;

export interface ReconStartedEvent {
    readonly profileId: string;
    readonly target: string;
    readonly totalSources: number;
    readonly sources: readonly ReconSourceDefinition[];
}

export interface ReconObserver {
    onStarted(event: ReconStartedEvent): void;
    onSourceStarted(event: ReconProgress): void;
    onSourceCompleted(event: ReconProgress): void;
    onHostDiscovered(host: string): void;
    onCompleted(result: ReconResult): void;
    sleep(ms: number): Promise<void>;
}

export interface ReconServiceOptions {
    readonly animation?: Partial<ReconAnimationConfig>;
    readonly resolveNativeSubdomains?: NativeSubdomainResolver;
}

export const DEFAULT_RECON_ANIMATION: ReconAnimationConfig = {
    sourceDurationMs: 1000,
    resultDelayMs: 90,
    spinnerFrames: [
        "⠋",
        "⠙",
        "⠹",
        "⠸",
        "⠼",
        "⠴",
        "⠦",
        "⠧",
        "⠇",
        "⠏",
    ],
    progressBarWidth: 24,
};

export const formatReconProgressBar = (
    percent: number,
    width = DEFAULT_RECON_ANIMATION.progressBarWidth,
): string => {
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.round((clamped / 100) * width);
    return `[${"█".repeat(filled)}${"░".repeat(width - filled)}]`;
};

export const normalizeReconTarget = (rawTarget: string): string | null => {
    const value = rawTarget.trim().replace(/^[\'"]|[\'"]$/g, "");

    if (!value) {
        return null;
    }

    try {
        const url = value.includes("://")
            ? new URL(value)
            : new URL(`https://${value}`);

        return url.hostname.toLowerCase().replace(/\.$/, "");
    } catch {
        return null;
    }
};

export class ReconService {
    private readonly profiles = new Map<string, ReconProfile>();
    private readonly animation: ReconAnimationConfig;
    private nativeResolver: NativeSubdomainResolver | null;

    constructor(options: ReconServiceOptions = {}) {
        this.animation = {
            ...DEFAULT_RECON_ANIMATION,
            ...options.animation,
        };
        this.nativeResolver = options.resolveNativeSubdomains ?? null;
    }

    setNativeSubdomainResolver(resolver: NativeSubdomainResolver | null): void {
        this.nativeResolver = resolver;
    }

    registerProfile(profile: ReconProfile): void {
        if (!profile.id.trim()) {
            throw new Error("Recon profile id must not be empty.");
        }

        if (profile.targets.length === 0) {
            throw new Error(`Recon profile '${profile.id}' has no targets.`);
        }

        if (profile.sources.length === 0) {
            throw new Error(`Recon profile '${profile.id}' has no sources.`);
        }

        for (const target of profile.targets) {
            const normalizedTarget = normalizeReconTarget(target);
            if (!normalizedTarget) {
                throw new Error(
                    `Recon profile '${profile.id}' contains an invalid target '${target}'.`,
                );
            }

            for (const [existingId, existingProfile] of this.profiles) {
                if (existingId === profile.id) {
                    continue;
                }

                if (
                    existingProfile.targets.some(
                        (existingTarget) =>
                            normalizeReconTarget(existingTarget) === normalizedTarget,
                    )
                ) {
                    throw new Error(
                        `Recon target '${normalizedTarget}' is already owned by profile '${existingId}'.`,
                    );
                }
            }
        }

        this.profiles.set(profile.id, profile);
    }

    getProfiles(): readonly ReconProfile[] {
        return [...this.profiles.values()];
    }

    private findCuratedProfile(normalizedTarget: string): ReconProfile | null {
        for (const profile of this.profiles.values()) {
            if (
                profile.targets.some(
                    (target) => normalizeReconTarget(target) === normalizedTarget,
                )
            ) {
                return profile;
            }
        }

        return null;
    }

    resolveProfile(rawTarget: string): ReconProfile | null {
        const normalizedTarget = normalizeReconTarget(rawTarget);

        if (!normalizedTarget) {
            return null;
        }

        // Synchronous resolution only checks curated profiles and the
        // deterministic synthetic fallback — the native subfinder lookup is
        // asynchronous and only attempted from run() below.
        return this.findCuratedProfile(normalizedTarget)
            ?? synthesizeGenericReconProfile(normalizedTarget);
    }

    private async resolveFallbackProfile(target: string): Promise<ReconProfile> {
        if (this.nativeResolver) {
            try {
                const subdomains = await this.nativeResolver(target);
                if (subdomains && subdomains.length > 0) {
                    return buildReconProfileFromNativeSubdomains(target, subdomains);
                }
            } catch {
                // Native lookup failed (unavailable, timed out, threw) —
                // fall through to the deterministic synthetic profile.
            }
        }

        return synthesizeGenericReconProfile(target);
    }

    getAnimationConfig(): ReconAnimationConfig {
        return this.animation;
    }

    async run(rawTarget: string, observer: ReconObserver): Promise<ReconResult | null> {
        const target = normalizeReconTarget(rawTarget);

        if (!target) {
            return null;
        }

        const profile = this.findCuratedProfile(target)
            ?? await this.resolveFallbackProfile(target);

        const startedAt = Date.now();
        observer.onStarted({
            profileId: profile.id,
            target,
            totalSources: profile.sources.length,
            sources: profile.sources,
        });

        const completedSources: ReconSourceDefinition[] = [];

        for (let index = 0; index < profile.sources.length; index += 1) {
            const source = profile.sources[index]!;
            const progressBefore = this.createProgress(
                profile,
                target,
                source,
                index,
                completedSources,
            );

            observer.onSourceStarted(progressBefore);
            await observer.sleep(this.animation.sourceDurationMs);

            completedSources.push(source);

            const progressAfter = this.createProgress(
                profile,
                target,
                source,
                index,
                completedSources,
                true,
            );

            observer.onSourceCompleted(progressAfter);
        }

        const result: ReconResult = {
            profileId: profile.id,
            target,
            sources: profile.sources,
            candidatesFound: completedSources.reduce(
                (total, source) => total + source.candidates.length,
                0,
            ),
            uniqueHostsFound: new Set(
                completedSources.flatMap((source) => source.candidates),
            ).size,
            hosts: profile.resultHosts,
            elapsedMs: Date.now() - startedAt,
        };

        observer.onCompleted(result);

        for (const host of result.hosts) {
            await observer.sleep(this.animation.resultDelayMs);
            observer.onHostDiscovered(host);
        }

        return result;
    }

    private createProgress(
        profile: ReconProfile,
        target: string,
        source: ReconSourceDefinition,
        index: number,
        completedSources: readonly ReconSourceDefinition[],
        completed = false,
    ): ReconProgress {
        const candidateCount = completedSources.reduce(
            (total, item) => total + item.candidates.length,
            0,
        );
        const uniqueCount = new Set(
            completedSources.flatMap((item) => item.candidates),
        ).size;
        const progressPercent = Math.round(
            (completedSources.length / profile.sources.length) * 100,
        );

        return {
            target,
            source,
            sourceIndex: index,
            totalSources: profile.sources.length,
            progressPercent: completed
                ? progressPercent
                : Math.round((index / profile.sources.length) * 100),
            candidatesFound: candidateCount,
            uniqueHostsFound: uniqueCount,
            spinnerFrame:
                this.animation.spinnerFrames[
                    index % this.animation.spinnerFrames.length
                ] ?? "⠋",
        };
    }
}
