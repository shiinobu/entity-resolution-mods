# ENTITY RESOLUTION — Desktop Operations Architecture Lock

Date: 2026-09-13
Status: **LOCKED — ARCHITECTURE DECISION**

## 1. Product Identity

The ENTITY RESOLUTION custom desktop application is named:

```text
DSS
```

`DSS` is the canonical abbreviation for **Data Surveillance System** (amended 2026-09-13, was "Dead Signal System") and is the primary desktop title, matching the shipped implementation.

Recommended identifiers:

```text
AppName: dss
Title: DSS
Brand label: DSS // Data Surveillance System
```

`DSS` is the canonical in-game, player-facing app name. It is intentionally decoupled from the mod's own outer title (ENTITY RESOLUTION) — an in-fiction tool does not need to share its parent product's marketing name.

## 2. Application Model

`DSS` is one HackHub Desktop App containing a custom ENTITY RESOLUTION operations workspace.

It is not a clone of HackHub's whole desktop environment and it does not embed or replace native HackHub applications.

The application owns its own presentation layer and tool workspace while using HackHub SDK APIs through explicit adapters.

## 3. UX Model

The canonical layout is:

```text
┌──────────────────────────────────────────────────────────────┐
│ DSS                                      _ □ ×      │
├────────────────┬─────────────────────────────────────────────┤
│ TOOLS          │                                             │
│                │              ACTIVE WORKSPACE               │
│ Terminal+      │                                             │
│ Wireshark+     │                                             │
│ Recon          │                                             │
│                │                                             │
│─────────────── │                                             │
│ SESSION        │                                             │
│ Target         │                                             │
│ IP             │                                             │
│ Hosts          │                                             │
│ Evidence       │                                             │
└────────────────┴─────────────────────────────────────────────┘
```

The canonical navigation pattern is **left tool navigator + active workspace**, not browser-style tabs as the primary interaction model.

## 4. Runtime Boundary

```text
DSS UI
      ↓
OpsRuntime
      ├── CommandRegistry
      ├── ToolRegistry
      ├── InvestigationSession
      ├── Findings / Evidence
      └── EventBus
            ↓
      HackHub Adapters
      ├── Shell
      ├── Network
      ├── Events
      └── Storage
```

Presentation must not own game-state mutation.

Game quest/narrative/capability state remains owned by the existing ENTITY RESOLUTION runtime. OPS consumes capabilities and publishes meaningful findings/events through the established runtime boundary.

## 5. Terminal+

`Terminal+` is an ENTITY RESOLUTION workbench, not an embedded clone of HackHub's native terminal.

It owns its own command presentation and can expose ENTITY RESOLUTION commands through `CommandRegistry`.

Native HackHub commands may be integrated through adapters where the SDK supports the required behavior, but native command stdout must not be assumed to be capturable into the OPS UI.

The native HackHub terminal remains an independent application.

## 6. Wireshark+

`Wireshark+` is an ENTITY RESOLUTION forensic packet-analysis workspace implemented as our own HTML/UI surface.

It is not a wrapper or embedded copy of HackHub's native Wireshark.

Its data source is `PacketCaptureService` / investigation state and supported HackHub network/event APIs.

## 7. Recon Tool

The Q01 command previously named `subfinders` is renamed to the original ENTITY RESOLUTION command:

```text
recon
```

Canonical invocation:

```text
recon -d https://www.skynet-logistics.idx/
```

`recon` is intentionally broader than the Q01 implementation name. In Q01 it performs deterministic subdomain reconnaissance; future ENTITY RESOLUTION tools may extend the same command family without exposing third-party product branding to the player.

The prior command name `subfinders` is not part of the canonical ENTITY RESOLUTION command vocabulary after this lock.

## 8. Tool Services

Each tool separates behavior from presentation:

```text
ReconService
ReconCommand
ReconView

PacketCaptureService
WiresharkView

TerminalCommandRouter
TerminalView
```

Services own domain/tool behavior and deterministic fixtures. Views own HTML/UI rendering. Commands are entry points and orchestration adapters.

## 9. Investigation Session

OPS maintains a dedicated investigation context containing information such as:

```text
target
ip
discoveredHosts
openPorts
findings
packets
evidenceIds
```

The session is separate from quest/narrative state.

Meaningful discoveries can be promoted into the existing ENTITY RESOLUTION evidence/state pipeline through explicit services/events.

## 10. Capability and Progression

Tool availability is capability-driven.

Examples:

```text
terminal.basic
tool.recon
tool.wireshark
```

Quest progression grants capabilities through the existing access/capability architecture; OPS must not hard-code Q01-specific quest checks into its presentation layer.

## 11. Persistence and Events

OPS may use the supported HackHub storage/state facilities for investigation context, with the appropriate session/persistent boundary.

Internal tool events follow a structured model such as:

```text
ToolStarted
ToolProgress
ToolCompleted
FindingDiscovered
HostDiscovered
PortDiscovered
PacketCaptured
EvidenceCreated
```

## 12. Native HackHub Constraints

The architecture explicitly accepts these SDK 0.21.0 boundaries:

- Desktop App registration is supported.
- HTML/CSS/JS application UI is supported.
- Custom terminal commands are supported.
- Events, Shell, Network and storage APIs are available.
- Native terminal output is not exposed as a general stdout stream for arbitrary embedding.
- Public Desktop APIs do not establish a programmatic native-terminal/window-launch contract.
- Native Wireshark is not treated as an embeddable API surface.

Therefore OPS does not depend on hidden/internal launch APIs or native-app embedding behavior.

## 13. Non-Goals

The following are explicitly out of scope for this architecture:

- cloning the complete HackHub desktop shell;
- replacing the native HackHub Terminal globally;
- embedding the native HackHub Wireshark implementation;
- using `CommandTools.clear()` inside the persistent player terminal for animation;
- depending on ANSI cursor control for terminal animation;
- executing real third-party network enumeration for deterministic quest content;
- programmatically spawning a second native HackHub terminal without a documented API.

## 14. Locked Decision

The ENTITY RESOLUTION desktop architecture is therefore:

**`DSS` single Desktop App + left navigator + independent ENTITY RESOLUTION tool workspaces + OpsRuntime + explicit HackHub adapters.**

Initial tools:

```text
Terminal+
Wireshark+
Recon
```

Q01's existing deterministic four-host enumeration remains unchanged at the data level. Only its player-facing tool identity moves from `subfinders` to `recon`.

Future tools must follow the same registry/service/view/capability boundaries unless this lock is explicitly revised.
