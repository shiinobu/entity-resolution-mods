# ENTITY RESOLUTION — Q02 Source Gate

Date: 2026-09-13
Status: **RESOLVED — see `docs/phase13-q02-source-recovered.md`**

The user supplied the missing exported design source the same day this gate was recorded. This document is kept for the historical record of what was missing and why implementation could not proceed at that point; it no longer blocks Q02.

## Purpose

Per `docs/phase13-sequential-campaign-lock.md`'s Canon/Runtime Boundary rule: "When a quest's detailed source is incomplete, implementation stops at the source gate and records the exact missing material." Q01 has passed live validation (`docs/phase13-q01-final-lock.md`), making Q02 the active campaign target — but this audit finds Q02's source coverage insufficient to implement without inventing story content, which is explicitly forbidden.

## What is known (source-backed)

From `docs/phase13-step13.1-story-source-audit.md` (Phase 1 / Phase 7 exported source):

```text
ID:            entity_resolution.q02 (implied — not directly confirmed)
Chapter:       01 — GHOST SERVER
High-level identity: "Find unregistered server"
Prerequisite:  Q01 (sequential campaign order)
Maximum XP:    90
```

That is the entire directly-readable source for Q02. No other Q02 detail appears anywhere in the currently readable exported project history.

## What is missing (source-detail gap)

Everything needed to actually implement a quest is absent:

- **Objectives** — no objective list, no count, no order, no completion criteria.
- **Target/location** — no IP, hostname, city, or network topology (Q01 had `203.0.113.42` / Jakarta / Skynet Logistics; Q02 has no equivalent).
- **Characters** — no employer/contact identity, no email address, no dialogue.
- **The "unregistered server" itself** — no detail on what makes it unregistered, how the player is supposed to find it, or what they find once they do.
- **State flags** — no persistent completion flag name, no intermediate state.
- **Rewards** — total is 90 XP, but no per-category breakdown (Q01's 80 XP split into 4 named categories; Q02 has no equivalent) and no money amount.
- **Security-assessment boundary** — no statement of what is/isn't authorized (Q01 explicitly excludes credential attacks, internal access, etc.).
- **Terminal/tool bindings** — no indication of which native HackHub tools (nmap, lynx, dirhunter, whois, dig, netstat, etc.) this quest is meant to exercise.
- **Narrative connective tissue** — how Q02 follows from Q01's ending (Adrian's audit closed; what brings the player to "an unregistered server" next, and for whom).

This matches source-detail gap #8 in `phase13-step13.1-story-source-audit.md` ("Complete detailed Q01–Q13 quest source") — Q02 is fully inside that acknowledged gap, not a new discovery.

## Disposition

**BLOCKED.** Per the locked Canon/Runtime Boundary rule, no Q02 objectives, characters, flags, targets, or rewards may be invented to fill this gap. Two paths forward:

1. **Additional source material exists** — if there is more exported design history (a ChatGPT conversation export, notes, or any other Phase 1–8 artifact) covering Q02 in the same way Q14/Q15 already have full locked artifacts, supplying it lets this gate close the same way Q01's did.
2. **No further source exists** — Q02 must be designed collaboratively now, within the known constraints (Chapter 1 "GHOST SERVER," follows Q01, 90 XP, "find unregistered server," the ARKA/CRI investigation frame established by the story bible), following the native-tool-first approach validated on Q01 (prefer native HackHub commands — nmap/lynx/dirhunter/whois/dig/etc. — over building new mod infrastructure). Any decision made this way must be recorded explicitly as a project-owner design decision, not presented as recovered canon.

No implementation work should start until one of these two paths is chosen.
