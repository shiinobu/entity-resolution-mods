# ENTITY RESOLUTION — Project Changelog

Chronological record of everything that happens in this project — the
mandatory timeline. **Every real change** (a bug found/fixed, a mechanic
changed, an email/domain rule changed, a doc reorganized, a quest passing
validation, etc.) gets a dated one-line entry here, no matter how small,
under that day's heading (add one if it doesn't exist yet).

Full detail lives in the specialized file for that kind of change, never
duplicated here — this file is an index, not the source of truth. Entries
from 2026-09-17 and earlier predate this rule and stay as free-form
paragraphs (historical, not reformatted). **From 2026-09-18 onward, use:**

```text
- [category] short description — see file.md (detail pointer)
```

Categories: `bug`, `mechanic`, `email`, `docs`, `milestone`, or a new one if
none fit. Full detail: `docs/source-original.md`/`source-current.md` (story/
design), `docs/bugs.md` (bugs), `docs/email-rules.md` (email/domain rules),
`docs/mechanics-reference.md` (tools/commands), `docs/implementation-rules.md`
(process/structure standards), `docs/implementation-notes.md` (forward notes
for unbuilt quests).

---

## 2026-09-11

- **Phase 12 (HackHub runtime integration) locked.** Full validation matrix
  passed in-game: bootstrap, quest registration, `Terminal.Command`-based
  nmap integration (not the unreliable `Terminal.NmapScan` event),
  SaveStorage, Access/Reward/Economy/Ending services, full regression
  (115/115). Production bootstrap isolated from diagnostic harnesses; prod
  permissions trimmed to only what's actually used.
- **Phase 1–12 cross-phase provenance audit.** Reconciled four exported
  design-conversation sources against repo history — confirmed Phases 1–8
  (story/design) and Phase 9–12 (runtime architecture) were genuinely
  locked, correcting an earlier audit that had overstated how much detailed
  narrative content was actually missing. Remaining gap at the time: full
  Q01–Q13/Q16 detailed narrative recovery (closed per-quest afterward — see
  `docs/source-current.md`).
- **Phase 13 sequential-campaign-lock adopted.** Quests must be built in
  strict `Q01→Q16` order; a quest may not skip its dependency to get tested
  early. This retroactively **discarded an earlier Q14 implementation
  attempt** (Steps 13.2–13.6 below) that had jumped ahead of Q01–Q13 —
  recoverable from git history, but not the source of truth for Q14
  anymore (current Q14 skeleton uses the later LOCKED docx spec instead;
  see `docs/source-current.md`).
- **Early Q14/Q15 implementation exploration (Steps 13.2–13.6, later
  discarded per the rule above).** Mapped Q14/Q15 onto the runtime,
  resolving 2 of 3 open objective-completion gaps (Q14 Obj03 →
  `marcus_access_approval_confirmed`, Obj06 → `operator_identity_unknown`;
  Q15 Obj04 stayed unresolved), added an `optional` objective flag to the
  quest-completion contract, registered a production Q14 adapter with a
  file-based evidence tree, and drafted a 12-point live-validation matrix.
  Never live-tested before the sequential-lock rule shelved it entirely.

## 2026-09-12

- **Repository cleanup pass.** Removed obsolete SSH diagnostic scripts made
  irrelevant once Q01 dropped native SSH as an acceptance mechanism (see
  `docs/bugs.md` entry 2), removed redundant `.gitkeep` files, confirmed
  the `Meridian Logistics` → `Skynet Logistics` rename across active
  source.
- Several Q01 web-discovery design iterations landed and were superseded
  same-day/next-day, ending on the dirhunter-based final design (full
  history no longer kept — see `docs/bugs.md`'s reorg note).

## 2026-09-13

- **Q01 — THE CONTRACT passed live validation.** Full detail:
  `docs/source-current.md`.

## 2026-09-14

- **Q02 — THE ANOMALY passed live validation**, plus a post-PASS
  stabilization round (`Mail.unregisterTemplate`/`Mail.send` bugs — see
  `docs/bugs.md` entries 7–8). Full detail: `docs/source-current.md`.

## 2026-09-15

- **Q03 — MISSING LOGS passed live validation**, including the
  `Dialog.onEnd`/`onSelect` investigation and several `Files.*`/`Terminal.*`
  findings (`docs/bugs.md` entries 1, 5, 6, 13–16). Full detail:
  `docs/source-current.md`.

## 2026-09-16

- DSS desktop app/ops layer archived to `backup-dss/` (unused since Q01's
  dirhunter redesign — see `docs/bugs.md` entry 2's history).
- `hackhub-content-sdk` bumped `^0.21.0` → `^0.24.0`.
- Q04–Q16 bulk-scaffolded (`content/qNN.ts` + quest/replay stubs) ahead of
  their turn in the sequential build order — see `docs/source-current.md`
  for what's actually in each.

## 2026-09-17

- **Q03 SSH-credential-delivery redesign**: mail attachment + custom
  `crackhash` command, replacing the abandoned native `hydra`/`john`
  approach (`docs/bugs.md` entry 3).
- **`isDev` flag unification**: the whole `dev/` replay-quest system
  (duplicate quest classes for dev testing) removed project-wide, replaced
  by a single `isDev` boolean in `src/content/dev-flag.ts` used directly in
  each quest's production file.
- **Test suite reorganized**: engine/domain tests moved to `tests/engine/`
  (excluded from the default fast `npm test` run, still covered by
  `npm run test:all`); per-quest test files consolidated one-per-quest.
- **`docs/` reorganized**: ~40 flat, inconsistently-named `phaseNN-*` files
  (a holdover from when this project was designed in an external AI chat
  tool before development moved to this repo/toolchain) collapsed into
  `docs/source-original.md`, `docs/source-current.md`, `docs/bugs.md`,
  `docs/implementation-notes.md`, and this changelog — full superseded files
  deleted outright rather than kept as dead weight.
- The three surviving reference docs renamed off their old prefixes:
  `phase13-quest-structure-standard.md` → `docs/implementation-rules.md`,
  `hacking-tools-reference.md` → `docs/mechanics-reference.md`,
  `email-character-contract.md` → `docs/email-rules.md`.
  `implementation-rules.md` §1/2/7/8 rewritten where they still described
  the removed dev/replay-file system.
- `docs/source-current.md`'s Q03 section had gone stale — it predated the
  credential-delivery redesign earlier this same day and was missing the
  `findAccess` objective, the mail-attachment mechanism, and the new SSH
  password entirely. Fixed by cross-checking directly against
  `src/content/q03.ts`.
- **`docs/changelog.md` promoted to a mandatory timeline**: every real
  change (bug, mechanic, email rule, docs, milestone) now needs a dated
  entry here, not just quest-PASS milestones — format defined at the top
  of this file, effective for entries from 2026-09-18 onward.
- **Dead code removed**: `src/domain/recon/`, `src/domain/packet/`, and
  the unused `Q01_RECON_INPUT*`/`Q01_RECON_RESULT`/`Q01_SUBFINDER_RESULT`/
  `Q01_RECON_PROFILE` constants in `content/q01.ts` (leftover from Q01's
  pre-`dirhunter` DSS-recon design; confirmed dead against both a
  repo-wide usage grep and the original Phase 9 SDK design document,
  which never mentions "recon" or "packet" at all). `tests/q01.test.ts`
  updated to drop the test coverage that existed only for these dead
  constants. Typecheck and `npm run test:all` (230/230) both clean
  afterward. Two stale doc-reference comments also fixed in
  `src/content/flags.ts` and `src/infrastructure/hackhub/commands/q03-log-tools.ts`
  that survived the earlier doc-reorg `sed` passes (one split across two
  comment lines, one pointing at an already-consolidated test file).
- **New `docs/architecture.md`**: documents `src/`'s engineering layering
  (core/domain/state/application/infrastructure/content), ownership
  boundaries, and bootstrap flow — nothing previously explained the
  codebase's architecture as a whole. Written after two audit passes: one
  confirming what's actually used vs dead (the recon/packet cleanup above),
  one checking for redundancy/inconsistency across all 16 quests' content
  and quest-adapter files. Only concrete finding from the second pass:
  `src/infrastructure/hackhub/q03-quest.ts` is 834 lines, over the
  project's own 800-line soft ceiling — flagged as a split candidate, not
  yet acted on.
- **New `docs/blueprint-vs-built.html`**: a standalone reference page
  comparing three architectures using Q03's real code as the test case —
  the original Phase 9 SDK blueprint (sketch), a full fictional
  implementation of that blueprint using its real quoted interfaces
  (`QuestDefinition`, `QuestService`, `EventBus`, etc., fake `QX` quest
  data), and the architecture that actually shipped Q01-Q03. Conclusion:
  keep the current architecture — already proven, and the blueprint's
  `EventBus`/`quests/` gaps don't disappear even in a full implementation.
- **`q03-quest.ts` split (834 → 692 lines)**: the phone-call `Dialog` tree
  (pure narrative data, ~130 lines) moved to `content/q03.ts` as
  `Q03_DIALOG`, and the `withDialogLineReadTap` SDK-bug-workaround Proxy
  (~25 lines, not Q03-specific) moved to a new shared
  `infrastructure/hackhub/dialog-utils.ts` for reuse by every future
  dialogue quest (Q08, Q09, Q11-Q16). `implementation-rules.md` §1 updated
  so this doesn't get missed again. One test (`tests/q03.test.ts`'s
  never-say-"deleted" narrative-constraint check) had to be narrowed to
  exclude the `Q03_DIALOG` block, since it now legitimately contains the
  player's own rejected theory ("I think someone removed the logs.") —
  typecheck clean, 230/230 tests pass.
- **Deduplicated repetitive `gameRuntime.reward.claim({id, kind, amount})`
  calls in Q01/Q02/Q03's `OnComplete`**: each quest's reward block had
  4-7 near-identical calls differing only in the id suffix and amount.
  Replaced with one small local `claimXp(suffix, amount)` closure per
  quest file (not shared across quests — the id-prefix convention only
  needs to hold within one quest). Q01 470 lines, Q02 443 lines, Q03 671
  lines (down from 480/463/692). Behavior unchanged — same ids, same
  amounts, same order; typecheck clean, 230/230 tests pass. The `isDev`
  checks were reviewed too and left as-is: exactly the three gates
  `implementation-rules.md` §7 specifies (`QuestsToComplete`,
  `applyDevGating`, the reward block), not actually duplicated.
- **Q03 FINAL LOCK comment/console.log cleanup**: every comment and
  `console.log` call in `content/q03.ts`, `content/q03-filesystem.ts`,
  `infrastructure/hackhub/q03-quest.ts`, and the five
  `infrastructure/hackhub/commands/q03-*.ts` files was audited, then
  removed — the code is now fully comment-free. Nothing was lost: 7 new
  `bugs.md` entries (18-24, plus an amendment to entry 9) and 2 new
  `source-current.md` paragraphs captured everything genuinely useful that
  a stripped comment used to explain. One real bug caught mid-cleanup: a
  file rewrite briefly replaced the U+00A0 non-breaking-space characters
  `renderAsciiTable`/`formatSearchMatches` depend on (bugs.md entry 10)
  with plain spaces, breaking 3 tests — restored, 230/230 pass again. Also
  removed Q03's `withDialogLineReadTap` Proxy wrapper from its shipped
  `Dialog` field — it was diagnostic-only (not part of the actual
  `onEnd`/`onSelect` fix, bugs.md entry 1) and the utility itself stays in
  `dialog-utils.ts` for future dialogue quests. New mandatory rules written
  into `implementation-rules.md` §11 (strip comments to permanent docs once
  a quest reaches FINAL LOCK) and §12 (all future diagnostic tracing goes
  through `infrastructure/hackhub/logger.ts`'s `trace()`, never raw
  `console.log`) — applies going forward to Q04-Q16, not retroactively to
  Q01/Q02.
- **Q04 (LEAVE IT ALONE) implemented and reached FINAL LOCK.** All 4
  mandatory + 1 hidden-optional objective wired: `reviewDecommissionNotice`,
  `verifyServerStatus`, `closeAudit` (dual GoMail templates — one
  fields-less for close-as-requested, one with a required `note` field for
  add-a-note, after two rounds of live-testing found a declared template
  field must have a `{{placeholder}}` and can't be left optional — bugs.md
  30/31), `decideOnEvidence` (3-way dialog choice), optional
  `checkLastConnection`. New feature added on request: `Abandonable = true`
  (first quest in this codebase to expose the native Abandon Quest action).
  Fixed a shared-engine bug along the way affecting every quest, not just
  Q04: `QuestService.start()` no longer throws on a stale `completedQuestIds`/
  `failedQuestIds` entry left over from `mods.reset` not clearing this
  mod's own `SaveStorage` (bugs.md 29; full `test:all`, 260/260, run since
  it's shared code).
- **"Unknown" relay hook built as a `Desktop.addWidget` popup**, not a
  mail — a terminal-styled, letter-by-letter-typed window from
  `unknown@unknown.x` (the anonymous identity in `characters.ts`,
  deliberately not the ARKA-OPS-0441 technical id that belongs to Q16's
  reveal), paired with `UI.notify()` since `Desktop.addWidget` has no
  z-order/focus control at all (bugs.md 34). Getting it working live
  surfaced two real SDK bugs: a nested `src` path matching where the
  build script actually copies the file still doesn't resolve — widget
  content has to live in `public/widgets/`, flat, matching the SDK's own
  doc example (bugs.md 32); and `Desktop.addWidget()` silently loses the
  SDK's mod-attribution when called from inside a `Dialog.onEnd` callback,
  confirmed by elimination against `Mail.Sent` and `Scheduler` callbacks
  which don't have the problem (bugs.md 33) — worked around by bouncing
  through a second near-zero-delay `Scheduler` job instead of calling
  directly from `onEnd`. Quest completion for the two immediate-choice
  branches now waits for the widget to actually close (~20s) instead of
  firing the instant the dialog ends, so the player sees the full hook
  before the quest visibly finishes.
- **Q03 reopened once more, narrowly, for a pacing fix**: `receiveReportCallback`
  called `createDialog` directly off the 1-day `reportCallback` Scheduler
  job, popping Adrian's call while the native "Wait" screen transition
  (after using Wait to skip the delay) was still fading back in. Added a
  5-second real-time settle via a plain `setTimeout` before opening the
  dialog — confirmed safe because this call site was never observed to
  lose `modId` (that issue is specific to `Dialog.onEnd`, not to
  Scheduler-triggered code calling `createDialog()` itself). The
  identical fix, same 5s delay, applied to Q04's own
  `receiveCloseAuditCallback` for consistency.
- **Both of Q04's `OnStart` mail bodies rewritten** after reviewing 4
  drafted variants of each: Adrian's informal heads-up now carries a hint
  of unease; the formal client notice became an actual letter (letterhead
  "Skynet Logistics / IT Operations", salutation, body, signature block
  "IT Operations Division"), subject changed to "Confirmation of
  Scheduled Decommission: edge-03". `dev-flag.ts`'s `DEV_FOCUS_QUEST.q04`
  set back to `false` now that Q04 is FINAL LOCK, matching Q01-Q03; every
  entry is `false` until Q05 becomes the active target. Full `test:all`
  clean (262/262) at FINAL LOCK.
