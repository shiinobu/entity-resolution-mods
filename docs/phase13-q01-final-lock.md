# ENTITY RESOLUTION — Q01 Final Lock

Date: 2026-09-13
Status: **FINAL LOCK — LIVE VALIDATION PASSED**

## Lock Scope

This document is the current implementation lock for Q01 after the path-based/dirhunter redesign superseded the earlier subdomain/DSS-recon and subfinders designs. The full live scenario — accept, nmap, lynx, dirhunter, browse the security page, submit the report, quest completion with rewards — has been run end-to-end in the real HackHub client and passed.

The story intent, client, target, canonical completion state, rewards, and non-exploitative assessment boundary remain unchanged from Phase 8 canon. The web discovery model, objective breakdown, and terminal-tool bindings described here supersede every earlier Q01 lock document (`phase13-q01-recon-promotion.md`, `phase13-q01-subfinder-command-lock.md`, `phase13-q01-lynx-subdomain-amendment.md` — all historical/superseded).

## Canonical Identity

```text
ID:            entity_resolution.q01
Title:         THE CONTRACT
Chapter:       01 — GHOST SERVER
Location:      Jakarta
Primary:       Adrian Cole
Prerequisite:  none
Client:        Skynet Logistics
Target:        203.0.113.42
Completion:    audit report submitted
State:         entity_resolution.q01.completed = true
Money:         $200
Maximum XP:    80
```

## Locked Objectives

Q01 has **six** player-facing objectives, each bound to exactly one discovery action:

```text
01 Review audit scope                    (read Adrian's mail)
02 Scan the ip target                    nmap
03 Identify the exposed web presence     lynx
04 Enumerate hidden pages                dirhunter
05 Perform basic vulnerability checks    browse the discovered security page
06 Submit audit report                   mail
```

Objective IDs:

```text
q01.objective.01  reviewScope
q01.objective.02  scanNetwork
q01.objective.03  identifyServices
q01.objective.04  enumeratePaths
q01.objective.05  basicVulnerabilityChecks
q01.objective.06  submitAudit
```

Unlock chain: 01 → 02 → 03 → 04 → 05 → 06 (each objective's `unlocksAfter` is the previous one).

Objectives 02, 03, and 04 each declare `terminalCommand` (`nmap`, `lynx`, `dirhunter` respectively) so the game renders that tool's icon on the objective automatically; none of the three carries a text hint, since the icon already tells the player what to run. Objectives 05 and 06 keep hints (05: "Inspect the authorized security page you discovered."; 06: "Fill in the company, open-port, and url values you discovered.").

## Objective 01 — Mail-Gated (not auto-complete)

Objective 01 does **not** complete automatically when the quest starts. `OnStart()` only sends Adrian's contract mail and sets up the network/domain; it does not call `completeObjective`. Completion requires the native `Mail.Read` event to fire for a message where `from === adrian.cole@phantom-net.void` (updated 2026-09-14 from `entityresolution.lock`, see `docs/email-character-contract.md`) and `subject === "Security Audit — Jakarta"` — i.e. the player must actually open the mail. This gates Objective 02 (nmap) from unlocking until the player has read the brief.

## Locked Service Facts

```text
22/tcp  CLOSE  ssh
80/tcp  CLOSE  http
443/tcp OPEN   https
```

Only HTTPS on port 443 is exposed for the Q01 web flow. Canonical HTTPS URLs omit the explicit `:443`.

## Locked Web Discovery Contract (path-based, single host)

The audited web surface is **one public host** with **four pages**, discovered by path instead of separate subdomains:

```text
Host: www.skynet-logistics.idx

Paths:
/          → public operations homepage
/portal    → 403 FORBIDDEN
/status    → 403 FORBIDDEN
/security  → Q01 audit target
```

All four pages are registered on a single `Website` (`Q01SkynetLogisticsWebsite`, `Host = www.skynet-logistics.idx`) via `Pages: WebsitePageDefinition[]`. The apex hostname (`skynet-logistics.idx`) is not registered as a Website or a live domain; only `www.skynet-logistics.idx` is registered via `Network.registerDomain`.

## Lynx Discovery Contract

The canonical public web identity is discovered from the target IP using the HackHub Shell `lynx` fixture:

```text
lynx 203.0.113.42
```

Compatibility input:

```text
lynx https://203.0.113.42/
```

Expected `lynx` address:

```text
https://www.skynet-logistics.idx/
```

The implementation uses the HackHub SDK's typed `lynx` response shape and `address` field. The `additional` OSINT field (also part of the typed `lynx` response shape) is populated rather than left empty:

```text
Skynet Logistics
Jakarta Operations
Canonical public web host discovered from the target IP.
```

This surfaces under the "Searching web for additional information" section of the native `lynx` renderer. Running `lynx` with the expected address completes Objective 03 (`identifyServices`).

## Dirhunter Contract (native tool — no fixture needed)

Objective 04 (`enumeratePaths`) is completed by the player running HackHub's **real native** `dirhunter` command against the discovered host:

```text
dirhunter https://www.skynet-logistics.idx/
```

Unlike `subfinder`, native `dirhunter` genuinely scans the host's **real registered Website pages** rather than an unrelated internal algorithm — live testing confirmed it returns exactly the four registered paths (`/`, `/portal`, `/status`, `/security`), with no fixture injection required. Q01 listens for the `Terminal.Dirhunter` event (`{ host, results }`) and completes the objective once `host` normalizes to `www.skynet-logistics.idx`; the exact contents of `results` are not validated, since the native tool's output is not under mod control (only that the player targeted the right host).

This fully replaces the two earlier, rejected designs:

- **DSS `ReconService`/`recon -d <domain>`** — required opening the separate Data Surveillance System app; abandoned because it added a whole shared-app dependency where a native command sufficed. The `recon` command and DSS app still exist and work generically, but Q01 no longer depends on them.
- **Custom `subfinders` command** (self-rendered ProjectDiscovery-style banner) — built when native `subfinder` (singular) was confirmed live to return nothing for a fictional domain (`apt-get install subfinder` → `subfinder -d ...` → "No subdomains found"), because `subfinder` is event-driven (`Subfinder.Try`/`Subfinder.Results`, undocumented) rather than fixture-backed. `Q01SubfinderCommand` (registered as `subfinders`, plural, since production rejects a mod command shadowing a native name) is still registered and playable as a standalone tool, but no longer gates any Q01 objective.

## Objective Flow

```text
Read Adrian's mail (Mail.Read)
        ↓
Objective 01 complete
        ↓
nmap 203.0.113.42
        ↓
443/tcp OPEN — https
        ↓
Objective 02 complete
        ↓
lynx 203.0.113.42
        ↓
https://www.skynet-logistics.idx/
        ↓
Objective 03 complete
        ↓
dirhunter https://www.skynet-logistics.idx/
        ↓
/, /portal, /status, /security
        ↓
Objective 04 complete
        ↓
open https://www.skynet-logistics.idx/security over HTTPS
        ↓
Objective 05 complete
        ↓
submit resolved Security Audit — Jakarta report
        ↓
Objective 06 complete → Q01 complete
```

Objective 05 (`basicVulnerabilityChecks`) completes only after Objectives 03 and 04 have both completed and `Browser.Meta` reports:

```text
protocol = https:
hostname = www.skynet-logistics.idx
pathname = /security
```

The actual network model exposes only 443/tcp for HTTPS, so HTTP/80 is outside the accepted audit transport.

## Security-Assessment Boundary

The Q01 assessment remains non-exploitative. The quest does not require:

```text
credential attacks
internal access
data extraction
remote-code execution
SQL injection
SSH access
```

## Character Email Contract

Adrian Cole remains canonical:

```text
character.adrian.cole
adrian.cole@phantom-net.void
```

The incoming email does not expose the web audit URL, company answer, open-port answer, or security-page URL.

## Report Submission Contract

```text
Format report audit:
Subject: Security Audit — Jakarta

Target: <COMPANY>
Open Ports: <PORTS>
Url: <URL>

No critical vulnerabilities identified.
Further internal assessment is recommended.
```

For the canonical Q01 world state, the resolved report is:

```text
Target: Skynet Logistics
Open Ports: 443
Url: https://www.skynet-logistics.idx/security

No critical vulnerabilities identified.
Further internal assessment is recommended.
```

Objective 06 accepts only the exact resolved canonical body, not the literal placeholders. The Objective 06 hint reads: "Fill in the company, open-port, and url values you discovered." — no "Reply to ... with subject ..." prefix, since the recipient/subject are established by Adrian's incoming mail itself.

## Rewards

```text
35 XP  — Complete external audit
20 XP  — Network/service enumeration
10 XP  — Basic vulnerability assessment
15 XP  — Submit correct report
--------------------------------
80 XP total

$200
```

Rewards are granted as a lump sum in `OnComplete()`, not per-objective, so splitting Objective 03/04 out of the old combined "identify/verify" step did not require any change to the four reward categories or the 80 XP / $200 total.

**Bug fixed 2026-09-13 (post-lock):** `EconomyService.applyMissionReward()` only ever updated the mod's own internal `StateStore` ledger — it never called the native HackHub `Bank.transaction()` API, so the $200 reward never actually reached the player's real in-game bank account (in production, not just replay). `OnComplete()` now calls `Bank.transaction({ amount: 200, description: "Security Audit — Jakarta", from: {...} })` guarded by `applyMissionReward()`'s own idempotency return value, so the real bank deposit happens exactly once. XP has no equivalent native API in the SDK, so it remains tracked only in the mod's internal `RewardService`/`StateStore`, same as before. Replay's `OnComplete()` is deliberately untouched — it must not grant production money/XP by design (see `docs/phase13-q01-live-validation.md`).

## Runtime Ownership

No Phase 9–12 ownership boundary changes are introduced.

```text
StateStore            canonical root state
FlagStore             state facade
ConditionNode         canonical condition representation
QuestService          quest lifecycle
NarrativeStateService narrative state
AccessService         capabilities/access
RewardService         XP
EconomyService        cash
EndingService         endings
HackHub adapters      SDK/game integration only
OpsRuntime            DSS tool runtime boundary (generic; Q01 no longer depends on it)
ReconService          shared reconnaissance behavior (generic; Q01 no longer depends on it)
```

## Replay Tooling

The maintained Q01 replay tool remains:

```text
scripts/build-q01-replay.ts
```

`dev/q01-replay-quest.ts` mirrors the production quest's objective structure, Mail.Read gating, dirhunter listener, and report format exactly, so live-testing in replay is representative of production. Replay remains isolated from production state and production rewards.

## Production Validation Status

**LIVE-VALIDATED PASS.** The full gate below was observed in the real HackHub client on 2026-09-13:

```text
build
 ↓
install production/replay package
 ↓
accept Q01
 ↓
read Adrian's mail → Objective 01 complete
 ↓
nmap 203.0.113.42 → verify 22/ssh CLOSE, 80/http CLOSE, 443/https OPEN
 ↓
Objective 02 complete
 ↓
lynx 203.0.113.42 → verify www.skynet-logistics.idx and populated "additional" OSINT section
 ↓
Objective 03 complete
 ↓
dirhunter https://www.skynet-logistics.idx/ → verify exactly /, /portal, /status, /security
 ↓
Objective 04 complete
 ↓
open https://www.skynet-logistics.idx/security over HTTPS
 ↓
Objective 05 complete
 ↓
discover COMPANY, PORTS, and URL; send resolved Security Audit — Jakarta report
 ↓
Objective 06 complete
 ↓
verify Q01 completion + $200 + 80 XP
 ↓
PASS recorded
```

### Live-test history (2026-09-13)

1. **First pass** — nmap and Lynx `address` (public host discovery) both worked; native `subfinder` (singular) returned no data (real native tool, event-driven, no fixture support) and Lynx's `additional` OSINT section was empty (field never populated).
2. **Fix** — reverted subdomain enumeration to a self-contained `subfinders` (plural) command; populated Lynx `additional`.
3. **Second pass** — `subfinders` confirmed working; discussed whether the real native `dirhunter` tool could replace it for a path-based (not subdomain-based) redesign.
4. **Redesign** — collapsed the four subdomains into one host with four paths; wired Objective 04 to the real native `Terminal.Dirhunter` event instead of any custom command. Live test: `dirhunter https://www.skynet-logistics.idx/` returned exactly the four real registered paths — native dirhunter genuinely reads registered Website pages, unlike `subfinder`.
5. **Objective restructure** — split the old combined "scan+identify" nmap step and the old combined "lynx+dirhunter+browse" step into six single-action objectives (see Locked Objectives above), added `terminalCommand` icons for nmap/lynx/dirhunter, removed now-redundant hints on those three.
6. **Report format** — added a `Url:` field to the audit report template/body, citing the discovered `/security` page URL.
7. **Objective 01 gating** — removed the `OnStart()` auto-complete; Objective 01 now requires the player to actually open Adrian's mail (`Mail.Read` event).
8. **Final pass — full PASS.** All six objectives completed in order, report accepted with the new `Url:` field, quest reached MISSION COMPLETE with $200 + 80 XP.

## Final Disposition

**Q01 FINAL IMPLEMENTATION LOCKED — LIVE-VALIDATED PASS.**

The Q01 target is a single-host, path-based web surface (`www.skynet-logistics.idx` with `/`, `/portal`, `/status`, `/security`), discovered through a six-objective chain (mail → nmap → lynx → dirhunter → browse → submit) using exclusively native HackHub terminal tools plus one self-contained fallback command (`subfinders`, no longer required). Per `docs/phase13-sequential-campaign-lock.md`, this PASS unblocks Q02. Further changes to Q01 require explicit change control after this lock.
