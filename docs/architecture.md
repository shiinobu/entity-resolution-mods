# ENTITY RESOLUTION — `src/` Architecture

This documents the engineering architecture of the mod's codebase — layers,
ownership boundaries, and the bootstrap/runtime wiring. For quest content
(story, objectives, rewards) see `docs/source-current.md`; for the mandatory
patterns quest files must follow, see `docs/implementation-rules.md`. This
file is about the engine underneath both of those.

## Layering

```text
core/           — shared kernel: branded IDs, Result<T,E>, domain events
domain/         — business entities + their state shape, per concern
state/          — canonical state ownership, persistence, flags
application/    — services that orchestrate domain + state
infrastructure/ — HackHub SDK adapters (the only layer that imports the SDK)
content/        — per-quest data (the actual story/numbers)
index.ts        — production bootstrap: which quests are actually active
```

Dependency direction is one-way: `infrastructure` → `application` →
`domain`/`state` → `core`. `content` is consumed by `infrastructure`
(quest files import their matching `content/qNN.ts`) and never the reverse.
Nothing outside `infrastructure/hackhub/` imports `@hotbunny/hackhub-content-sdk`
directly — that boundary is deliberate (see Phase 12's "production isolation"
lock, `docs/changelog.md` 2026-09-11).

## `core/` — shared kernel

Three tiny files (28/10/3 lines), imported almost everywhere:

- `brand.ts` — branded/nominal ID types (`QuestId`, `EvidenceId`, etc.) so
  e.g. a `CharacterId` can't be accidentally passed where a `QuestId` is
  expected, even though both are strings underneath.
- `domain-event.ts` — the shared domain-event shape.
- `result.ts` — a `Result<T, E>` type used instead of throwing for
  expected-failure business logic (parse/validation failures, not bugs).

## `domain/` — entities and state shapes, no behavior orchestration

18 subfolders (after the 2026-09-17 removal of `recon`/`packet`, confirmed
dead — see `docs/changelog.md`). Standard shape per folder:
`<name>.ts` (entity/value types) + `<name>-state.ts` (that entity's slice of
canonical state) + `index.ts` (barrel). A few folders are intentionally
smaller (`dialogue/`, `narrative/`, `progression/` have no separate entity
file, just state) and `shared/` is a utility module, not an entity, holding
`condition.ts`/`condition-evaluator.ts` (the single canonical condition
representation — `flagEquals`/`all`/`any`/`not`, never a second condition
format) and `flags.ts`.

**Consumption status (as of 2026-09-17, see the `project_src_audit_findings`
memory for the full cross-check against the original design doc):**

| Consumed by a live/scaffolded service or quest today | Not yet consumed — staged for later chapters |
|---|---|
| `quest`, `access`, `economy`, `ending`, `narrative`, `reward`, `dialogue`, `progression`, `shared` | `investigation`, `evidence`, `entity`, `character`, `relationship`, `terminal`, `database`, `hacking` |

The right-hand column is **not dead code** — Q06 onward is the story's own
database/entity-resolution/relationship-graph arc, and these domain models
were built ahead of that per the original Phase 9 SDK plan. Do not
repurpose or delete them; they're waiting for their quest's turn in the
sequential Q01→Q16 build order.

## `state/` — canonical state ownership

```text
StateStore            — the single canonical root state owner (all domain
                         state slices live here, nowhere else)
FlagStore              — typed facade over StateStore.flags
DomainStateAccess       — read/update helper application services use instead
                         of touching StateStore directly
SaveLoadService         — orchestrates save/load through a SaveStorage port
StateSerializer         — canonical-state <-> string
StateValidator          — validates deserialized state before it's trusted
default-state.ts        — createDefaultRuntimeState(): the fresh-game shape
```

`SaveStorage` (in `state/persistence.ts`) is a small interface
(`read()`/`write()`) — HackHub's own save system is just one implementation
of it (`infrastructure/hackhub/save-storage-adapter.ts` — actually wired
via `runtime.ts`'s inline `SaveStorageAdapter`), so canonical state is never
coupled to the SDK's storage API directly. Save/load restores canonical
state; it never replays gameplay events to reconstruct it.

## `application/` — services

One service per domain concern, each taking `DomainStateAccess` (+
`ConditionEvaluator` where it evaluates completion conditions) in its
constructor:

```text
QuestService            — quest lifecycle (start/complete/fail)
AccessService           — capability grant/revoke
RewardService           — XP claim, idempotent
EconomyService          — cash reward/penalty (credit/debit + thin
                          reward()/penalize() wrappers)
NarrativeStateService   — chapter/scene + DialogueState coordination
EndingService           — one-way ending resolution
GameRuntime             — composition root: owns StateStore/FlagStore/
                          DomainStateAccess/ConditionEvaluator/persistence,
                          and instantiates the six services above via
                          createDefaultRuntimeServices() unless a caller
                          injects its own (used by tests)
```

Every mutating method follows the same shape: read the current slice,
check an idempotency/precondition guard, then
`domainState.update((s) => ({...s, [slice]: {...}}))`. This is intentionally
duplicated ~4 times rather than abstracted (each guard is short and the
duplication reads clearly) — flagged once during a 2026-09-17 audit as an
*optional* future extraction (a shared `updateSlice` helper), not a
current problem.

## `infrastructure/hackhub/` — the only SDK-facing layer

```text
runtime.ts               — instantiates the production GameRuntime with a
                            real HackHub SaveStorage adapter
save-storage-adapter.ts   — (see above)
qNN-quest.ts              — one per quest; production adapter, imports its
                            matching content/qNN.ts, wires SDK event
                            listeners to application-service calls
commands/qNN-*.ts         — custom @RegisterCommand terminal commands a
                            quest needs (no native SDK equivalent) —
                            crackhash, filestat, bootlog, zgrep (Q03),
                            netgraph (Q07, scaffolded), chaintrace/timeline
                            (Q15, scaffolded), interventiontrace (Q16,
                            scaffolded)
websites/*.ts + *.html    — Website page registrations + their HTML content
websites/templates/*.html — shared reusable page templates (see
                            docs/implementation-rules.md §9)
```

`q03-quest.ts` is currently **834 lines**, over this project's own 800-line
soft ceiling (next largest is `q01-quest.ts` at 481) — flagged as a
concrete split candidate (e.g. extract the `postReportMain`/`A`/`B`/`C`
dialogue content or the SSH/credential-check handlers), not yet done.

## `content/` — the actual story data

`content/qNN.ts` per quest (plus `qNN-filesystem.ts` for quests with a
file-tree evidence surface — Q03, Q06, Q10-Q15) is pure data: no SDK
imports, no application-service calls. Every quest (Q01-Q16, checked in a
2026-09-17 audit) follows the same declaration order:
`Q0N_OBJECTIVE_IDS` → `Q0N_OBJECTIVES` → `Q0N_REWARDS` →
`Q0N_FINAL_STATE_FLAG` → `Q0N_<TITLE>: Quest`. (Q01/Q02 declare
`FINAL_STATE_FLAG` slightly earlier than the rest — harmless drift on
already-FINAL-LOCK files, not worth touching.) `characters.ts`, `flags.ts`
(campaign-wide, cross-quest flags), and `dev-flag.ts` (the `isDev`
boolean + `applyDevGating()` — see `docs/implementation-rules.md` §7) live
alongside the per-quest files.

## Bootstrap flow

```text
src/index.ts
  imports (side-effect registration, decorator-driven):
    infrastructure/hackhub/commands/q03-*.js
    infrastructure/hackhub/websites/q01-*/q02-*.js
    infrastructure/hackhub/q01-quest.js, q02-quest.js, q03-quest.js
  ↓
  @RegisterModPackage class extends Bootstrap
    OnModPackageLoaded()   -> gameRuntime.persistence.load()
    OnModPackageUnloaded() -> gameRuntime.persistence.save()
  ↓
gameRuntime (infrastructure/hackhub/runtime.ts)
  = new GameRuntime(undefined, undefined, new SaveStorageAdapter())
  -> GameRuntime's constructor builds StateStore/FlagStore/DomainStateAccess/
     ConditionEvaluator/SaveLoadService, then the six application services
```

`index.ts`'s import list **is** the single source of truth for which
quest(s) are active in a given build — only Q01-Q03 are imported today.
Adding a quest to production means adding its imports here, in sequential
order, once its own live-validation gate passes (see
`docs/implementation-rules.md` §7 for the `isDev` flag that governs
dependency-gating and reward-granting during that quest's own development
before this step).
