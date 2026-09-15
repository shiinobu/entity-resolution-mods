# ENTITY RESOLUTION — Q04–Q16 Skeleton Scaffold (2026-09-16)

Status: **STRUCTURAL SKELETON ONLY — NO GAMEPLAY LOGIC IMPLEMENTED.** None of Q04–Q16 are registered in `src/index.ts`; all stay dormant per the Sequential Execution Rule in `docs/phase13-sequential-campaign-lock.md`. This doc records what this session built and why, so a future session doesn't have to re-derive it.

## Purpose

Ahead of implementing Q04–Q16 one at a time (per the locked sequential rule), this session bulk-scaffolded every quest's `content/qNN.ts`, `infrastructure/hackhub/qNN-quest.ts`, and `dev/qNN-replay-quest.ts`, plus supporting filesystem/website/command files — objective lists, rewards, flags, dialogue, mail, and (for Q14/Q15) full narrative content — so each quest is "fill in the logic" rather than "start from nothing" when its turn comes.

## What exists now, per quest

| File type | Coverage |
|---|---|
| `content/qNN.ts` (objectives, rewards, flags) | All of Q04–Q16 |
| `infrastructure/hackhub/qNN-quest.ts` + `dev/qNN-replay-quest.ts` | All of Q04–Q16 (Dialog stubs/real content where sourced, `OnStart`/`OnObjectivesStart`/`OnComplete`/`OnAbandon` are TODO bodies) |
| `content/qNN-filesystem.ts` | Q06, Q10–Q15 (quests with archive/log/db objectives) |
| Custom command stubs (`commands/qNN-*.ts`) | `q07-netgraph`, `q15-timeline`, `q15-chaintrace`, `q16-interventiontrace` — everything else maps to a native SDK tool (nmap/sqlmap/ssh/cat/whois/openssl/dirhunter/lynx), see inline `// tool:` comments in each `content/qNN.ts` |
| Website skeleton | `websites/q05-nusantarapay-portal.ts` only — no other quest introduces a new web portal |
| Real dialogue (`Dialog` field) | Q08, Q09, Q11, Q12, Q13, Q14, Q15, Q16 — Q04–Q07 have no scripted dialogue in the source at all (confirmed explicitly deferred in the source) |
| Real mail (opening/report/completion) | Q04, Q05, Q06, Q07, Q08, Q14 — no other quest has mail-framed content in the source |
| Real Relay content (Mail-adjacent, see below) | Q05, Q08, Q13, Q15 |
| Pulse content (`Twotter`-mapped, see below) | Q05, Q06, Q09 (+ `Q16_PULSE_USED_FOR_ENDING = false`) |
| Characters added | Maya Hart, Daniel Ward, Victor Hale, Marcus Reed, Elena Brooks (in `src/content/characters.ts`, minimal `id`/`name`/`email` shape) |

## Two source tiers — read this before touching Q04–Q16

1. **Q04–Q13, Q16**: sourced from `ChatGPT-Mengenal Website HackHub-20260913-2050.md`'s "PHASE 8 — COMPLETE TECHNICAL QUEST SPEC" pass (see `docs/phase13-q04-q16-design-recovered.md`). Objective/reward/flag level only — no full narrative recovery pass has been done for these yet (same status Q01–Q03 were in before their own `phase13-qNN-source-recovered.md`).
2. **Q14, Q15 — MORE AUTHORITATIVE.** The user supplied two dedicated locked spec files: `DEAD_SIGNAL_Q14_THE_OWNER_LOCKED_v1.0.docx` and `DEAD_SIGNAL_Q15_THE_EVIDENCE_LOCKED_v1.0.docx` (original files in `~/Downloads`, not committed to the repo — binary). These **supersede** `docs/phase13-q04-q16-design-recovered.md`'s Q14/Q15 sections entirely:
   - Q14 is **6 mandatory + 1 optional** (not 4+1 as Phase 8 implied) — the LOCKED source has `traceAccessWindow` and `askAboutSession` as objectives Phase 8's terse summary omitted.
   - Q15 is **7 mandatory + 1 optional** (not 5+1) — `reconstructSessionA77402` and `traceUserReference` were missing.
   - Full real dialogue, mail (Q14's Marcus email), Relay content, and exact fixture data (file paths, table contents, a real minute-by-minute A-77402 timeline) are now in `content/q14.ts`/`q15.ts` and `q14-filesystem.ts`/`q15-filesystem.ts`.
   - **Cross-validated against git history**: a pre-existing (later deferred/reverted) Q14 implementation exists at commit `434e7a4` (content definition at `0941822`) — its objective structure matches the `.docx` exactly. One reward discrepancy found and flagged, not silently resolved: old code used `130/10` XP (mandatory/optional), the `.docx` explicitly states `+20 XP` for the optional objective — the `.docx` (primary source) wins, discrepancy noted in `content/q14.ts`.
   - **Important structural correction**: Q14/Q15 do **NOT** use a network/SSH target. The old commit's `CreateData()` used `Files.create`/`Files.getByPath` with no `Network.createSubnetNetwork` call — matches the narrative framing ("an authorized forensic export, not bypassing the primary audit system"). Treat both quests' archive paths as local `Files.*` access, not `ssh`.
   - If the two `.docx` files are still available, re-reading them directly (rather than this doc) is the ground truth for anything not captured here.

## Systems clarified this session (apply to any future quest, not just Q04–Q16)

- **Relay vs. Phone Dialog vs. Pulse — three distinct story-bible systems**, none with a native SDK primitive except Phone (`Dialog`/`createDialog()`):
  - **Relay** = private messaging → maps to **Mail** (same adapter precedent as Q01's own "Relay" substitution, see `docs/phase13-sequential-campaign-lock.md`'s Q01 Runtime Notes).
  - **Phone** = the `Dialog`/`createDialog()` mechanic Q03 already uses (switchBranch/isEnd only — `onEnd`/`onSelect` are permanently broken, `docs/hackhub-dialog-onend-bug-report.md`).
  - **Pulse** = a public social-feed system ("the public version of events") → maps to native **`Twotter`** (not `Kisscord`, which is private 1:1 chat).
- **Elena Brooks** is a real, locked character (confirmed via Phase 8's "🟢 RESOLVED" Elena Integration note) but her exact quest trigger is genuinely unresolved in every source checked so far, including the two Phase 10/11 architecture-audit documents (~2MB combined, surveyed and confirmed 0% story-relevant otherwise). Do not assign her to a quest without new source evidence.

## What's still open (not bugs — deliberately deferred)

- All `OnStart`/`OnObjectivesStart`/`OnComplete`/`OnAbandon` bodies are TODO — no event wiring, no reward claiming, no network/file setup code exists yet for any of Q04–Q16.
- HackhubPost teaser text: genuinely absent from every source checked (Phase 8, the two LOCKED docx files, Phase 10/11/13) for all of Q04–Q16 — will need to be written fresh when each quest is implemented, same as Q01/Q02's HackhubPost was originally missed and had to be added (`docs/phase13-quest-structure-standard.md` §1).
- Chapter 2–4 title adaptation (source: "THE LIST"/"FALSE POSITIVE"/"THE OVERRIDE") — undecided, same as before this session.
- Q04–Q13/Q16's dialogue/mail is objective-level only; a full per-quest narrative recovery pass (mail bodies, full dialogue scripts) has not been attempted for these the way it was for Q14/Q15.

## Verification status

No `npm run typecheck`, `npm test`, or `npm run build` has been run against any of this — per explicit instruction, this was a token-conscious bulk scaffold, not a verified implementation. Run the full gate (`docs/phase13-quest-structure-standard.md` §8) before treating any of this as more than a starting point.
