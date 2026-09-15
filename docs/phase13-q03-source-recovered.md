# ENTITY RESOLUTION — Q03 Source Recovered

Date: 2026-09-14
Status: **SOURCE RECOVERED — TECHNICAL FEASIBILITY MAPPED, NOT YET IMPLEMENTED**

## Source

The user supplied the same exported design conversation used for Q02
(`ChatGPT-Mengenal Website HackHub-20260913-2050.md`), which contains two
passes over Q03: a full narrative "Detailed Quest Design — Q03: MISSING
LOGS" pass, and a later, terser "Phase 8 economy-lock" pass that finalizes
exact XP/money allocation (superseding an earlier `$350`/`+40 XP` draft in
the detailed pass, exactly as happened for Q02). This closes the "Partial:
identity and XP allocation" gap noted in
`docs/phase13-step13.1-story-source-audit.md` for Q03 specifically.

## Naming adaptation (source uses pre-rename placeholders)

Same substitutions already locked for Q01/Q02:

```text
Source name                  → Canonical implemented name
dead_signal_q03               → entity_resolution.q03
Chapter 01 — DEAD SIGNAL      → Chapter 01 — GHOST SERVER
Meridian Logistics            → Skynet Logistics (already implemented)
edge-03.meridian.local        → edge-03.skynet-logistics.idx (= Q02_WEB_HOST, already implemented)
dead_signal.* flags           → entity_resolution.* flags
```

Everything below is written in the already-adapted naming.

## Canonical Identity

```text
ID:            entity_resolution.q03
Title:         MISSING LOGS
Chapter:       01 — GHOST SERVER
Location:      Jakarta
Primary:       Adrian Cole
Prerequisite:  entity_resolution.q02.completed = true
Client:        Skynet Logistics (same client as Q01/Q02)
Target:        edge-03.skynet-logistics.idx (the same host Q02 already investigated)
Estimated time: 10–15 minutes
Difficulty:    Medium
```

## Opening

Shortly after the player's Q02 report, Adrian forwards the client's response.

```text
Subject: Re: edge-03

Adrian:
The client got back to me.

They say edge-03 is old infrastructure and should
have been decommissioned months ago.

That would explain why it isn't in their current
inventory.

They want confirmation that it isn't still active.

Can you pull the server history and check when it
was last used?

Don't touch anything else.
```

"Don't touch anything else" is a small, deliberate tell — Adrian is being more careful than a routine audit would call for.

## Locked Objectives (5 mandatory + 1 optional)

```text
01 Connect to the server        — ssh into edge-03.skynet-logistics.idx
02 Check the system logs        — /var/log/ has access.log/system.log/auth.log;
                                   access.log only goes back to Sep 03, despite
                                   the server having run for months
03 Determine last activity      — stat access.log (Modify Sep 08, Birth Sep 03);
                                   journalctl --list-boots shows boot history
                                   further back than the logs cover
04 Investigate missing entries  — /var/log/gateway/ rotated logs have a gap:
                                   .log.1, .log.2.gz, .log.3.gz, .log.4.gz,
                                   .log.7.gz exist; .log.5.gz and .log.6.gz do not
05 Report findings              — send a findings report to Adrian (no accusation)
   (optional) Check the backup  — /var/backups/gateway/ has the SAME gap;
                                   metadata: retention-policy: restricted
```

### 04 — "The First Real Clue" (search step, folded into Objective 04/05)

```bash
zgrep "10.42.7.18" /var/log/gateway/*.gz     # no results
zgrep "cri-gateway" /var/log/gateway/*.gz    # no results
```

**Hard narrative constraint (explicit in source):** the player must never be
told "the logs were deleted." The only conclusion available is:

> The logs are incomplete.

### Optional — CHECK THE BACKUP

```text
/var/backups/gateway/
  gateway-2026-08-27.tar.gz
  gateway-2026-08-28.tar.gz
  gateway-2026-08-29.tar.gz
```

Inspecting an archive shows the same historical gap inside it. Backup
metadata includes:

```text
owner: infrastructure
created_by: backup-service
retention-policy: restricted
```

**Hidden clue (not surfaced as an objective, same pattern as Q02's SAN
entry):** one metadata field reads `policy_id: CRI-07`. Never explained.
Chains directly onto Q02's breadcrumb:

```text
ARKA Secure Infrastructure → cri-gateway.internal → 10.42.7.18 → CRI-07
```

### 05 — Report findings

```text
Host: edge-03.skynet-logistics.idx

Finding:
Available gateway logs do not cover the full operational
history of the server.

Several rotated log files are missing, and available
backups do not restore the missing period.

The current evidence is insufficient to determine when
the gateway was last actively used.

Recommendation:
Confirm the original decommission date and obtain
archived logs from the infrastructure owner.
```

### Adrian's reaction (escalation of the Q02 pattern)

```text
Adrian: Thanks. I'll forward this to the client.
Adrian: Actually, hold on.
Adrian: Don't include the backup finding in the client report yet.

Player: Why?
Adrian: Because I don't know what it means.
Player: The logs are missing.
Adrian: I know.
Player: And the backup is restricted.
Adrian: I know that too.
Adrian: Just leave it for now.
```

Player gets a branching response line (none of the three variants are
punished — this is characterization, not a skill check):

```text
A) "Then why are you asking me to stop?"
   Adrian: Because I don't want a routine audit turning into
           something I can't explain to the client.

B) "Fine. I'll leave it."
   Adrian: Appreciate it.

C) "I think someone removed the logs."
   Adrian: Don't make that assumption yet.
```

This is the explicit start of Adrian's arc: **Complicity → Responsibility**
— he is not hiding a crime, he is choosing not to look closer at something
he's noticed is wrong.

> **Implementation note (2026-09-15, RESOLVED):** the A/B/C branching
> above is fully shipped and live-tested — see "Live-Test Findings
> (Production Implementation, 2026-09-15)", finding 4. Getting there
> required removing every function property (`onEnd`/`onSelect`, which are
> confirmed permanently broken in this HackHub build — see
> `docs/hackhub-dialog-onend-bug-report.md`) from the entire `Dialog`
> object; `switchBranch` itself works correctly once that's done.

### Quest completion

```text
MISSING LOGS

You were asked to determine when an old server was last active.
You couldn't.
Not because the evidence wasn't there.
Because part of it wasn't.
```

## Rewards (final, from the Phase 8 economy lock — supersedes an earlier $350/+40 XP draft)

```text
20 XP — Investigate server history (Objective 01/02)
20 XP — Analyze log rotation (Objective 03)
20 XP — Identify historical log gaps (Objective 04)
20 XP — Correlate missing records / report findings (Objective 05)
--------------------------------------------------------------------
80 XP mandatory subtotal

10 XP — Check backup archive (optional)
10 XP — Identify CRI-07 policy reference (optional, hidden clue)
--------------------------------------------------------------------
100 XP maximum total

$300 (mandatory only; optional objectives grant XP, no money)
```

This matches the FINAL XP MATRIX table at the end of the recovered
conversation (`Q03 | 100`) and the `$300` figure from the same final
reward-table pass, both superseding the earlier in-narrative "$350 / +40
XP" placeholder — same supersession pattern already confirmed for Q02
(`$350/35 XP` draft → `$250/90 XP` final).

## Persistent State

```text
entity_resolution.q03.completed = true
entity_resolution.q03.logs_missing = true
entity_resolution.q03.backup_checked = true/false
entity_resolution.q03.backup_restricted = true/false
entity_resolution.q03.cri_policy_found = true/false

# Global (not Q03-scoped) character-state flags — note the source itself
# writes these WITHOUT a .q03. segment, implying they persist/accumulate
# across quests rather than resetting per-quest:
entity_resolution.adrian_suspicious = true
entity_resolution.adrian_warned_player = true

entity_resolution.cri_known = false   — still not unlocked as known terminology
```

**Open item carried over from Q02 (see `docs/phase13-q02-source-recovered.md`
item 12 / this session's earlier flag audit):** Q02's own doc already listed
`entity_resolution.q02.adrian_suspicious = true` as expected persistent
state, but the current Q02 implementation never actually calls
`flagStore.set` for it — confirmed still true as of this recovery. Q03's
source now independently confirms `adrian_suspicious` is a real,
narratively-load-bearing **global** flag (unprefixed by quest number),
which resolves the earlier open question ("is this flag actually needed by
a later quest?") — yes. **Q03's implementation must set this flag**, and
Q02's missing `flagStore.set` call should be revisited as part of Q03's
work rather than deferred further.

## Transition to Q04

```text
Adrian: Client closed the ticket.
Adrian: They're decommissioning the server.
Adrian: So we're done.

Player: That's it?
Adrian: That's it.
Adrian: And for what it's worth... I'd leave this one alone.

CUT TO Q04 — LEAVE IT ALONE
```

Escalation stays grounded per the source's own explicit design note: *"Q03
tidak boleh berakhir dengan 'The government is hiding something.' Terlalu
cepat."* No villain, no conspiracy dump — just a small, human choice being
set up for the player going into Q04.

## Security-Assessment Boundary

Same posture as Q01/Q02 — reconnaissance and log review only, using
access/credentials already granted through the existing contract. No
credential attacks, no destructive action, no exploitation.

## Technical Feasibility — SDK Mapping (this session's audit, 2026-09-14)

Confirmed against `@hotbunny/hackhub-content-sdk`'s `index.d.ts`:

- **`stat`, `journalctl`, `zgrep`/`grep` do not exist as native commands** —
  confirmed via direct grep of the SDK's type declarations (zero matches).
  `Terminal.Ls` / `Terminal.Cat` native events are file-ID based
  (`{id, name}` / `{id, name, extension, data}`), not path-based, matching
  the original feasibility concern recorded when Q03 was first flagged as
  blocked.
- **New finding this session**: the SDK exposes a full path-based `Files`
  namespace (`Files.getByPath`, `Files.exists`, `Files.resolvePath`,
  `Files.getRoot`/`getChildren`, `Files.read`/`write`) — per its own doc
  comment, these resolve against the **remote machine's filesystem
  automatically when called from inside a custom terminal command while
  the player is in an SSH session** (`Files.isRemoteSession` available to
  branch explicitly). Neither Q01 nor Q02 has ever used SSH or this `Files`
  namespace — this would be first use in the project.
- Native `ssh` **is** a typed built-in command (`Shell.addCommandData("ssh",
  {host, key}, {ip, status: "OPEN" | "CLOSE"})`), same port-gating shape
  already proven for `nmap`. `NetworkUser` (declared via
  `Network.createSubnetNetwork`) already supports a declarative
  `files?: NetworkFileMap[]` tree per user — this is the most likely path
  for defining `/var/log/gateway/`'s file list (including the gap, simply
  by omitting `.log.5.gz`/`.log.6.gz` from the tree) without needing the
  `Files` API at all.

**Recommended approach (hybrid, CONFIRMED live 2026-09-15 — see "Live-Test
Findings" below):**

| Objective | Mechanism | Confidence |
|---|---|---|
| 01 Connect | Native `ssh`, `Shell.addCommandData` port-gated like nmap | High — proven pattern, confirmed live |
| 02–04 Browse logs / notice gap | Native `ls`/`cat` against a declarative `NetworkUser.files` tree | **Confirmed live 2026-09-15** |
| 03 `stat`, `journalctl` | New custom `@RegisterCommand` commands (`scope: "remote"`) using `Files.resolvePath` + `Files.getByPath`/`Files.read` (no native equivalent), same registration pattern as Q01's `recon`/`subfinders` | **Confirmed live 2026-09-15** |
| "First clue" `zgrep` | New custom `@RegisterCommand` command (`scope: "remote"`), same `Files` API pattern, completes on either canonical search pattern returning empty | **Confirmed live 2026-09-15** |
| Optional backup dir | Same native `ls`/`cat` approach as 02–04 | Same as 02–04 |

This design is now unblocked — `content/q03.ts` + `q03-quest.ts` can proceed
using this hybrid approach. The throwaway probe (`dev/q03-ssh-probe-quest.ts`,
`dev/q03-probe-entry.ts`, `scripts/build-q03-probe.ts`, `dist-q03-probe/`,
the installed `entity-resolution-q03-probe` mod) can now be deleted/uninstalled
per its own "safe to delete" comments.

## Live-Test Findings (SSH Probe, 2026-09-15)

Standalone probe mod `entity-resolution-q03-probe` (`dev/q03-ssh-probe-quest.ts`),
built/installed separately from `entity-resolution-dev`, live-tested in-game:

1. **Native `ssh` requires `-h [username@ip]` syntax, not a bare IP.** Running
   `ssh 198.51.100.11` returns the command's usage message
   (`Usage: ssh -h [username@ip] -p [port (optional)]`) instead of connecting —
   this is a hard requirement of the built-in command, unrelated to how
   `Shell.addCommandData("ssh", {host, key}, ...)` is registered. Correct
   invocation: `ssh -h auditor@198.51.100.11` (username from the declared
   `Network.createUser`). `-p [port]` is optional and defaults to whatever
   port is open (22 in the probe) when omitted.
2. **Password prompt uses the `Network.createUser({ password })` value
   directly** — the probe's user was created with `password: "probe-key"`,
   and that plain string is what the player enters at the password prompt
   (not `Shell.addCommandData`'s `key` field, which only feeds the
   port/status gating check, mirroring `nmap`).
3. **SSH connect confirmed working** with the corrected syntax + password.
4. **`-p [port]` is validated against the actually-open port** — connecting
   with any port other than the one declared active (22 in the probe) is
   rejected, confirmed live. Matches the port-gating behavior already
   proven for `nmap`; safe to rely on for any future quest that wants to
   gate SSH reachability behind a specific port being open.
5. **Native `ls`/`cat` against a declarative `NetworkUser`/`rootFiles` tree
   CONFIRMED working end-to-end.** `ls` successfully navigated down to
   `probe.txt` (both step-by-step `cd`+`ls` per folder, and directly via a
   full path in one command both work fine — either style is safe to use),
   and `cat` printed the file's declared contents exactly:
   *"SSH FILE BROWSING PROBE — if you can cat this file, native ls/cat over
   SSH works."* This confirms the `Files`-namespace doc comment's claim
   about remote-session path resolution holds in practice — the hybrid
   design in "Recommended approach" above is no longer a hypothesis and
   Q03 implementation can proceed on top of it.
6. **Custom `@RegisterCommand` reading remote files via the `Files`
   namespace CONFIRMED working**, validated with three throwaway probe
   commands (`probestat`, `probejournalctl`, `probezgrep` —
   `dev/q03-probe-commands.ts`) exercising the exact mechanism Q03's real
   `stat`/`journalctl`/`zgrep` commands need:
   - A mod using `Files.*` from a custom command **must declare the
     `"filesystem"` permission** in its manifest — omitting it throws
     `[ContentSDK] Mod "..." tried to use Files.isRemoteSession without
     "filesystem" permission` at the first `Files` call. Add `"filesystem"`
     to Q03's real manifest alongside `"shell"`/`"network"`/`"events"`.
   - **`Files.getByPath` does NOT resolve a relative path against the
     terminal's cwd on its own** — unlike native `ls`/`cat`. Calling
     `Files.getByPath("probe.txt")` from cwd `/var/log`, or
     `Files.getByPath("var/log/probe.txt")` from `~`, both returned `null`
     until the path was first run through `Files.resolvePath(path)` (which
     defaults to resolving against the current terminal cwd per its own
     doc comment). **Every custom command that takes a path argument must
     call `Files.resolvePath` before `Files.getByPath`/`Files.exists`** —
     this applies directly to Q03's real `stat`, `journalctl`, and `zgrep`
     commands, not just the probe.
   - Once resolved correctly, `Files.getByPath` + `Files.read(file.id)`
     round-tripped the exact file contents from both an absolute path
     (`var/log/probe.txt` typed from `~`) and a relative path (`probe.txt`
     typed after `cd var/log`) — confirmed live for all three probe
     commands, both ways.

## Live-Test Findings (Production Implementation, 2026-09-15)

Full `entity-resolution-dev` build, live-tested in-game end to end (not a
throwaway probe). Status: **FINAL LOCK — LIVE INGAME PASSED.** All 6
objectives (1-4, 4b optional, 5) confirmed completing correctly (including
the Objective 04 false-completion bug fixed in finding 7), the quest reaches
`OnComplete` reliably, and the phone-call reaction — including the source's
original A/B/C player-choice branching — is fully working (finding 4).

1. **`Terminal.Cat`/`Terminal.Ls` are the only safe completion source for
   file-read/list objectives — never `Terminal.Command`.** Confirmed live:
   `Terminal.Command` fires on the raw typed command text regardless of
   whether the read actually succeeded (e.g. `cat` from the wrong cwd, a
   genuine "File not found." on screen, still matched and completed the
   objective). Fixed by relying solely on `Terminal.Cat`/`Terminal.Ls`,
   which only fire with real file data.

2. **The phone-call `Dialog`'s caller identity comes from `Employer`, not
   any field on `Dialog` itself.** Without an explicit `Employer =
   { firstName, lastName, email, avatar }` on the quest class, the native
   phone UI displayed a base-game default contact ("Shay Rogers") instead
   of Adrian — confirmed live, `createDialog()` itself never threw. No
   prior Q01/Q02 quest needed this because Q03 is the first to use
   `createDialog` at all. Fixed by setting `Employer` explicitly.

3. **`Dialog` must be a static class field, evaluated once at quest
   registration — assigning `this.Dialog = ...` dynamically at runtime
   (e.g. inside a `Mail.Sent` handler) never throws, and reading
   `this.Dialog` back afterward shows the correct object, but the phone
   call UI renders nothing at all (no text, no options).** This confirms
   the SDK reads `Dialog` once when the quest is registered, before any
   later assignment can take effect. Any per-playthrough conditional
   content (e.g. this quest's optional backup-check branch) must be
   handled by choosing between multiple fully-static starting branches at
   the initial `createDialog(branchName)` call, not by mutating the
   `Dialog` object itself.

4. **RESOLVED 2026-09-15 — `onEnd`/`onSelect` callbacks are permanently
   broken in this HackHub build, but `options`/`switchBranch` branching
   itself works fine once every function property is removed from the
   whole `Dialog` object.** Full external bug report filed:
   `docs/hackhub-dialog-onend-bug-report.md`.

   The original design (see "Adrian's reaction" above) has the player pick
   one of three response lines, each leading to a different Adrian
   follow-up. Getting there took an exhaustive elimination process:

   - **Mechanism-level attempts** (all failed identically — the call
     either never reached the options screen, or echoed the player's
     chosen line then froze with zero output, no error):
     - `isEnd: true` + `onEnd: () => this.createDialog(otherBranch)`
       (mid-call branch jump)
     - `switchBranch` on a selected `option`
     - `nextIndex` on a selected `option` (same-array jump)
     - `isEnd: true` + `onSelect` directly on the option (no jump at all)
   - **Isolating the pattern**: every failure traced back to *some* entry
     in the reachable branch carrying a function property (`onEnd` or
     `onSelect`) — never whether a jump was involved.
   - **Function-form exhaustive test** (once isolated to "a function is
     present," every JS/TS syntactic form was tried on an otherwise-clean
     linear line, each with a bare no-op `console.log` body to rule out
     what the callback *does*): an arrow referencing `this`, a bare arrow
     with no `this` access, a `function` expression, a pre-bound class
     method (`.bind(this)`), and a named top-level function reference.
     **All five produced the identical symptom** — the transition INTO
     whichever entry carried the function stalled completely, every time,
     regardless of syntax.
   - **`Proxy` experiment** (see finding 8 below): confirmed `createDialog()`
     reads the entire reachable branch graph eagerly and synchronously at
     call-setup time — supporting a `structuredClone`-throws-on-a-function
     theory as the likely underlying cause.
   - **External confirmation**: a separate, independently-built community
     quest-editor tool for this game
     ([TheZeis/Hackhub-Quest-Editor](https://github.com/TheZeis/Hackhub-Quest-Editor))
     compiles its own phone-call dialogue nodes to raw `Dialog` objects
     that **never emit `onEnd`/`onSelect` at all** — only `speaker`,
     `text`, `isEnd`, and `options` (`label`/`text`/`switchBranch`/`isEnd`)
     — and calls `createDialog()` fire-and-forget, matching the workaround
     independently.

   **Fix**: `switchBranch` restored to route to three separate
   `postReportA`/`postReportB`/`postReportC` branches exactly per the
   source design, with **zero function properties anywhere in the entire
   `Dialog` object** — every line and option is plain `speaker`/`text`/
   `audio`/`timeout`/`switchBranch`/`isEnd` data only. Quest-objective
   completion (`finishReportFindings`) is called directly from
   `handleMailSent()`, fully decoupled from the dialog's own lifecycle
   (see finding 5/8 for why no dialog-driven completion signal is possible
   at all). Live-tested repeatedly: options screen displays reliably, all
   three choices (A/B/C) route to the correct distinct Adrian follow-up
   line, and the call ends normally. The full source narrative beat is
   preserved.

5. **The phone call's total auto-advance duration must stay under
   `Q03_COMPLETION_DELAY_MS`, or the completion mail/reward arrives mid-call
   instead of after it visually ends. There is no more precise fix
   available — see finding 8, which rules out a dialog-driven signal
   entirely, even with the branching in finding 4 restored.** Since
   objective completion is decoupled from the dialog, it fires on its own
   fixed timer starting when the call begins. At `timeout: 3000` per line,
   the longer of the two starting branches (`postReportMainWithBackup`, 10
   lines) takes ~27s to reach its final line. `Q03_COMPLETION_DELAY_MS`
   was raised from 20s to 32s to keep headroom above that. If line count
   or per-line `timeout` changes, this constant must be re-checked.

6. **`AutoComplete` requires every non-optional objective to be completed
   via `completeObjective()`, not just the most recent one.** A test that
   jumped straight to submitting the report (skipping objectives 1-4)
   completed objective 5 fine but `OnComplete` never fired — this looked
   like flaky/non-deterministic `AutoComplete` at first, but was fully
   reproducible: redoing the same run with all objectives completed in
   order fired `OnComplete` reliably every time. Not a bug — just confirms
   the QA-shortcut pattern (skipping ahead via the replay's ungated
   objectives) cannot be used to test overall quest completion, only
   individual objectives.

7. **FIXED 2026-09-15 — root cause confirmed, not what was first
   suspected.** `ls` inside `/var/backups/gateway/` was incorrectly
   completing Objective 04 ("Investigate missing entries"), which is
   supposed to require `ls` inside `/var/log/gateway/` specifically. The
   first fix attempt (dropping the `=== "gateway"` branch, matching only
   `startsWith("gateway.log")` against child filenames) made the bug
   *worse* — Objective 04 then failed to complete from EITHER folder.
   Diagnostic logging of the raw `Terminal.Ls` payload revealed why:
   **`Terminal.Ls` fires exactly once per `ls` invocation, and `data.name`
   is the name of the LISTED FOLDER itself, not any child item** — running
   `ls` in either `/var/log/gateway/` or `/var/backups/gateway/` both
   report `data.name === "gateway"` (only `data.id` differs between them).
   Child filenames are never exposed to this event at all, so no
   name-based check — however written — could ever tell the two folders
   apart; the whole premise of the original implementation (and its first
   fix attempt) was wrong. Fixed properly using `Files.getById` (an
   ID-based `Files.*` call, confirmed to work from any context, unlike
   `Files.resolvePath`/`getByPath` which are only session-aware when called
   from inside a running custom command — see the `Files` namespace doc
   comment): look up `data.id` to confirm the listed folder is named
   `"gateway"`, then walk one level up via `FileInfo.parent` and require
   the PARENT folder's name to be `"log"`. Live-tested: `ls` in the backup
   folder first no longer completes the objective; `ls` in the log folder
   does.

8. **`createDialog()` reads the ENTIRE reachable `Dialog` branch graph
   eagerly and synchronously at call-setup time — there is no way to
   detect real dialog/call progress from mod code, confirming finding 5's
   "no precise timing fix possible" and adding supporting evidence for
   finding 4's root-cause theory.** Investigated via a `Proxy` wrapped
   around a fully function-free `Dialog` object, so every
   `Dialog[branch][index]` property read could be logged without ever
   exposing a function value inside the data itself (ruling that out as a
   confound). Result: every line of every branch reachable via
   `switchBranch` from the call's starting branch — `postReportMain`
   (8 lines) → `postReportMainWithBackup` (10 lines) →
   `postReportA`/`postReportB`/`postReportC` (1 line each), ~23 lines
   total across all 5 branches — was read within the **same logged second**
   `createDialog()` was called, long before the player had seen anything.
   This is a full, eager, one-time traversal of the whole graph at setup,
   not a lazy read as the call actually plays out; whatever the player
   sees afterward comes from an internal copy the engine made during that
   traversal, which the mod cannot observe. Two direct consequences:
   - Supports a `structuredClone`-throws-on-a-function theory for finding
     4's root cause: unlike `JSON.stringify` (which would just silently
     drop a function), `structuredClone` throws when it encounters one —
     if the engine clones this whole graph up front, a function anywhere
     in it would corrupt whatever internal state that clone was meant to
     populate, plausibly explaining why display works fine right up to the
     exact line carrying the function, then silently stalls.
   - Confirms no "line reached" or "call ended" signal can ever be built
     from mod code by any means, not just the documented `onEnd`/`onSelect`
     fields — the engine simply never reads `Dialog` again after that one
     initial pass, so nothing the mod does with the object after
     `createDialog()` returns can observe real playback progress.

   This finding was included in the external bug report
   (`docs/hackhub-dialog-onend-bug-report.md`) as supporting evidence.

9. **Q04-Q16 are unlikely to need this branching pattern at all** — per
   the recovered campaign design source
   (`ChatGPT-Mengenal Website HackHub-20260913-2050.md`), section
   "13. Dialogue Branching Problem" explicitly audits and rejects
   interactive quest-branching dialogue for the wider campaign: *"Sebagian
   besar dialogue dapat menggunakan conditional lines, bukan quest
   branches"* — i.e. NPC lines vary based on flags/state already set
   before a dialog starts (the same pattern already proven live as
   `postReportMain` vs. `postReportMainWithBackup`, chosen by
   `Data.backupChecked` at the single initial `createDialog()` call), not
   real-time interactive `options`/`switchBranch` player choice mid-call.
   Section 14 ("Optional Evidence → Dialogue") confirms the same pattern
   for optional-objective-driven dialogue variation (e.g. Q08's Daniel
   line). Q03's genuine interactive A/B/C choice — the only place this
   session's `onEnd`/`onSelect` investigation was actually load-bearing —
   appears to be the exception, not the template, for the rest of the
   campaign.

10. **Post-FINAL-LOCK naming/UX pass (2026-09-15, session discussion)** —
    pure polish on top of the already-passed live validation above; no
    gameplay-logic change beyond splitting one objective into two
    independent completions. Final custom command name: `archgrep`
    (placeholder used during implementation) was renamed to `zgrep` —
    confirmed live it does **not** collide with any native HackHub command
    (native `grep`/`zgrep` cannot decompress `.gz` content at all, tested
    against a guaranteed-present string rather than the intentionally-absent
    private-IP clue), so it coincidentally lands back on the source's own
    literal name. Final objective structure (7 total, `Q03_OBJECTIVE_IDS` in
    `src/content/q03.ts`): `accessHost` (01) → `checkLogs` (02) →
    `checkTimestamp` (03) / `reviewBootHistory` (04) — split from the single
    combined "determine last activity" objective so `filestat` and `bootlog`
    each complete independently — → `checkGatewayLogs` (05) → `checkBackup`
    (05b, optional) → `reportFindings` (06). `filestat`'s usage message
    changed from `filestat <path>` to `filestat <file>`. `filestat`/
    `bootlog`/`zgrep` output was reformatted from a single joined string
    into a bordered ASCII table (`FILE`/`MODIFY`/`BIRTH` and
    `BOOT`/`START`/`END` respectively), printed one `println()` call per
    line since `println()` does not interpret embedded `\n` as separate
    terminal lines. **Live-confirmed 2026-09-15**: the user replayed the
    rebuilt mod end to end and confirmed Q03 still completes cleanly with
    the new 7-objective flow, renamed `zgrep`, and the table-formatted
    `filestat`/`bootlog` output — a screenshot surfaced two more real
    terminal-rendering issues, fixed in the same pass:
    - **Whitespace collapsing**: the screenshot showed the table's border
      (`+---+`, correct width) but header/data text squished to single
      spaces — HackHub's terminal collapses runs of plain space characters
      (standard HTML behavior). Fixed by padding with U+00A0
      (non-breaking space) instead of a plain space, which HTML's
      whitespace-collapsing rule excludes by spec.
    - **Minimum terminal width**: at the game's minimum terminal window
      size (screenshot-confirmed ~55-60 characters), `zgrep`'s original
      4-column `FILE`/`TIMESTAMP`/`SOURCE`/`MESSAGE` table (~108 chars
      wide) wrapped mid-cell and broke the box grid — structurally
      unfixable by shrinking columns, since `FILE`+`TIMESTAMP`+`SOURCE`
      alone already need ~58 chars without `MESSAGE`. Replaced with a
      per-match block layout instead of a table: a
      `file — timestamp — source` header line, then the message on its
      own `└─ `-prefixed, word-wrapped (50-char cap) indented line — no
      line this produces needs to exceed ~55 chars, so it renders
      correctly at any window size. `filestat`/`bootlog` stayed as tables
      (already narrow enough, ~32-38 chars, to fit the minimum width
      comfortably). See `docs/hacking-tools-reference.md`'s "Terminal
      rendering gotchas" note for the general pattern.

## Open Questions

- ~~Exact custom command names/argument syntax for `stat`/`journalctl`/
  `zgrep` are an implementation decision, not specified further by the
  source beyond the example invocations shown above.~~ Resolved by finding
  10 above: `filestat`, `bootlog`, `zgrep`.
- Whether `entity_resolution.adrian_suspicious` /
  `adrian_warned_player` should live as top-level flags (matching the
  source's unprefixed naming) or under some other shared namespace is an
  implementation decision for `content/` — the source is clear that they
  are **not** per-quest-scoped.
