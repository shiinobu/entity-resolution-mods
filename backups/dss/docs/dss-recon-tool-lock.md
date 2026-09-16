# ENTITY RESOLUTION — DSS Recon Tool Lock

Date: 2026-09-13
Status: **LOCKED — SHARED DSS TOOL CONTRACT**

## Identity

The reconnaissance capability is a shared Data Surveillance System (DSS) tool, not a Q01-specific implementation.

```text
Desktop application: DSS
System abbreviation: DSS // Data Surveillance System
Tool:               Recon
Command:            recon
Canonical usage:    recon -d <domain>
```

## Ownership

```text
DSS / OpsRuntime
    ↓
ReconService
    ↓
ReconProfile
```

The `ReconService` owns target normalization, profile resolution, source sequencing, progress calculations, candidate/unique counters, animation timing, spinner frames, and result streaming.

HackHub command code is an adapter only. It must not own Q01-specific source data or animation timing.

## Profiles

Quest content registers a deterministic `ReconProfile` with the shared `ReconService`.

Q01 currently registers profile `q01` with:

```text
Target root:
skynet-logistics.idx

Accepted equivalent host:
www.skynet-logistics.idx

Sources: 5
Candidates: 8
Unique hosts: 4
```

Q01 result order is:

```text
portal.skynet-logistics.idx
security.skynet-logistics.idx
status.skynet-logistics.idx
www.skynet-logistics.idx
```

Future quests may register additional recon profiles without adding quest-specific command implementations.

## Fallback For Unregistered Targets (amended 2026-09-13)

A target with no registered `ReconProfile` no longer fails outright. `ReconService.run()` resolves in this order:

```text
1. Curated ReconProfile (exact target match, e.g. Q01)
2. Native subfinder (Shell.exec + Subfinder.Results, 6s timeout, best-effort)
3. Deterministic synthetic subdomain generator (always succeeds)
```

The native path was live-tested and did not return real subfinder data when
triggered from the DSS Desktop App's export boundary (see
[dss-toolkit-expansion.md](dss-toolkit-expansion.md) for the finding); the
code remains in place as a best-effort attempt with a safe fallback, since a
future SDK version or a different trigger boundary may make it work. The
synthetic generator is deterministic (same target always yields the same
hosts) and is implemented in `src/domain/recon/recon.ts` as
`synthesizeGenericReconProfile`. Curated profiles always take priority over
both fallback tiers, so Q01 (and any future quest profile) is unaffected.

## Presentation

The visible command branding is original DSS branding. Third-party Subfinder branding is not part of the player-facing command **output** — no Subfinder banner, ASCII art, or third-party tool identity is ever rendered.

Amended 2026-09-13: `subfinder -d <domain>` is now also accepted as a Terminal+
input alias (a familiar name players may type or pick from the "/" command
picker), rewritten to `recon` before dispatch in
`src/infrastructure/hackhub/dss-command-runtime.ts`. This does not reintroduce
third-party branding: the alias only changes what the player may type, not
what renders — output, animation, and the canonical runtime command remain
`recon`/DSS-original throughout.

Shared animation configuration lives in `ReconService`:

```text
sourceDurationMs: 1000
resultDelayMs:    90
spinnerFrames:    braille frame sequence
progressBarWidth: 24
```

The command adapter renders discrete source events. It does not call `CommandTools.clear()` and does not emit ANSI control sequences.

This preserves the player's native HackHub terminal history.

## Service / Presentation Separation

```text
ReconService
    ├── ReconStartedEvent
    ├── ReconProgress
    ├── ReconResult
    └── animation configuration

ReconCommand
    └── maps service events to HackHub terminal output

Future ReconView
    └── consumes the same service contract for DSS desktop UI
```

The same recon behavior can therefore be surfaced in Terminal+, the DSS desktop application, or future quest-specific views without duplicating scan logic or animation timing.

## Final Disposition

`ReconService` is the canonical reusable reconnaissance capability for ENTITY RESOLUTION. Q01 is one profile consumer, not the owner of the tool.
