# ENTITY RESOLUTION — Current Design (live implementation + changes from source)

This file documents what is **actually implemented and live** for each quest,
plus, in a "Changes from original source" subsection per quest, exactly what
was changed from the original design (`docs/source-original.md`) and why.
This is the file to read when the question is "what does the game actually
do" or "why is this different from the original design."

---

## Q01 — THE CONTRACT (current)

Status: **FINAL LOCK — LIVE VALIDATION PASSED** (2026-09-13)

### Canonical Identity

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

### Objectives (6, linear)

```text
01 reviewScope                — read Adrian's mail (Mail.Read gated, not auto-complete)
02 scanNetwork                — nmap 203.0.113.42
03 identifyServices           — lynx 203.0.113.42 → www.skynet-logistics.idx
04 enumeratePaths             — dirhunter https://www.skynet-logistics.idx/
05 basicVulnerabilityChecks   — browse the discovered /security page over HTTPS
06 submitAudit                — submit the resolved report by mail
```

Locked service facts: only `443/tcp OPEN https`; `22/tcp` and `80/tcp` are
`CLOSE`. Web surface is one host, four paths (`/`, `/portal` [403],
`/status` [403], `/security` [audit target]).

### Report

```text
Target: Skynet Logistics
Open Ports: 443
Url: https://www.skynet-logistics.idx/security

No critical vulnerabilities identified.
Further internal assessment is recommended.
```

### Reward

```text
35 XP  — Complete external audit
20 XP  — Network/service enumeration
10 XP  — Basic vulnerability assessment
15 XP  — Submit correct report
--------------------------------
80 XP total

$200
```

Granted as a lump sum in `OnComplete()`, via `Bank.transaction()` (a
post-lock fix — see Changes below) plus the mod's internal XP ledger.

### Changes from original source

| Original (`source-original.md`) | Current | Why |
|---|---|---|
| Client: **Meridian Logistics** | Client: **Skynet Logistics** | Renamed before implementation began; carried through the whole project (`meridian.local` → `skynet-logistics.idx`). No story reason recorded beyond the rename itself. |
| Quest ID `dead_signal_q01`, Chapter "DEAD SIGNAL" | `entity_resolution.q01`, Chapter "GHOST SERVER" | Project-wide rename, same as above, applied to every quest ID and the Chapter 1 title. |
| 4 objectives (accept → review → scan → submit); scan = one bare `nmap` | 6 objectives; scan/identify split into `nmap` → `lynx` → `dirhunter` → browse → submit | The original's single "scan the network" step doesn't correspond to any real, checkable HackHub action beyond nmap. Getting a live PASS required real web-discovery tooling: `nmap` confirms the open port, `lynx` resolves the public hostname, `dirhunter` (a genuine native tool that reads real registered `Website` pages) enumerates paths, then the player browses the discovered `/security` page. Two earlier designs were tried and rejected before this: a DSS `recon`-app dependency (too heavy), and a custom `subfinders` command mimicking subdomain enumeration (replaced once native `dirhunter` was confirmed to work against real registered pages instead of a fictional one). |
| All three ports (`22`, `80`, `443`) open | Only `443` open, `22`/`80` explicitly `CLOSE` | Tightened once the web-discovery objectives needed a single, unambiguous HTTPS target; an audit with three open services but no story reason to touch any but one added no value. |
| Objective 01 auto-completes on quest start | Objective 01 requires the player to actually open Adrian's mail (`Mail.Read`) | Found live-testing that skipping straight to nmap without ever reading the brief still "worked," which undercuts the mail as a real gate. |
| Report has `Target`/`Open Ports` only | Report adds a `Url:` field | The new `/security` page needed to be a value the player actually discovers and reports, not just implied. |
| Reward: **$500 / 25 XP** | Reward: **$200 / 80 XP** | Renumbered under the project's Phase 8 economy lock, which re-balanced Q01–Q16 rewards against each other; not a story-driven change. |
| ARKA cert breadcrumb is purely decorative flavor | Same breadcrumb, same non-objective treatment | Unchanged — the one piece of Q01 that shipped exactly as designed. |
| Reward paid via internal ledger only (implicit) | Reward's `$200` portion also posted through the real `Bank.transaction()` API | Bug found post-lock: the internal ledger never actually reached the player's real in-game bank balance. XP has no native bank equivalent, so it stays internal-ledger-only. |

---

## Q02 — THE ANOMALY (current)

Status: **FINAL LOCK — LIVE VALIDATION PASSED** (2026-09-13, stabilized 2026-09-14)

### Canonical Identity

```text
ID:            entity_resolution.q02
Title:         THE ANOMALY
Chapter:       01 — GHOST SERVER
Location:      Jakarta
Primary:       Adrian Cole
Prerequisite:  entity_resolution.q01.completed = true
Client:        Skynet Logistics
New target:    edge-03.skynet-logistics.idx (a host absent from the client's asset inventory)
Money:         $250
Maximum XP:    90 (80 mandatory + 10 optional)
```

### Opening

A few hours after Q01 closes, Adrian sends a short, non-alarming follow-up:

```text
Adrian:
Client has one more thing.

Their external scan doesn't match
their internal asset list.

Can you take a look?

Host: edge-03.skynet-logistics.idx
```

He offers a reasonable cover up front — "It may just be an old asset. Check
before I tell the client." — so the player has no reason yet to suspect
anything illegal.

### Objectives (5 mandatory + 1 optional)

```text
01 Check the new target       — review Adrian's brief; host not in inventory
02 Scan the host              — nmap edge-03.skynet-logistics.idx (resolved to
                                 its IP first — nmap rejects hostnames; see
                                 docs/bugs.md entry 4) → 22/443/8443 open
03 Identify the service       — nmap -sV -p 22,443,8443 <ip> → port 8443
                                 responds nginx / X-Service: gateway.internal
04 Inspect the certificate    — cert on 8443: Subject gateway.internal,
                                 Issuer ARKA Secure Infrastructure, hidden SAN
                                 entry cri-gateway.internal (never called out
                                 by the UI — a careful player notices it)
05 Report the anomaly         — send findings to Adrian; player does not
                                 accuse anyone, only recommends confirming
                                 ownership/purpose
   (optional) Check the DNS   — nslookup cri-gateway.internal → 10.42.7.18
                                 (private, unreachable — foreshadows Q03/Q04)
```

Design constraint carried from source: Q02 never says CRI, CIVIC, GOVERNMENT,
RISK, or SURVEILLANCE by name — only "ARKA", "gateway.internal", and "unknown
infrastructure."

Mechanism note: objective 04's port-8443 "service" is modeled as a raw-IP
`Website` (`Website.Host` = an IP, not a domain) serving the certificate
page — no native SDK command exists for live TLS inspection. See Changes
below for the two rejected alternatives.

### Adrian's reaction (first behavioral anomaly)

Instead of his usual "I'll forward it," Adrian hesitates:

```text
Adrian: Don't send this to the client yet.
Player: Why?
Adrian: I want to confirm something first.
Player: What?
Adrian: Just leave it for now. I'll get back to you.
```

### Quest completion

```text
Adrian: Good catch. I'll handle it from here.
Adrian: And don't run another scan on that host.
Player: Understood.
```

### Transition to Q03

Some time later, Adrian asks the player to send him the raw scan logs. When
he reviews them:

```text
Adrian: These logs are incomplete.
Player: They weren't incomplete when I downloaded them.
Adrian: ...
Adrian: Can you check the server history?
```

The player concludes "someone deleted something" themselves, rather than
being told to investigate a conspiracy — the natural hook into **Q03 —
MISSING LOGS**.

### Security-Assessment Boundary

Same posture as Q01 — reconnaissance only, no credential attacks, internal
access, or exploitation.

### Post-lock polish (2026-09-14, non-bug)

On top of the two real bugs from this stabilization round (`docs/bugs.md`
entries 7–8), several content/naming refinements landed the same day:
content-declaration refactor (`_PRODUCTION`/`_REPLAY` exports moved fully
into `content/`), hint cleanup on Objectives 02/05, report subject renamed
`"Anomaly Report — edge-03"` → `"Anomaly Report — Skynet Logistics"`,
delay tuning (`Q02_COMPLETION_DELAY_MS` settled at 20s), `HackhubPost`
relocated to `content/` per the quest-structure standard, the
`cri-gateway.internal`/`10.42.7.18` pages given a proper unreachable-host
diagnostic template instead of a generic 404, and Adrian's email domain
corrected to `adrian.cole@phantom-net.void` (see
`docs/email-rules.md`).

### Persistent state

```text
entity_resolution.q02.completed
entity_resolution.q02.anomaly_found
entity_resolution.q02.arka_certificate_found
entity_resolution.q02.cri_hostname_found
entity_resolution.q02.cri_private_ip_found   (optional path only)
```

Note: `adrian_suspicious` is **not** Q02-scoped despite appearing in early
drafts of this list — it's a global, campaign-wide flag first actually set in
Q03. See Changes below.

### Changes from original source

| Original | Current | Why |
|---|---|---|
| Client **Meridian Logistics**, host `edge-03.meridian.local`, ID `dead_signal_q02` | **Skynet Logistics**, `edge-03.skynet-logistics.idx`, `entity_resolution.q02` | Same project-wide rename as Q01. |
| Reward **$350 / +35 XP** | **$250 / 90 XP max** (80 mandatory + 10 optional) | Phase 8 economy-lock rebalance across Q01–Q16, not story-driven. |
| Target IP unspecified | `203.0.113.77` (TEST-NET-3 range, matching Q01's `203.0.113.42`) | Source never gave one; picked from the same documentation-only IP range Q01 already used. |
| — | `nmap` must target the resolved IP, not the hostname; player resolves it themselves (e.g. `nslookup`) | Confirmed live: native `nmap` genuinely rejects hostnames — not a story change, a tooling constraint. |
| — | Objective 04's port-8443 "service" is modeled as a raw-IP `Website` (`Website.Host` = an IP, not a domain) serving the certificate page | No native SDK command exists for live TLS inspection; this was the adopted workaround after two rejected alternatives (custom port; hostname-based host). Mechanism-level, not story-level. |
| `adrian_suspicious` listed as a Q02 flag | Never actually set by Q02; ownership moved to Q03 (still a global flag, not quest-scoped) | Found during Q03's source recovery that Q02's implementation never called `flagStore.set` for it, and that the source itself treats it as campaign-wide, not per-quest. Rather than patch a FINAL LOCK quest, Q03 owns it outright. |

---

## Q03 — MISSING LOGS (current)

Status: **FINAL LOCK — LIVE INGAME PASSED** (2026-09-15), **credential-delivery
redesigned 2026-09-16/17** (see "Access credentials" below) — not yet
re-verified live against the redesigned flow.

### Canonical Identity

```text
ID:            entity_resolution.q03
Title:         MISSING LOGS
Chapter:       01 — GHOST SERVER
Location:      Jakarta
Primary:       Adrian Cole
Prerequisite:  entity_resolution.q02.completed = true
Client:        Skynet Logistics
Target:        edge-03.skynet-logistics.idx (same host Q02 investigated)
Money:         $300
Maximum XP:    100 (80 mandatory + 20 optional)
```

### Opening

Shortly after Q02's report, Adrian forwards the client's response:

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

Old access backup attached.

Don't touch anything else.

— Adrian
```

"Don't touch anything else" is a deliberate tell — Adrian is being more
careful than a routine audit calls for. The mail carries a real attachment,
`old-creds.bak` — see "Access credentials" below.

### Objectives (8 total: the original 5+1 split into 7, plus a new `findAccess` step)

```text
findAccess       00 — dig up the SSH credentials from the mail attachment
                      (see "Access credentials" below) — ungated, no reward
accessHost       01 — ssh -h auditor@<ip> into edge-03 (see docs/bugs.md entry 2
                      for the required syntax)
checkLogs        02 — /var/log/ has access.log/system.log/auth.log; access.log
                      only goes back a few days despite months of runtime
checkTimestamp   03 — custom `filestat` command: file Modify/Birth dates
reviewBootHistory 04 — custom `bootlog` command: boot history further back
                      than the logs cover (split from a single source
                      objective so both commands complete independently)
checkGatewayLogs 05 — /var/log/gateway/ rotated logs have a gap: .log.1,
                      .log.2.gz-.log.4.gz, .log.7.gz exist; .log.5.gz/.log.6.gz
                      don't. Custom `zgrep` command searches them for
                      "10.42.7.18"/"cri-gateway" — no results, never framed as
                      "deleted," only "incomplete"
checkBackup      05b (optional) — /var/backups/gateway/ has the SAME gap;
                      metadata includes retention-policy: restricted and a
                      hidden clue, policy_id: CRI-07 (chains onto Q02's
                      ARKA → cri-gateway.internal → 10.42.7.18 breadcrumb)
reportFindings   06 — send findings to Adrian (no accusation)
```

`filestat`, `bootlog`, and `zgrep` are custom `@RegisterCommand`s (no native
equivalent exists) using the SDK's `Files` namespace — see `docs/bugs.md`
entries 6, 16, 18-20 for the `Files.resolvePath`/manifest-permission/SSH
network-shape/stale-fixture/`.gz`-extension gotchas that had to be solved to
make Q03 work end to end.

`checkBackup` is deliberately **not** in `reportFindings`'s unlock chain even
though it's on the same log-rotation gap as `checkGatewayLogs` — gating the
mandatory chain on a fact only reachable via Q02's own optional DNS bonus
would soft-lock any player who skipped that earlier optional step.
`checkGatewayLogs` only requires listing `/var/log/gateway/` and seeing the
gap; the deeper `zgrep` search is an ungated bonus tool, not a requirement.

Q03 targets the exact same host Q02 already resolved (no new hidden
target, no re-resolve puzzle) — the opening mail states the hostname/IP
directly, since the story beat here is "the client asks about a server you
already found," not "find a new server."

### Access credentials (redesigned 2026-09-16/17)

The source never specifies how the player obtains SSH access — this
mechanism is entirely a project-owner design decision, not sourced. Two
native-tool attempts were tried and abandoned first (`john`, `hydra` — see
`docs/bugs.md` entry 3 for why both failed). Final mechanism: Adrian's mail
carries an attachment, `old-creds.bak`, containing a SHA-256 hash
(`"auditor:Kx8!rTn2Vq"`) of the real SSH credentials. The player runs a
fully custom, mod-controlled `crackhash <hash>` command (not a real
cracker — a fixed lookup against that one hash) to recover both the
username and password at once. Credentials are found, not handed over in
plaintext in the mail body — the user explicitly rejected putting the
password directly in the mail text.

```text
Username: auditor
Password: Kx8!rTn2Vq
```

### Report body

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

### Adrian's reaction — A/B/C branching phone call

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

Player picks one of three response lines (none punished — characterization,
not a skill check):

```text
A) "Then why are you asking me to stop?"
   Adrian: Because I don't want a routine audit turning into
           something I can't explain to the client.

B) "Fine. I'll leave it."
   Adrian: Appreciate it.

C) "I think someone removed the logs."
   Adrian: Don't make that assumption yet.
```

This is the explicit start of Adrian's arc: **Complicity → Responsibility**.
Implemented as three `Dialog` branches (`postReportA`/`B`/`C`) reached via
`switchBranch` — required removing every `onEnd`/`onSelect` function
property from the whole `Dialog` object first; see `docs/bugs.md` entry 1.

### Quest completion

Source's thematic framing:

```text
MISSING LOGS

You were asked to determine when an old server was last active.
You couldn't.
Not because the evidence wasn't there.
Because part of it wasn't.
```

Implemented completion mail (adapted, since the hold-mail/A-B-C reaction
already carries the thematic beat above):

```text
You couldn't confirm it, and neither can I right now.

Leave it here for the moment.

Payment's on the way.

— Adrian
```

### Transition to Q04

```text
Adrian: Client closed the ticket.
Adrian: They're decommissioning the server.
Adrian: So we're done.

Player: That's it?
Adrian: That's it.
Adrian: And for what it's worth... I'd leave this one alone.

CUT TO Q04 — LEAVE IT ALONE
```

Escalation stays grounded per the source's own explicit design note: Q03
must not end with "the government is hiding something" — too fast. No
villain, no conspiracy dump, just a small human choice setting up Q04.

### Security-Assessment Boundary

Same posture as Q01/Q02 — reconnaissance and log review only, using
access/credentials already granted through the existing contract.

### Post-FINAL-LOCK polish (2026-09-15, non-bug)

On top of the real bugs from this pass (`docs/bugs.md` entries 1, 5, 6,
13–16), the custom command placeholder name `archgrep` was renamed to
`zgrep` (confirmed not to collide with any native command — native
`grep`/`zgrep` can't decompress `.gz` content at all), and `filestat`/
`bootlog`/`zgrep` output was reformatted into bordered ASCII tables /
per-match blocks to fix two terminal-rendering issues — see `docs/bugs.md`
entry 10.

### Persistent state

```text
entity_resolution.q03.completed
entity_resolution.q03.logs_missing
entity_resolution.q03.backup_checked
entity_resolution.q03.backup_restricted
entity_resolution.q03.cri_policy_found

# Global (campaign-wide, not quest-scoped):
entity_resolution.adrian_suspicious
entity_resolution.adrian_warned_player
```

### Changes from original source

| Original | Current | Why |
|---|---|---|
| Client **Meridian Logistics**, host `edge-03.meridian.local`, ID `dead_signal_q03` | **Skynet Logistics**, `edge-03.skynet-logistics.idx`, `entity_resolution.q03` | Same project-wide rename. |
| Reward **$350 / +40 XP** | **$300 / 100 XP max** (80 mandatory + 20 optional) | Phase 8 economy-lock rebalance. |
| Single "determine last activity" objective | Split into `checkTimestamp` (file stat) + `reviewBootHistory` (boot log) | Two independently-completable custom commands (`filestat`, `bootlog`) needed distinct completion signals. |
| Source examples use generic `stat`/`journalctl`/`zgrep` commands | Implemented as custom `@RegisterCommand`s (`filestat`, `bootlog`, `zgrep`) using the SDK's `Files` namespace + `resolvePath` | None of `stat`/`journalctl`/`zgrep` exist as native HackHub commands — confirmed via SDK type search. Custom commands were the only path; `zgrep` coincidentally kept its source name since it didn't collide with any native command. |
| Adrian's A/B/C branching dialogue as designed | Same three branches, but every `onEnd`/`onSelect` function property removed from the `Dialog` object | Those callbacks are confirmed permanently broken in this HackHub build (full external bug report filed — see the future bugs file). `switchBranch` alone, with zero function properties anywhere in `Dialog`, was the only working path to the same three branches. |
| `adrian_suspicious`/`adrian_warned_player` treatment unclear | Confirmed global (not `q03.`-scoped) flags, first actually set here | Source itself writes these without a per-quest prefix; Q03's recovery pass resolved the ambiguity left open by Q02. |
| Source never specifies how the player obtains SSH access | New `findAccess` objective (00): mail attachment `old-creds.bak` with a SHA-256 hash, cracked via custom `crackhash` command | Entirely a project-owner design decision (2026-09-16/17), not sourced — needed after two native-tool attempts (`john`, `hydra`) both failed for reasons outside mod control. See `docs/bugs.md` entry 3. |

## Q04–Q16 (current design intent — not yet live-implemented)

None of Q04–Q16 are registered/playable yet (structural skeleton only, per
`docs/implementation-notes.md`) — "current" here means "current
design intent," not live game state. Full narrative (mail bodies, dialogue
scripts) beyond objective/reward/dependency level has not been recovered for
Q04–Q13/Q16 the way it has for Q01–Q03/Q14/Q15.

Dependency chain is strictly linear: `Q01→Q02→...→Q16→{DESTROY|EXPOSE|OVERRIDE}`,
one chapter per 4 quests (`GHOST SERVER` Q01–04, `THE LIST` Q05–08,
`FALSE POSITIVE` Q09–13, `THE OVERRIDE` Q14–16 — only Chapter 1's title is a
confirmed rename from source; Chapters 2–4 keep their source titles pending a
decision).

| Quest | Title | Chapter | Objectives (mand./opt.) | Money max | XP max |
|---|---|---|---:|---:|---:|
| Q04 | LEAVE IT ALONE | 1 | 4 / 1 | $350 | 100 |
| Q05 | SECOND CLIENT | 2 | 4 / 1 | $400 | 100 |
| Q06 | THE DATABASE | 2 | 4 / 2 | $450 | 120 |
| Q07 | CONNECTIONS | 2 | 3 / 1 | $500 | 120 |
| Q08 | YOUR NAME | 2 | 3 / 1 | $550 | 120 |
| Q09 | RIZKY PRATAMA | 3 | 4 / 1 | $600 | 125 |
| Q10 | THE FALSE CONNECTION | 3 | 4 / 1 | $650 | 130 |
| Q11 | DANIEL | 3 | 4 / 1 | $650 | 130 |
| Q12 | THE PIPELINE | 3 | 4 / 1 | $700 | 140 |
| Q13 | THE OPERATOR | 3 | 4 / 1 | $800 | 150 |
| Q14 | THE OWNER | 4 | 6 / 1 | $700 | 140 |
| Q15 | THE EVIDENCE | 4 | 7 / 1 | $700 | 115 |
| Q16 | THE DECISION | 4 | 9 / 0 | $1,000 | 150 |

Per-quest premise/objective/flag detail for Q04–Q13 and Q16 (below) is
unchanged from the Phase 8 spec in `docs/source-original.md` beyond the
`dead_signal_qNN` → `entity_resolution.qNN` naming rename (see Changes at the
end) — no design content has diverged for this range, so it's reproduced
here in full, in current naming, rather than left as a cross-reference.

### Q04 — LEAVE IT ALONE

```text
ID: entity_resolution.q04 · Chapter 01 — GHOST SERVER · Jakarta · Primary: Adrian
Depends on: entity_resolution.q03.completed = true · Next: Q05
```

Objectives (4 mandatory + 1 optional): `reviewDecommissionNotice` →
`verifyServerStatus` (ping/nmap, same ports as Q02) → `closeAudit` →
`decideOnEvidence` (leave it alone / keep a copy / take one last look) →
optional `checkLastConnection` (`10.42.7.18` shows a `gateway.log` session
with no matching `auth.log` entry — a log/auth mismatch).

Reward: $350 money, 100 XP max (20 per line: decommission status, active
server, last connection, auth/log mismatch, recognize anomalous evidence).

State: `entity_resolution.q04.completed`, `.last_connection_checked`,
`.cri_ip_confirmed`, `.log_mismatch_found`, plus campaign-wide
`adrian_warned_player = true`, `unknown_contacted_player = true`,
`cri_known = false`.

### Q05 — SECOND CLIENT

```text
ID: entity_resolution.q05 · Chapter 02 — THE LIST · Jakarta
Primary: Adrian · Supporting: Maya Hart (introduced)
Depends on: entity_resolution.q04.completed = true · Next: Q06
```

Objectives (4 + 1 optional): `reviewScope` → `inspectApiSurface`
(`staging.nusantarapay.id`) → `identifyClassificationEndpoints`
(`/api/internal/classification`, no auth bypass) → `inspectStagingEnvironment`
→ optional `enumerateApi`.

Reward: $400 money, 100 XP max.

State: `entity_resolution.q05.completed`, `.arka_infrastructure_found`,
`.classification_api_found`, `.api_enumerated`, `.maya_contacted`,
`.maya_replied`, plus campaign-wide `adrian_knows_pattern = true`.

### Q06 — THE DATABASE

```text
ID: entity_resolution.q06 · Chapter 02 · Jakarta
Primary: Adrian · Supporting: Maya
Depends on: entity_resolution.q05.completed = true · Next: Q07
```

Objectives (4 + 2 optional): `inspectDatabase` → `identifySystemMetadata`
(first quest to confirm "Civic Risk Index / CRI") → `inspectDataSources` →
`investigateRizky` (HIGH/74/0.58/PENDING/AUTOMATED) → optional `checkModel`
(CRI-Core v3.7) → optional `traceRecord` (score history LOW→MEDIUM→HIGH).

Reward: $450 money, 120 XP max.

State: `entity_resolution.q06.completed`, `.cri_database_found`,
`.cri_definition_found`, `.model_metadata_found`, `.data_sources_found`,
`.rizky_found`, `.rizky_high_risk`, `.rizky_low_confidence`,
`.rizky_history_found`, `.rizky_score_jump_found`,
`.maya_contact_established`, `.maya_trust_increased`, plus campaign-wide
**`cri_known = true`**.

### Q07 — CONNECTIONS

```text
ID: entity_resolution.q07 · Chapter 02 · Jakarta → Bandung
Primary: Daniel (introduced) · Supporting: Maya + Adrian
Depends on: entity_resolution.q06.completed = true · Next: Q08
```

Objectives (3 + 1 optional): `inspectRelationshipData` →
`identifyAssociationWeighting` → `compareSubjects` (Rizky/Dimas/Naufal) →
optional `mapNetwork` (finds `SUBJECT-88172`, restricted).

Reward: $500 money, 120 XP max.

State: `entity_resolution.q07.completed`, `.relationship_system_found`,
`.association_weight_found`, `.risk_contribution_found`, `.network_mapped`,
`.restricted_subject_found`, plus campaign-wide `daniel_introduced = true`,
`daniel_pipeline_confirmed = true`, `daniel_trust = 1`,
`adrian_knows_network_analysis = true`, `adrian_complicity_increased = true`,
`maya_player_record_found = true`, `cri_uses_relationships = true`.

### Q08 — YOUR NAME

```text
ID: entity_resolution.q08 · Chapter 02 · Jakarta
Primary: Maya · Supporting: Adrian + Daniel
Depends on: entity_resolution.q07.completed = true · Next: Q09 (Chapter 3 begins)
```

Objectives (3 + 1 optional): `locatePlayerRecord` →
`inspectPlayerClassification` (LOW/18/0.94/MANUAL/ENTITY_ASSOCIATION) →
`inspectPlayerRelationship` (player → `SUBJECT-88172`) → optional
`identifyRestrictedSubject` (match_confidence 0.67).

Reward: $550 money, 120 XP max. No XP for emotional/roleplay choices.

State: `entity_resolution.q08.completed`, `.player_record_found`,
`.player_record_active`, `.player_risk_level = LOW`, `.player_manual_review`,
`.player_review_reason = ENTITY_ASSOCIATION`, `.restricted_subject_linked`,
`.entity_match_checked`, `.low_match_confidence_found`,
`.player_linked_to_subject`, `.rizky_linked_to_subject`, plus campaign-wide
`daniel_entity_resolution_concern = true`, `maya_player_record_found = true`,
`player_in_cri = true`.

### Q09 — RIZKY PRATAMA

```text
ID: entity_resolution.q09 · Chapter 03 — FALSE POSITIVE · Jakarta
Primary: Maya · Supporting: Daniel
Depends on: entity_resolution.q08.completed = true · Next: Q10
```

Objectives (4 + 1 optional): `reviewRizkyCase` → `interviewRizky` →
`inspectCriClassification` → `verifyCom07` (missing phone record) → optional
`checkSource`. Critical rule: never conclude "no communication occurred,"
only "cannot currently be supported by available records."

Reward: $600 money, 125 XP max (largest single line: 20 XP for **correctly
concluding evidence is insufficient**).

State: `entity_resolution.q09.completed`, `.rizky_interviewed`,
`.rizky_case_reviewed`, `.source_conflict_found`, `.source_checked`,
`.manual_clearance_found`, plus campaign-wide
`rizky_false_connection_suspected = true`, `cri_data_integrity_questioned = true`.

### Q10 — THE FALSE CONNECTION

```text
ID: entity_resolution.q10 · Chapter 03 · Jakarta → Bandung
Primary: Daniel · Supporting: Maya
Depends on: entity_resolution.q09.completed = true · Next: Q11
```

Objectives (4 + 1 optional): `locatePipelineArchive` → `inspectRawSource` →
`traceEntityResolution` (PERSON-19382 → SUBJECT-88172, confidence 0.67,
ACCEPT) → `identifyProvenanceGap` (source never contained SUBJECT-88172) →
optional `checkResolutionLog`.

Reward: $650 money, 130 XP max.

State: `entity_resolution.q10.completed`, `.pipeline_archive_found`,
`.entity_resolution_found`, `.relationship_generated_by_resolution`,
`.entity_match_confidence = 0.67`, `.source_provenance_incomplete`,
`.resolution_log_checked`, `.resolution_decision_found`, plus campaign-wide
`daniel_pipeline_understood = true`, `daniel_accountability_increased = true`.

### Q11 — DANIEL

```text
ID: entity_resolution.q11 · Chapter 03 · Bandung
Primary: Daniel · Supporting: Maya
Depends on: entity_resolution.q10.completed = true · Next: Q12
```

Objectives (4 + 1 optional): `inspectHistoricalArchitecture` →
`compareResolvers` (review became conditional, not removed) →
`identifyReviewException` → `inspectDanielsChange` (`resolver-service`,
2026-01-18) → optional `checkTheChange`. No XP for accusing Daniel of being
the manipulator.

Reward: $650 money, 130 XP max.

State: `entity_resolution.q11.completed`, `.historical_pipeline_found`,
`.old_review_flow_found`, `.current_review_flow_found`,
`.automated_acceptance_found`, `.human_review_exception_found`,
`.daniel_component_confirmed`, `.daniel_change_found`,
`.review_coverage_reduced`, plus campaign-wide
`daniel_complicity_confirmed = true`, `daniel_accountability_increased = true`.

### Q12 — THE PIPELINE

```text
ID: entity_resolution.q12 · Chapter 03 · Bandung → Jakarta
Primary: Daniel · Supporting: Maya
Depends on: entity_resolution.q11.completed = true · Next: Q13
```

Objectives (4 + 1 optional): `inspectPolicyHistory` (`POL-1847`) →
`compareConfigurations` → `identifyReviewBehaviorChange`
(REQUIRED→CONDITIONAL, bypass enabled) → `determineCom07Behavior` → optional
`checkChangeHistory` (approval identity redacted).

Reward: $650 base + $50 optional = $700 max, 140 XP max.

State: `entity_resolution.q12.completed`, `.policy_found`,
`.legacy_policy_found`, `.current_policy_found`, `.conditional_review_found`,
`.approved_source_bypass_found`, `.com07_review_not_required`,
`.policy_change_found`, `.policy_history_found`,
`.policy_deployment_date_found`, `.approval_identity_redacted`, plus
campaign-wide `cri_policy_change_confirmed = true`,
`cri_automation_expanded = true`.

### Q13 — THE OPERATOR

```text
ID: entity_resolution.q13 · Chapter 03 · Jakarta
Primary: Maya · Supporting: Daniel + Adrian
Depends on: entity_resolution.q12.completed = true · Next: Q14 (Chapter 4 begins)
```

Objectives (4 + 1 optional): `searchOperationalAudit` →
`identifyPrivilegedIdentity` (`OVERRIDE_OPERATOR`) → `traceActivity`
(session `A-77402`) → `correlateOriginNetwork` (`10.42.7.31` → ARKA admin
network) → optional `investigateFirstUse`. No XP for concluding Marcus is
the operator — explicitly wrong at this stage.

Reward: $700 base + $100 optional = $800 max, 150 XP max.

State: `entity_resolution.q13.completed`, `.override_account_found`,
`.override_account_active`, `.policy_deployment_linked`,
`.configuration_activity_found`, `.com07_policy_activity_found`,
`.arka_network_origin_confirmed`, `.first_use_found`,
`.override_account_origin_found`, `.override_audit_found`,
`.operator_account_confirmed`, `.operator_identity_unknown = true`.

### Q16 — THE DECISION

```text
ID: entity_resolution.q16 · Chapter 04 — THE OVERRIDE · Jakarta
Primary: Unknown · Supporting: Maya + Daniel + Victor (introduced) + Marcus
Depends on: entity_resolution.q15.completed = true · Last quest, no Next.
```

Objectives (9 mandatory, no optional): `traceArkaOps0441` →
`compareInterventionSessions` → `findInternalConcern` (`OPS-CONCERN-1847`,
closed no action) → `establishFirstIntervention` → `reconstructInterventionPattern`
→ `confrontUnknown` (identity = `ARKA-OPS-0441`/`OVERRIDE_OPERATOR`) →
`evaluateFinalEvidence` (`OPS-REVIEW-0441`) → `obtainGovernanceAuthorization`
(Victor's temporary emergency authorization) → `makeFinalDecision` (DESTROY /
EXPOSE / OVERRIDE, same reward for all three, no ending weighted as
"correct").

Reward: $1,000 flat, 150 XP max, identical for all three endings.

State: as above plus `entity_resolution.ending = "DESTROY" | "EXPOSE" |
"OVERRIDE"`.

### Q14 / Q15 — superseded twice, now LOCKED

Q14 and Q15 are the only two quests in the campaign with a dedicated,
more-authoritative locked spec supplied after Phase 8 (source files kept
outside the repo, binary). **This locked spec is what `src/content/q14.ts`
and `q15.ts` actually implement today** — Phase 8's numbers below are
historical, not current.

```text
Q14 — THE OWNER: 6 mandatory + 1 optional (findAccessRegistry, traceAccessWindow,
findAuthorization, resolveApprover, speakToMarcus, askAboutSession,
+ optional checkAccessJustification). $700 flat, 140 XP max (20 per objective,
the +20 optional is the only LOCKED-confirmed per-objective figure; the rest
are an even best-effort split). No SSH/network target — local Files.* access
only (corrected from Phase 8's assumption).

Q15 — THE EVIDENCE: 7 mandatory + 1 optional (retrievePrimaryAuditExport,
reconstructSessionA77402, traceUserReference, reconstructSessionTimeline,
comparePolicyVersions, traceRizkyPipeline, correlateOperatorIdentity,
+ optional checkPreviousPolicy). $700 flat, 115 XP max (90 mandatory + 25
optional, both LOCKED-confirmed totals). Also local Files.* access only.
```

### Changes from original source

| Quest | Original | Current | Why |
|---|---|---|---|
| Q04 | Chapter-1-Resume draft: 4/1 objectives, $350 + 45/15 XP | Phase 8: 4/1 objectives, $350 + 100 XP max | Phase 8 re-specified Q04's numbers before implementation; no story change. |
| Q05–Q13, Q16 | `dead_signal_qNN` IDs, Phase 8 objective/reward spec | `entity_resolution.qNN` IDs, same spec | Naming rename only — Phase 8 is the original source for this range, so nothing else changed. |
| Q14 | Phase 8 draft: 4 mandatory + 1 optional, title "THE OWNER" already set | LOCKED spec: 6 mandatory + 1 optional (`traceAccessWindow`, `askAboutSession` added; `traceDelegatedAccess` turned out to be objective-01 result data, not its own objective) | A dedicated, more detailed locked source was supplied after Phase 8 and treated as authoritative. |
| Q14 | Phase 8: implied a network/SSH target | LOCKED spec: local `Files.*` access only, no `Network.createSubnetNetwork` | LOCKED source frames the evidence as "an authorized forensic export," not a remote host to breach; cross-checked against an earlier, later-reverted implementation attempt in git history that already made the same call independently. |
| Q15 | Phase 8 draft: 5 mandatory + 1 optional, ~$700 base + $200 optional guess | LOCKED spec: 7 mandatory + 1 optional (`reconstructSessionA77402`, `traceUserReference` split out), **$700 flat**, 90 XP mandatory + 25 XP optional (both exact, LOCKED-confirmed) | Same reasoning as Q14 — dedicated locked source supersedes the Phase 8 guess. |
| Q14/Q15 | — | Both explicitly documented "never set" flags (e.g. `marcus_operated_account`, `operator_intent_confirmed`) | LOCKED source is explicit that these two quests must not imply Marcus or the operator's guilt/intent prematurely — carried into the skeleton as a guardrail comment, not a story change. |
