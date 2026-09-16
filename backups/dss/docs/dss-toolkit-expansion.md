# ENTITY RESOLUTION — DSS Toolkit Expansion

Date: 2026-09-13
Status: **IMPLEMENTED — MIXED LIVE VALIDATION (see status table)**

## Scope

This document records a single session's expansion of the DSS toolkit beyond
the Q01-only foundation: Recon generalized to any target, Wireshark+ went
from foundation to a real feature, and Terminal+ gained a full command-line
UX. It amends [dss-implementation-foundation.md](dss-implementation-foundation.md)
and [dss-recon-tool-lock.md](dss-recon-tool-lock.md); read those first for the
locked contracts this expansion builds on.

## 1. Recon: Native Subfinder Attempt, Synthetic Fallback

**Problem.** Recon only ever succeeded for Q01's exact registered target;
any other domain failed with "No reconnaissance profile matched the target."

**What shipped.** `ReconService.run()` now resolves in order: curated
`ReconProfile` (unchanged, Q01 still wins) → native `subfinder` attempt →
deterministic synthetic generator. See `src/domain/recon/recon.ts`
(`synthesizeGenericReconProfile`, `buildReconProfileFromNativeSubdomains`) and
`src/application/ops/recon-service.ts` (`NativeSubdomainResolver` injection
point, `resolveFallbackProfile`).

**Native subfinder finding (live-tested, did not work).** HackHub's native
`subfinder -d <domain>` terminal command produces a much richer, real
word-pair-style subdomain list (e.g. `legal-experience.bcc.com`,
`upset-final.bcc.com`) than anything a mod can author — but it is completely
undocumented for mod invocation. The SDK's `ModEventMap` lists
`Subfinder.Try`/`Subfinder.Results` as listenable events and `Shell.exec()`
can run a command programmatically, so `src/infrastructure/hackhub/native-subfinder-bridge.ts`
tries `Shell.exec('subfinder -d ' + domain)` and listens for
`Subfinder.Results` (6s timeout). **Live test result:** triggered from DSS's
Recon panel, the native path never returned real data — Recon fell through to
the synthetic generator every time, with no visible side effect in the native
terminal either. Working theory (unconfirmed, no devtools access to verify):
`Shell.exec` may only integrate with the terminal/event pipeline when called
from inside an actively running `@RegisterCommand` handler, not from a
Desktop App's `Exports` boundary. The bridge code is kept as a harmless
best-effort attempt — it costs one 6s timeout on cache-miss targets and always
falls through safely — but should not be assumed to work.

**Synthetic generator.** Deterministic FNV-1a-style hash of the target
hostname selects 3–6 subdomains from a fixed prefix pool (www, mail, api,
admin, portal, status, dev, staging, vpn, cdn, blog, shop, support, beta,
internal), distributed across the same 5-source animation pipeline Q01 uses.
Same target always produces the same result (tested in
`tests/recon-service.test.ts`).

## 2. Terminal+ UX Overhaul

**Problem.** Terminal+ had no keyboard affordances (Tab, command palette),
`nmap` fabricated fake port data for unseeded targets, and command output
relied solely on an SDK event listener that sometimes double-delivered or
delayed messages (the same class of unreliability documented in the earlier
DSS Recon live-validation saga).

**What shipped** (`src/infrastructure/hackhub/dss-command-runtime.ts`,
`src/infrastructure/hackhub/apps/entity-resolution.ts`, `src/entity-resolution.html`):

- **Enter** runs the current input — unified with the Run button (previously
  two separate execution paths existed and could both fire).
- **Tab** autocompletes the command name against the known vocabulary
  (`help`, `clear`, `recon`, `wireshark`, `nmap`, `lynx`, `ping`, `subfinder`).
- **`/`** opens a command picker (nmap, lynx, subfinder, ping) navigable by
  click or arrow keys + Enter.
- **`ping <ip>`** is a real native command (`Shell.CommandDataMap`-backed,
  same pattern as nmap/lynx). No quest currently seeds ping fixture data —
  "no fixture available" is the correct, honest response until one does.
- **`subfinder -d <domain>`** is a friendly input alias, rewritten to `recon`
  before dispatch (see the amendment in dss-recon-tool-lock.md) — the
  canonical runtime command stays `recon`.
- **`nmap`** now fails honestly ("no fixture available") for unseeded targets
  instead of fabricating a fake `filtered/closed` port table.
- Command results render via `getLastCommandResult()` (a direct, synchronous
  read exposed through `App.Exports`) instead of solely through the
  `DSS.Command.Result` SDK event, which fixed a live-confirmed duplicate-output
  bug (`help` printing its command list twice).
- Terminal output is scrollable (`overflow-y:auto` on `.output`, auto-scroll
  to bottom via `scrollTo()` on new lines) with a 500-line buffer, up from a
  hard 36-line trim with no scrollback.
- A **Copy** button next to the terminal header copies the full transcript via
  the Clipboard API with an `execCommand('copy')` fallback — added because
  the HackHub webview host blocks native text selection/drag-copy in a way
  page-level `user-select: text` could not override (confirmed live).

## 3. Wireshark+ Launch

Previously a placeholder (`status: "foundation"`, zero domain/service code).
Now implemented, mirroring `ReconService`'s architecture:

```text
src/domain/packet/packet.ts              PacketDefinition, synthesizePacketCapture
src/application/ops/packet-capture-service.ts   PacketCaptureService
src/application/ops/packet-session-store.ts     PacketSessionStore
```

`wireshark -t <target>` is a real DSS command (`OpsCommandRouter`,
`dss-command-runtime.ts`'s `captureCommand`), exposed to the desktop UI as
`App.Exports.startCapture(target)` / `getPacketSession()`, using the same
direct-poll pattern proven for Recon rather than an SDK event listener.
Captures reuse Recon's discovered hosts as peers when the target matches an
already-completed Recon session. `OpsToolRegistry`'s `wireshark` entry is now
`status: "ready"` (was `"foundation"`).

Captures are deterministic simulated traffic (same hash-seeded approach as
Recon's synthetic fallback), not a live OS-level packet sniff — consistent
with the existing architecture lock that Wireshark+ is DSS's own forensic
workspace, not a wrapper around HackHub's native Wireshark.

**Live validation: not yet performed.** Do not treat this section as a
live-PASS claim.

## 4. UI Redesign

The desktop app's visual identity moved from a generic cyan/teal dashboard
palette to an amber-phosphor "signal intercept console" — sharp
bracket-cornered panels, a CRT scanline overlay, and glow accents on the
wordmark/progress bar, replacing `--accent:#4fd1c5` (teal) with
`--accent:#ffb400` (amber) throughout `src/entity-resolution.html`. Fonts remain
the existing system monospace stack (`ui-monospace,SFMono-Regular,Menlo,monospace`)
rather than the Google Fonts pairing used in the design preview, since the
production file has no external resource dependencies by design and the
HackHub webview's ability to reliably load a font CDN was not verified.

All layout/sizing/overflow locks from `dss-ui-layout-lock.md` and the
scroll-behavior tests in `tests/dss-recon-scroll.test.ts` /
`tests/dss-html-bridge.test.ts` are unchanged — this was a color and
decoration pass only.

**Live-validated 2026-09-13** (screenshot-confirmed in HackHub).

## Live Validation Status

```text
Recon — curated profile (Q01)              LIVE-VALIDATED (pre-existing, unaffected)
Recon — synthetic fallback                 LIVE-VALIDATED (bcc.com, 3 synthetic hosts)
Recon — native subfinder bridge            LIVE-TESTED, DID NOT WORK (see finding above)
Terminal+ — Tab / Enter / "/" picker       LIVE-VALIDATED
Terminal+ — nmap / lynx / ping / help      LIVE-VALIDATED (no duplicate output)
Terminal+ — scrolling                      LIVE-VALIDATED
Terminal+ — copy button                    LIVE-VALIDATED
Terminal+ — text selection (native)        LIVE-TESTED, DID NOT WORK (webview restriction; copy button is the workaround)
Wireshark+ — packet capture                NOT YET LIVE-TESTED
UI reskin (amber palette)                  LIVE-VALIDATED
```

## Next

```text
Live-validate Wireshark+ in HackHub
Formally lock Terminal+ (functionally proven, no LOCKED status doc yet)
Resume the Q01 production live-validation gate (docs/phase13-q01-final-lock.md)
```
