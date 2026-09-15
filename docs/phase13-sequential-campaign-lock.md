# ENTITY RESOLUTION — Phase 13 Sequential Campaign Execution Lock

Date: 2026-09-11 (Q01 PASS recorded 2026-09-13; Q02 PASS recorded 2026-09-14; Q03 PASS recorded 2026-09-15)
Status: **LOCKED — Q01 PASS, Q02 PASS, Q03 PASS; CURRENT IMPLEMENTATION TARGET Q04**

## Purpose

Phase 13 implementation is executed strictly in canonical campaign order:

```text
Q01 → Q02 → Q03 → Q04 → Q05 → Q06 → Q07 → Q08
→ Q09 → Q10 → Q11 → Q12 → Q13 → Q14 → Q15 → Q16
```

The objective is to validate the real playable campaign incrementally, not to prove isolated downstream content out of order.

## Relationship to Earlier Locks

This lock changes only the implementation execution strategy of Phase 13. It does not change the locked canon or technical contracts from Phases 1–12.

Phase 8 remains the source of truth for Q01–Q16 technical quest behavior, objectives, dependencies, evidence, rewards, XP allocation, state changes, character knowledge, and ending logic.

Phase 9–10 remain the locked SDK/technical architecture baseline. Q01–Q16 use the common SDK/runtime and no quest-specific subsystem engines are introduced.

## Sequential Execution Rule

A quest becomes the active implementation target only after the previous quest has passed its live in-game validation gate.

For every quest `Qn`, the mandatory gate is:

```text
1. Source validation
2. Quest implementation mapping
3. Domain/content implementation
4. Automated unit/contract/integration tests
5. Typecheck
6. Build
7. Production package install in HackHub
8. Focused live in-game validation
9. Persistence/reload validation when applicable
10. Validation result recorded
11. Quest marked PASS/LOCKED
12. Only then advance to Q(n+1)
```

A failed gate blocks progression to the next quest.

## No Dependency Bypass

The production campaign must never bypass a locked prerequisite merely to expose a downstream quest for testing.

```text
Q14 must not bypass Q13.
Q13 must not bypass Q12.
Q12 must not bypass Q11.
```

Development fixtures may be used only in tests and must never become production story state.

## Canon / Runtime Boundary

No implementation may invent missing story semantics merely to make a quest executable.

When a quest's detailed source is incomplete, implementation stops at the source gate and records the exact missing material.

The following remain forbidden:

- new canonical flags created only for implementation convenience;
- alternate condition representations outside `ConditionNode`;
- quest-specific engines such as `Q01Engine` through `Q16Engine`;
- direct canonical state mutation from quest/dialogue/hack code outside the approved service/application ownership boundary;
- dependency bypasses;
- silently converting optional objectives into required objectives.

## Live Validation Policy

The canonical validation target is the real HackHub game path.

A quest is not considered live-validated merely because TypeScript tests pass or the bundle builds successfully.

The intended progression is:

```text
Q01 implementation
    ↓
Q01 live PASS
    ↓
Q02 implementation
    ↓
Q02 live PASS
    ↓
...
    ↓
Q16 live PASS
    ↓
Full Campaign Regression
```

## Previous Q14 Exploration

Q14 was previously implemented as an early downstream slice during Phase 13 exploration. That work was intentionally removed from the active production tree when the sequential strategy was locked. The implementation remains recoverable from Git history.

Q14 must not be reintroduced into the production bootstrap until Q01–Q13 have each passed their live gates.

## Q01 — PASSED (2026-09-13)

```text
Q01 — THE CONTRACT
```

The recovered source defines:

- no prerequisite;
- Jakarta location;
- Adrian Cole as primary character;
- target `203.0.113.42`;
- expected services TCP 22/80/443;
- six player objectives (mail read, nmap, lynx, dirhunter, browse, submit — see `docs/phase13-q01-final-lock.md`);
- `entity_resolution.q01.completed = true` as persistent story state;
- `$200` reward;
- maximum `80 XP`.

The locked Phase 8 XP allocation is:

```text
Complete external audit         35 XP
Network/service enumeration     20 XP
Basic vulnerability assessment  10 XP
Submit correct report           15 XP
Maximum                         80 XP
```

Current production implementation files:

```text
src/content/q01.ts
src/content/index.ts
src/infrastructure/hackhub/q01-quest.ts
src/infrastructure/hackhub/websites/q01-skynet-portal.ts
src/infrastructure/hackhub/commands/q01-subfinder.ts
src/index.ts
manifest.json
```

Q01 has passed its full live in-game validation gate (2026-09-13) — see `docs/phase13-q01-final-lock.md` and `docs/phase13-q01-live-validation.md`. It is now production-locked.

## Q02 — PASSED (2026-09-14)

```text
Q02 — THE ANOMALY (Chapter 1 — GHOST SERVER)
```

Full detailed source was recovered from an exported design conversation on 2026-09-13 (see `docs/phase13-q02-source-recovered.md`), closing the gap noted in `docs/phase13-step13.1-story-source-audit.md`. Q02 defines:

- prerequisite `entity_resolution.q01.completed = true`, enforced via native `QuestsToComplete`;
- five objectives (check target, scan host, identify service, inspect certificate, report anomaly) + one optional DNS-check bonus;
- `entity_resolution.q02.completed = true` as persistent story state;
- `$250` reward, maximum `90 XP`.

Q02 has passed its full live in-game validation gate (2026-09-14), including a post-PASS stabilization round that fixed a `Mail.unregisterTemplate` history-corruption bug and a `Mail.send`-inside-`setTimeout` reliability bug (both also applied to Q01) — see `docs/phase13-q02-source-recovered.md`'s "Post-validation stabilization" section. It is now production-locked.

Current production implementation files:

```text
src/content/q02.ts
src/content/index.ts
src/infrastructure/hackhub/q02-quest.ts
src/infrastructure/hackhub/websites/q02-gateway-portal.ts
src/infrastructure/hackhub/websites/q02-edge-portal.ts
src/index.ts
manifest.json
```

## Q03 — PASSED (2026-09-15)

```text
Q03 — MISSING LOGS
```

Source recovered 2026-09-14 — see `docs/phase13-q03-source-recovered.md`. Player SSHes into `edge-03.skynet-logistics.idx` (203.0.113.77, same host as Q02), browses `/var/log` for a gap in rotated log files, optionally inspects a backup archive for a hidden clue (`policy_id: CRI-07`), then reports findings to Adrian via GoMail — triggering a phone-call reaction with full A/B/C player-choice branching. Feasibility (native `ssh`, `ls`/`cat` against a declarative filesystem tree, and three custom commands — `filestat`/`bootlog`/`zgrep` (renamed from `archgrep` in a post-FINAL-LOCK naming pass) — for the pieces with no native equivalent) was confirmed 2026-09-15 via a throwaway probe mod before production implementation began.

Q03 has passed its full live in-game validation gate (2026-09-15), including a substantial post-validation stabilization round and a subsequent naming/UX polish pass — see `docs/phase13-q03-source-recovered.md`'s "Live-Test Findings (Production Implementation, 2026-09-15)" for the complete list of 10 findings, the most significant being:

- `Employer` (not any `Dialog` field) drives the phone-call caller identity.
- `Dialog` must be a static class field, never reassigned at runtime.
- `onEnd`/`onSelect` are permanently non-functional in this HackHub build — confirmed via an exhaustive elimination across every jump mechanism the SDK exposes and every JS/TS function syntax form, and externally corroborated by an independent community quest-editor tool that avoids both fields entirely. Full bug report filed: `docs/hackhub-dialog-onend-bug-report.md`. `options`/`switchBranch` branching itself works correctly once every function property is removed from the whole `Dialog` object — the source's full A/B/C branching is shipped.
- `createDialog()` reads its entire reachable branch graph eagerly and synchronously at call-setup — confirmed via a `Proxy` experiment — so no dialog-driven "call ended" signal can ever be built from mod code; objective completion runs on a generous fixed delay from call-start instead (imprecise, but the only viable mechanism).
- `AutoComplete` requires every non-optional objective completed via `completeObjective()`, not just the most recent one.
- An Objective 05 false-completion bug, root-caused to `Terminal.Ls` reporting only the listed folder's own name (never child filenames) — fixed via `Files.getById().parent` folder lookup.

Per the recovered campaign design source, Q04-Q16 are expected to use conditional dialogue lines (NPC text varying by already-set flags, chosen at a single `createDialog()` call) rather than Q03's real-time interactive branching — see finding 9 in `docs/phase13-q03-source-recovered.md`. Q03's `onEnd`/`onSelect` limitation is therefore not expected to block future quests.

Post-FINAL-LOCK naming/UX pass (2026-09-15, session discussion — pure
polish on top of the already-passed live validation, no gameplay-logic
change beyond splitting one objective into two independent completions):
the seven objectives are now `accessHost` → `checkLogs` → `checkTimestamp` /
`reviewBootHistory` (split from a single combined objective, each
completing independently) → `checkGatewayLogs` → `checkBackup` (optional) →
`reportFindings`. `archgrep` (a placeholder name with no discovery path)
was renamed to `zgrep` (confirmed live not to collide with any native
command; native `grep`/`zgrep` cannot decompress `.gz` content at all).
`filestat`/`bootlog`/`zgrep` output was reformatted into bordered ASCII
tables (`println()` once per line — it does not interpret embedded `\n` as
separate terminal lines). Live-confirmed 2026-09-15: replayed end to end
with the new objective flow and command names/output — still passes.

Current production implementation files:

```text
src/content/q03.ts
src/content/q03-filesystem.ts
src/content/flags.ts
src/content/index.ts
src/infrastructure/hackhub/q03-quest.ts
src/infrastructure/hackhub/commands/q03-filestat.ts
src/infrastructure/hackhub/commands/q03-bootlog.ts
src/infrastructure/hackhub/commands/q03-zgrep.ts
src/infrastructure/hackhub/commands/q03-log-tools.ts
src/index.ts
manifest.json
```

## Current Target — Q04

Not yet started. Source recovery from the campaign design document (`ChatGPT-Mengenal Website HackHub-20260913-2050.md`) has not begun for Q04.

## Q01 Runtime Notes

HackHub's validated terminal integration uses `Terminal.Command` plus typed `Shell.addCommandData("nmap", ...)`, matching the locked Phase 12 integration boundary rather than relying on the unstable direct `Terminal.NmapScan` path used during earlier diagnostics.

Q01's basic vulnerability objective deliberately does not introduce an unsupported exploit command. The recovered gameplay audit states that Q01 does not require vulnerability exploitation; the submitted audit result therefore closes that assessment stage.

Q01's recovered narrative uses Relay for Adrian's short post-report response. The available HackHub SDK reference exposes Email, but no native Relay API. The implementation preserves the narrative beat through the existing mail channel and treats that substitution as an adapter detail, not a new story-system contract.

## Phase 13 Completion Condition

Phase 13 is complete only when the real campaign has passed live validation in order:

```text
Q01 PASS
Q02 PASS
...
Q16 PASS

and

Full campaign live validation PASS
```

Only after that does the project proceed to Phase 14 full integration/release audit.
