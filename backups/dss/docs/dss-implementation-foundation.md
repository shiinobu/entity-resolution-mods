# ENTITY RESOLUTION — DSS Implementation Foundation

Date: 2026-09-13
Status: **IMPLEMENTED — TERMINAL+ AND RECON LIVE-VALIDATED; WIRESHARK+ LIVE VALIDATION PENDING**

> Amendment (2026-09-13): see [dss-toolkit-expansion.md](dss-toolkit-expansion.md) for the
> Wireshark+ launch, the Terminal+ UX overhaul, and the Recon native/synthetic fallback chain
> that supersede parts of this document (marked inline below).

## Scope

This document records the first implementation slice of the locked DSS desktop architecture.

The implemented foundation establishes:

```text
DSS Desktop App
    ↓
OpsRuntime
    ├── OpsCommandRegistry
    ├── OpsCommandRouter
    ├── OpsEventBus
    ├── ReconService
    ├── OpsSessionStore
    └── OpsToolRegistry
          ↓
    HackHub adapters / UI
```

## Desktop Application

Canonical identity:

```text
AppName: dss
Title: DSS
Brand: DSS // Data Surveillance System
```

The app is a single HackHub Desktop App with a left tool navigator and active workspace.

Initial navigator entries:

```text
Terminal+   FOUNDATION (command surface substantially implemented — see amendment)
Recon       READY
Wireshark+  READY (amended 2026-09-13 — was FOUNDATION)
```

`DSS` does not embed or replace native HackHub applications.

## Command Architecture

`OpsCommandRegistry` is the canonical metadata registry for DSS-native commands.

`OpsCommandRouter` is the application-level execution boundary. The first executable command is:

```text
recon -d <domain>
```

The native HackHub `recon` command and the DSS Terminal+ command console both route through the same `OpsRuntime.runRecon()` path.

## Recon Integration

The existing shared `ReconService` remains the sole owner of deterministic reconnaissance behavior and timing.

Amended 2026-09-13: Recon no longer fails for targets outside a registered
`ReconProfile`. Resolution order is curated profile (e.g. Q01) → HackHub's
native `subfinder` command (`Shell.exec` + `Subfinder.Results`, best-effort,
6s timeout) → deterministic synthetic subdomain generator. See
[dss-toolkit-expansion.md](dss-toolkit-expansion.md) for the full rationale
and live-test findings on the native path.

The DSS Desktop App exposes:

```text
getToolCatalog()
getCommandCatalog()
getSession()
startRecon(target)
executeCommand(commandLine)
```

Recon execution emits both internal typed Ops events and HackHub custom events for the HTML surface:

```text
DSS.Recon.Started
DSS.Recon.SourceStarted
DSS.Recon.SourceCompleted
DSS.Recon.HostDiscovered
DSS.Recon.Completed
DSS.Recon.Failed
```

The started event includes the complete source catalog so UI surfaces do not duplicate Q01 source definitions.

## Investigation Session

`OpsSessionStore` is a dedicated application-level context for the operations workspace. It is deliberately separate from quest/narrative state.

Current session fields:

```text
status
target
profileId
totalSources
completedSources
candidatesFound
uniqueHostsFound
discoveredHosts
lastElapsedMs
```

Persistent save ownership is not introduced in this foundation slice. The session is runtime-local until the persistence boundary is explicitly designed.

## Tool Registry

`OpsToolRegistry` is the central initial tool catalog. New DSS tools are added here before exposure through the desktop workspace.

Initial tools:

```text
Terminal+   FOUNDATION (registry label unchanged; command surface expanded — see amendment)
Recon       READY
Wireshark+  READY (amended 2026-09-13 — was FOUNDATION)
```

Each tool definition contains:

```text
id
name
description
status
capability (optional)
```

## Terminal+

`Terminal+` is now a functional DSS command workbench. It has:

```text
command input
command history/output (scrollable, 500-line buffer)
command catalog
Tab autocomplete on command names
"/" command picker (nmap, lynx, subfinder, ping)
native commands: nmap, lynx, ping (Shell.CommandDataMap-backed)
subfinder as a friendly alias that dispatches to recon
shared recon execution
shared DSS recon event stream
Copy-to-clipboard action (Clipboard API with execCommand fallback)
```

Command results render by reading `getLastCommandResult()` directly rather than
relying solely on an SDK event listener, which previously double-delivered or
delayed output. Live-validated 2026-09-13: help, nmap, lynx, ping, Tab, Enter,
and the "/" picker all confirmed working in HackHub.

It does not attempt to embed or clone the native HackHub terminal.

## Wireshark+

`Wireshark+` is implemented. `PacketCaptureService` and `PacketSessionStore`
mirror `ReconService`'s architecture: a deterministic simulated packet capture
between the local host and a target, reusing Recon's discovered hosts as
capture peers when the target matches an already-completed Recon session.

The desktop command is:

```text
wireshark -t <target>
```

exposed through `App.Exports.startCapture(target)` / `getPacketSession()`, with
the same direct-poll UI pattern proven for Recon (not an SDK event listener).

Captures are deterministic investigation fixtures, not a live OS-level packet
sniff — the native HackHub Wireshark application remains independent and is
not wrapped or embedded.

Live desktop validation (opening Wireshark+ in HackHub and confirming a real
capture run) has not yet been performed; do not treat this section as a
live-PASS claim until that is recorded.

## UI Boundary

`src/infrastructure/hackhub/apps/entity-resolution.html` is presentation-only.

It consumes DSS exports and events and does not directly mutate GameRuntime, quests, flags, rewards, or narrative state.

Recon animations and progress transitions run in the HTML workspace, while the deterministic scan behavior remains in `ReconService`.

The persistent HackHub terminal is not cleared, and no ANSI cursor-control sequence is used by DSS.

## Validation Requirements

Before promoting this foundation beyond development:

```text
npm run typecheck
npm test
npm run build
        ↓
Open DSS from HackHub desktop
        ↓
Verify navigator and workspace rendering
        ↓
Run Recon from the DSS UI
        ↓
Verify source-by-source progress
        ↓
Verify four Q01 hosts
        ↓
Run recon from Terminal+
        ↓
Verify identical shared results
        ↓
Verify native terminal history remains unaffected
```

## Next Slice

Wireshark+ (this section's original next slice) is implemented — see the
amended Wireshark+ section above. The next open items are:

```text
Live-validate Wireshark+ capture in HackHub
Formally lock Terminal+ (live-validated, not yet given a LOCKED status doc)
Resume the Q01 production live-validation gate (docs/phase13-q01-final-lock.md)
```
