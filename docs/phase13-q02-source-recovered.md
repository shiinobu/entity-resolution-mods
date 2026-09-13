# ENTITY RESOLUTION — Q02 Source Recovered

Date: 2026-09-13
Status: **IMPLEMENTED — LIVE VALIDATION PENDING** (source gate closed; see confirmations and implementation notes below)

## User confirmations (2026-09-13)

1. Naming adaptation (Skynet Logistics / `edge-03.skynet-logistics.idx`) — **confirmed**.
2. "Identify CRI-related hostname" (10 XP) treated as a bonus inside Objective 04, not a 6th objective — **confirmed**.
3. Use the current refactored naming/structure throughout (`entity_resolution.*`, `EntityResolutionQ0xQuest` pattern) — **confirmed**.

## Implementation notes (technical mapping decisions, not story canon)

- **Target IP** (`203.0.113.77`): the source never specifies one for `edge-03`; chosen from the same RFC 5737 TEST-NET-3 documentation range as Q01's `203.0.113.42`, just a different host.
- **Mail subjects**: the source doesn't give explicit `Subject:` lines for Q02's incoming mail or the outgoing report (unlike Q01, which had an explicit report subject). Chosen: incoming `"One more thing"`, report `"Anomaly Report — edge-03"`.
- **Objective 03 ("Identify the service") gating**: implemented as running `nmap` with the `-sV` flag against the target (service-version detection), reusing the same `nmap` fixture as Objective 02 rather than a second command — the returned `NmapPort.version` field on port 8443 carries the `X-Service: gateway.internal` reveal.
- **Objective 04 ("Inspect the certificate")**: no native SDK command exists for live TLS certificate inspection (`Terminal.Openssl` only operates on local files, not a live host:port handshake — Q01's own history already hit this and worked around it with nmap; recorded here for continuity). Implemented the same way Q01 handled its security review page: a registered `Website` at `edge-03.skynet-logistics.idx`, gated on `Browser.Meta` with `protocol: https:`, `port: "8443"`. The page's HTML lists Subject/Issuer/SAN, including the hidden `cri-gateway.internal` entry as plain page content (not called out specially) — matching the "careful players notice it" design.
- **Optional DNS check**: `nslookup cri-gateway.internal` fixture via `Shell.addCommandData`, same mechanism as Q01's `lynx`/`nmap` fixtures.
- **Q01 prerequisite**: enforced via the native `QuestsToComplete: ["entity_resolution.q01"]` field on the Quest class, rather than a custom flag check.

## Not yet live-validated

The `Browser.Meta` port-8443 gate and the `-sV` flag-based Objective 03 gate are both new mechanisms not proven in this project before (Q01 never used a non-default HTTPS port or an nmap flag check). These need real in-game confirmation the same way `dirhunter` needed testing before it was trusted — do not assume they work until observed live.

Supersedes `docs/phase13-q02-source-gate.md` (BLOCKED). The user supplied the exported design conversation (`ChatGPT-Mengenal Website HackHub-20260913-2050.md`), which contains a full, previously-locked Q02 design pass ("Detailed Quest Design — Q02: THE ANOMALY") plus a later Phase 8 economy-lock pass that finalizes Q02's exact XP/money allocation. This closes the Q01–Q13 detail gap for Q02 specifically.

## Naming adaptation (source uses pre-rename placeholders)

The source predates two renames already locked in this codebase and must be read through them, not implemented literally:

```text
Source name              → Canonical implemented name
dead_signal_q02          → entity_resolution.q02
Chapter 01 — DEAD SIGNAL → Chapter 01 — GHOST SERVER
Meridian Logistics       → Skynet Logistics       (Q01's already-implemented client)
meridian.local           → skynet-logistics.idx   (Q01's already-implemented apex TLD)
dead_signal.* flags      → entity_resolution.* flags
```

Everything below is written in the **already-adapted** (canonical, implemented) naming. The one open question this raises for the user is called out at the end.

## Canonical Identity

```text
ID:            entity_resolution.q02
Title:         THE ANOMALY
Chapter:       01 — GHOST SERVER
Location:      Jakarta
Primary:       Adrian Cole
Prerequisite:  entity_resolution.q01.completed = true
Client:        Skynet Logistics (same client as Q01)
New target:    edge-03.skynet-logistics.idx (a host absent from the client's asset inventory)
Estimated time: 10–15 minutes
Difficulty:    Easy → Medium
Money:         $250
Maximum XP:    90 (80 mandatory + 10 optional)
```

## Opening

A few hours after Q01 closes, Adrian sends a short follow-up — no dramatic notification:

```text
Adrian:
Client has one more thing.

Their external scan doesn't match
their internal asset list.

Can you take a look?
```

He gives the same client, plus one new hostname not present in the inventory Skynet Logistics provided:

```text
Host: edge-03.skynet-logistics.idx
```

Adrian offers a reasonable, non-alarming explanation up front — "It may just be an old asset. Check before I tell the client." — so the player has no reason yet to suspect anything illegal.

## Locked Objectives (5 mandatory + 1 optional)

```text
01 Check the new target       — review Adrian's brief; host not in inventory
02 Scan the host              — nmap edge-03.skynet-logistics.idx
03 Identify the service       — service enumeration on the anomalous port
04 Inspect the certificate    — HTTPS cert inspection reveals ARKA + hidden SAN entry
05 Report the anomaly         — send findings to Adrian
   (optional) Check the DNS   — nslookup the hidden hostname from the cert SAN
```

### 02 — Scan the host

```bash
nmap edge-03.skynet-logistics.idx
```

```text
PORT     STATE    SERVICE
22/tcp   open     ssh
443/tcp  open     https
8443/tcp open     https-alt
```

`8443/tcp` is not part of Skynet Logistics' normal configuration — that's the anomaly hook.

### 03 — Identify the service

Service enumeration on port 8443:

```bash
nmap -sV -p 22,443,8443 edge-03.skynet-logistics.idx
```

The service on 8443 responds:

```text
HTTP/1.1 200 OK
Server: nginx
X-Service: gateway.internal
```

The player doesn't yet know what `gateway.internal` is — just that port 8443 isn't a forgotten web service.

### 04 — Inspect the certificate

HTTPS certificate on port 8443:

```text
Subject: gateway.internal
Issuer:  ARKA Secure Infrastructure
```

Same issuer that appeared incidentally in Q01. This raises the player's first real question: why does ARKA infrastructure sit behind a service the client never listed?

**Hidden clue (not surfaced as an objective):** the certificate's Subject Alternative Name field also lists a second hostname:

```text
Subject Alternative Name:
gateway.internal
cri-gateway.internal
```

`cri-gateway.internal` is never called out by the UI. A careful player notices it; an inattentive player can still complete the quest without it. This is the first breadcrumb toward "CRI" — the term itself is never explained in Q02.

**Design constraint (explicit in source):** Q02 must never mention CRI, CIVIC, GOVERNMENT, RISK, or SURVEILLANCE by name. Only `ARKA`, `gateway.internal`, and "unknown infrastructure" are exposed.

### 05 — Report the anomaly

```text
TARGET: edge-03.skynet-logistics.idx

FINDINGS:
- Host is absent from provided asset inventory.
- SSH exposed.
- HTTPS exposed on 443.
- Additional HTTPS service exposed on 8443.
- 8443 identifies itself as gateway.internal.
- Certificate issued by ARKA Secure Infrastructure.

RECOMMENDATION:
Confirm ownership and purpose of the host.
```

The player does not accuse anyone — professionally recommends confirming ownership/purpose only.

### Adrian's reaction (first behavioral anomaly)

Instead of his usual "I'll forward it," Adrian hesitates:

```text
Adrian: Don't send this to the client yet.
Player: Why?
Adrian: I want to confirm something first.
Player: What?
Adrian: Just leave it for now. I'll get back to you.
```

This is the first time Adrian behaves suspiciously — not proof of wrongdoing, but it plants "what does Adrian know?"

### Optional — Check the DNS

After finding the certificate SAN, the player may look up the hidden hostname:

```bash
nslookup cri-gateway.internal
```

```text
Name:    cri-gateway.internal
Address: 10.42.7.18
```

A private IP, unreachable from the player's current environment:

```text
$ ping 10.42.7.18
Request timeout
```

This gives the player "a destination without access" — foreshadowing for Q03/Q04. Explicitly designed as a small, curiosity-driven bonus, not a big reward: **+10 XP, no money.**

### Quest completion

```text
Adrian: Good catch. I'll handle it from here.
Adrian: And don't run another scan on that host.
Player: Understood.
```

Quest ends with the player more curious, not less.

## Rewards (final, from the Phase 8 economy lock — supersedes an earlier $350/35 XP draft)

```text
20 XP — Investigate edge-03 (Objective 01)
15 XP — Service enumeration (Objective 02/03)
15 XP — Certificate inspection (Objective 04, base)
20 XP — Report infrastructure anomaly (Objective 05)
10 XP — Identify CRI-related hostname (Objective 04, hidden SAN bonus)
--------------------------------------------------------------------
80 XP mandatory subtotal

10 XP — Check DNS / private IP (optional)
--------------------------------------------------------------------
90 XP maximum total

$250 (mandatory only; optional objective grants XP, no money)
```

This exactly matches the XP total (90) already recorded in `docs/phase13-step13.1-story-source-audit.md` and the money figure recorded in this same source's final "COMPLETE REWARD MAP" table (`Q02 | $250 | — | $250 | 90`), which also independently reproduces Q01's already-implemented `$200 | 80 XP` — strong cross-confirmation this table is the authoritative final lock, not an earlier draft.

## Persistent State

```text
entity_resolution.q02.completed = true
entity_resolution.q02.anomaly_found = true
entity_resolution.q02.arka_certificate_found = true
entity_resolution.q02.cri_hostname_found = true
entity_resolution.q02.adrian_suspicious = true

# Optional-path only:
entity_resolution.q02.cri_hostname_found = true       (also set by mandatory path per source — see open question)
entity_resolution.q02.cri_private_ip_found = true

# Explicitly NOT set yet:
entity_resolution.cri_known = false   — CRI must not be unlocked as known terminology this early
```

## Transition to Q03

Some time later, Adrian asks the player to send him the raw scan logs for the client. When he reviews them:

```text
Adrian: These logs are incomplete.
Player: They weren't incomplete when I downloaded them.
Adrian: ...
Adrian: Can you check the server history?
```

This is the natural gameplay hook into **Q03 — MISSING LOGS**: the player concludes "someone deleted something" themselves, rather than being told to investigate a conspiracy.

## Security-Assessment Boundary

Same posture as Q01 — reconnaissance only. The source explicitly frames Q02 as "we are not asking the player to hack a server yet, only to perform reconnaissance consistent with their profession." No credential attacks, internal access, or exploitation.

## Open question for the user before implementation

The source lists **six** XP line items for **five mandatory objectives + one optional**, and mentions `cri_hostname_found` in two places with slightly different framing (once as part of the mandatory certificate-inspection clue, once again under the optional DNS-check reward). Before writing the actual quest implementation, please confirm:

1. Is it correct to treat "Identify CRI-related hostname" (10 XP) as a **bonus sub-reward inside Objective 04** (finding the hidden `cri-gateway.internal` SAN entry) rather than a separate 6th mandatory objective? This is my reading of the source, but the objective list explicitly says "5 objectives," so I want to confirm before locking it.
2. Confirm the naming adaptation (Skynet Logistics / `edge-03.skynet-logistics.idx`) is what you want, versus picking a different apex/subdomain for the new host.

Once confirmed, I'll proceed to plan → implement → test → live-validate → lock Q02, the same way as Q01.
