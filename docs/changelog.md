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
