# ENTITY RESOLUTION — Implementation Notes (Q04–Q16, not yet built)

Forward-reference notes for quests still ahead in the sequential build order
(`Q01→Q02→...→Q16`, no skipping). Not bugs (see `docs/bugs.md`), not story
content (see `docs/source-current.md`) — this is "things to remember when
you get there."

## Status as of 2026-09-17

Q04–Q16 are structural skeletons only: `content/qNN.ts` (objectives,
rewards, flags — and for Q05/Q14/Q15, real mail/dialogue text already
sourced), a single `infrastructure/hackhub/qNN-quest.ts` stub (per the
`isDev` pattern in `docs/implementation-rules.md` §7 — no separate replay
file), and supporting filesystem/website/command files where a quest needs
them. No event-handler logic (`OnStart`/`OnObjectivesStart`/`OnComplete`/
`OnAbandon`) exists yet, none are registered in `src/index.ts`, and none of
this has been typechecked/tested/built as real implementation — it's
scaffolding, not working code.

Real dialogue exists for Q08, Q09, Q11, Q12, Q13, Q14, Q15, Q16. Real mail
exists for Q04, Q05, Q06, Q07, Q08, Q14. Q04–Q07 have no scripted dialogue
in the source at all (confirmed deliberate, not a gap).

## System mapping reminders (apply to any future quest, not just Q04–Q16)

- **Relay** (private messaging in the source's story bible) → `Mail`. Full
  rationale: `docs/implementation-rules.md` §0.
- **Phone** → the `Dialog`/`createDialog()` mechanic Q03 already uses
  (`switchBranch`/`isEnd` only — see `docs/bugs.md` entry 1).
- **Pulse** (the story's public social-feed system) → native **`Twotter`**,
  not `Kisscord` (which is private 1:1 chat). Used by Q05, Q06, Q09, and
  explicitly *not* used by Q16 (`Q16_PULSE_USED_FOR_ENDING = false`).

## Open character question: Elena Brooks

Elena Brooks is confirmed as a real, locked character (Phase 8 marks her
integration "RESOLVED"), and she's already added to
`src/content/characters.ts` — but **no source checked so far says which
quest she actually appears in**. Do not assign her to a quest without new
source evidence; don't guess just to give her something to do.

## Q13/Q14 dependency and mapping notes

**Blocker: Q14 needs Q13, which doesn't exist yet.** Q14's
`QuestsToComplete = ["entity_resolution.q13"]` can't be satisfied until Q13
has a real implementation — until then Q14 stays unreachable/undiscoverable
(it also has no `HackhubPost` yet). Build order: Q13 → validate its
completion → add Q14's `HackhubPost` → resume Q14 live validation. Don't
reconstruct Q13 from Q14/Q15 or runtime inference — the available Phase 8
export gives Q13's identity/XP (150 max, 135 base + 15 optional, operator
must stay unknown) but no full objective-by-objective spec the way Q14/Q15
got.

**Source-to-state mapping** (superseding an earlier, more tentative pass):

- Q14 Objective 03 (FIND THE AUTHORIZATION) → completion key
  `entity_resolution.q14.marcus_access_approval_confirmed`.
- Q14 Objective 06 (ASK ABOUT THE SESSION) → completion key
  `entity_resolution.q14.operator_identity_unknown`.
- Q14 Objective 07 (CHECK THE ACCESS JUSTIFICATION) is optional, +20 XP.
- **Open gap:** Q15 Objective 04 (RECONSTRUCT THE SESSION) has no unique
  completion key distinct from `entity_resolution.q15.operator_session_found`
  (used by Objective 02) — needs an explicit decision when Q15 is built, not
  a silent reuse.

**Correct live-test order for Q14's optional path.** Q14 uses `this.Events`
scoped to the quest, which HackHub auto-cleans on completion/abandon — so
the optional access-justification file listener (`Files.Open` on
`AR-44192-justification.txt`) stops working once Q14 completes. Test the
optional path *before* finishing Q14: finish the required objectives up to
the last one → open the justification file (sets `exception_access_found`,
grants the optional XP) → *then* finish the final objective → completion.
Skipping the file and completing without it is the valid non-optional path.

Also note: Q14/Q15 use **local `Files.*` access only, no SSH/network
target** — see the "Changes from original source" table for Q14/Q15 in
`docs/source-current.md` for why (an authorized forensic export, not a
remote host to breach).
