# ENTITY RESOLUTION — Q02 Source Recovered

Date: 2026-09-13 (live-validated 2026-09-14, final stabilization pass 2026-09-14)
Status: **FINAL LOCK — LIVE VALIDATION PASSED** (full Objective 01–05 flow confirmed complete end to end; see "Post-validation stabilization" for fixes made after the initial PASS)

## User confirmations (2026-09-13)

1. Naming adaptation (Skynet Logistics / `edge-03.skynet-logistics.idx`) — **confirmed**.
2. "Identify CRI-related hostname" (10 XP) treated as a bonus inside Objective 04, not a 6th objective — **confirmed**.
3. Use the current refactored naming/structure throughout (`entity_resolution.*`, `EntityResolutionQ0xQuest` pattern) — **confirmed**.

## Implementation notes (technical mapping decisions, not story canon)

- **Target IP** (`203.0.113.77`): the source never specifies one for `edge-03`; chosen from the same RFC 5737 TEST-NET-3 documentation range as Q01's `203.0.113.42`, just a different host.
- **Mail subjects**: the source doesn't give explicit `Subject:` lines for Q02's incoming mail or the outgoing report (unlike Q01, which had an explicit report subject). Chosen: incoming `"One more thing"`, report subject `"Anomaly Report — Skynet Logistics"` (renamed post-validation from an earlier `"Anomaly Report — edge-03"` — see "Post-validation stabilization"). The GoMail compose-template **label** (the dropdown display name, distinct from the mail subject) is `"Anomaly Report"`.
- **nmap targets the IP, not the hostname** — confirmed as intentional by the user: `nmap` genuinely rejects any non-IP argument, and the player is meant to resolve the hostname to an IP themselves (any command they like — `nslookup` is wired as one working option via `Shell.addCommandData("nslookup", Q02_WEB_HOST, Q02_TARGET_IP)`), not be handed the IP directly. Adrian's incoming mail still only gives the `Host:` line, unchanged from the recovered source.
- **Objectives 02 ("Scan the host") and 03 ("Identify the service")** both complete together, but only from `nmap <IP> -sV` — a bare `nmap <IP>` (no flag) completes neither. This uses the native `Terminal.NmapScan` event's `versionScan?: boolean` field (confirmed to exist in the SDK type, though Q02 detects it via `Terminal.Command`'s `args.includes("-sV")` rather than switching event source) as evidence that HackHub's real nmap genuinely renders different columns (VERSION/DESTINATION) depending on the `-sV` flag — confirmed live: the player reported these columns are absent on a bare scan and only appear with `-sV`.
- **Objective 04 ("Inspect the certificate")**: no native SDK command exists for live TLS certificate inspection (`Terminal.Openssl` only operates on local files, not a live host:port handshake — Q01's own history already hit this and worked around it with nmap; recorded here for continuity). Two earlier approaches were tried and rejected before landing here — see live-test findings below (custom port; then hostname-based `gateway.internal`). **Final (adopted):** port 8443 is modeled as `status: "FORWARDED"` with a `destination` field pointing at a genuinely separate IP, `Q02_GATEWAY_IP` (currently the fixed value `66.250.1.99`; will become session-random once this mechanism is confirmed live), registered directly as a `Website.Host` (a raw IP instead of a domain name — **not previously used in this project, experimental**). The page's HTML lists Subject/Issuer/SAN, including the hidden `cri-gateway.internal` entry as plain page content (not called out specially) — matching the "careful players notice it" design. This preserves all 5 objectives and the hidden-clue mechanic, unlike the alternative (folding Objective 03+04 into one nmap reveal), which was considered and rejected because it would surface the hidden SAN entry to every player automatically.
- **Optional DNS check**: `nslookup cri-gateway.internal` fixture via `Shell.addCommandData`, same mechanism as Q01's `lynx`/`nmap` fixtures.
- **Q01 prerequisite**: enforced via the native `QuestsToComplete: ["entity_resolution.q01"]` field on the production Quest class. The replay quest deliberately omits this gate so each quest can be tested independently without replaying the whole chain every time; the full Q01→Q06 chain will get one combined test once Q06 is implemented.

## Live-test findings (2026-09-13)

1. **Bug — native `nmap` rejects hostnames.** Running `nmap edge-03.skynet-logistics.idx` printed the native `Usage: nmap [ip address]` error (nmap only accepts a literal IP), yet Objective 02 still completed — because the handler only checked that a fixture existed for that key, never whether the native command actually produced port data. Fixed by targeting `nmap` at the IP exclusively (mirroring Q01's proven pattern), which also makes the early-return guard correctly reject wrong/invalid input. The `-sV` flag-based split for Objectives 02/03 was later confirmed live and implemented as designed — see the `Terminal.NmapScan`/`versionScan` note above; a bare `nmap <IP>` now completes neither objective, only `nmap <IP> -sV` does.
2. **Bug — custom port not supported.** `https://edge-03.skynet-logistics.idx:8443/` returned a native "Firebear can't find the server" error (not our 404 — the browser never even looked for a registered Website). This ruled out the custom-port approach entirely and led to the raw-IP-forwarded-destination design (see Objective 04 note above).
3. **Bug — mail sent at the wrong step.** `Q02_HOLD_MAIL_CONTENT` ("Don't send this to the client yet...") was mistakenly sent right after the player read Adrian's *first* mail (Objective 01), instead of after the report is submitted (Objective 05) as the source specifies. Moved to the `Mail.Sent` handler, right where the report is detected and Objective 05 completes.
4. **Bug — Objective 04 didn't complete over HTTP.** Confirmed live: browsing `66.250.1.99` without an explicit `https://` prefix rendered the certificate page successfully (HackHub's `Website` system has no protocol concept — it matches on hostname only) but never completed Objective 04, because the quest strictly requires `data.protocol === "https:"`. This is by design, not a bug in the gate itself. An initial fix sent a one-time mail warning from Adrian on plain-HTTP access, but the user correctly flagged this as illogical — Adrian has no way of knowing about a request the player made in their own browser — so the mail was **removed entirely**; see finding 6 for the mechanism that replaced it.
5. **Follow-up — `edge-03.skynet-logistics.idx` had no browsable page.** The host only existed as a `Network`/`nslookup` fixture; visiting it in-browser had no registered `Website` at all. Added `Q02EdgeWebsite` (`Host = Q02_WEB_HOST`) serving a small flavor-only "node status" page — no objective gating, pure narrative consistency (the host now feels real when visited, not just referenced in mail/nmap).
6. **Follow-up — plain HTTP still showed the certificate; fixed mod-side, without any mail.** Live-tested: `http://66.250.1.99/` rendered the real certificate content regardless of protocol, since `Website` pages are otherwise protocol-blind. Fixed by switching `Q02GatewayWebsite` from a static `WebsitePageDefinition` to a `DynamicWebsitePageDefinition`, whose `metadata(context)` function is evaluated **mod-side** (not inside the page's sandboxed iframe) and receives the real requested `context.url` — reliably distinguishing `http://` from `https://`, unlike the earlier-rejected client-side script idea. HTTP now reproduces nginx's actual real-world "400 Bad Request — The plain HTTP request was sent to HTTPS port" response (thematically consistent with `Q02_GATEWAY_SERVICE_VERSION = "nginx 1.18.0"`) — self-contained, in-fiction feedback with no character needing to "know" about it. The now-redundant static hint on Objective 04 ("nmap revealed a forwarded destination. Browse to it over HTTPS.") was removed, since the nginx page alone already teaches the player what went wrong.
7. **Finding — `Mail.registerTemplate` does not merge `{{field}}` placeholders, under this mod's API-v1 compatibility mode.** HackHub logged `Mod "DSS (Development Refresh)" uses API v1 (current: v2). Running in compatibility mode` — under that mode, sending a report via the registered GoMail template produced a `Mail.Sent` event where `subject` was the template's `id` (`"entity_resolution.q02.report"`, not `title`/`label`) and `content` was a **raw JSON object** of the filled field values (e.g. `{"anomalousPort":"8443","serviceName":"gateway.internal","issuer":"ARKA Secure Infrastructure"}`), not the rendered template text. Confirmed via a temporary diagnostic log on `Mail.Sent` (since removed). `isAnomalyReport` now checks two independent paths: the original freehand exact-body match, or (`isTemplateAnomalyReport`) parsing `content` as JSON and checking `anomalousPort`/`serviceName`/`issuer` against named constants (`Q02_ANOMALOUS_PORT`, `Q02_GATEWAY_SERVICE_NAME`, `Q02_CERTIFICATE_ISSUER`) shared with `Q02_REPORT_BODY`/`Q02_REPORT_TEMPLATE_CONTENT`. Not reattempted with `apiVersion: 2` — out of scope for this stabilization pass; kept as a possible future revisit.

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

## Open questions — RESOLVED

Both pre-implementation questions were confirmed by the user before work began (see "User confirmations" at the top): "Identify CRI-related hostname" is a bonus inside Objective 04, and the Skynet Logistics / `edge-03.skynet-logistics.idx` naming adaptation was approved as-is.

## Post-validation stabilization (2026-09-14)

After the initial full PASS, further live testing surfaced additional bugs and polish requests, applied to **both Q01 and Q02** (production + replay) where the underlying mechanism is shared:

1. **Bug — `Mail.unregisterTemplate()` retroactively corrupts sent-mail history.** GoMail re-renders a *previously sent* mail's history entry from its registered template at *view time* (not a snapshot frozen at send time), keyed by template id. Once a mod calls `Mail.unregisterTemplate(id)`, GoMail can no longer find that template to re-render older mail that used it — the history entry degrades to raw JSON + the template id as the subject. This was diagnosed by comparing two screenshots (Q01's history had degraded to JSON after `OnComplete()` ran and unregistered its template; Q02's was still rendering nicely because Q02 hadn't completed yet) and confirmed conclusively by extracting frames (via `ffmpeg`, installed for this purpose) from a user-supplied screen recording, which showed the exact compose-template UI flow and the final "Sent" folder entry rendering correctly at send time. **Fix:** removed every `Mail.unregisterTemplate()` call from `OnComplete`/`OnAbandon` in `q01-quest.ts`, `q02-quest.ts`, and both replay quests. Report templates now stay registered permanently (harmless — a small, permanent entry in GoMail's compose dropdown).
2. **Bug — `Mail.send()` does not fire reliably from inside a `setTimeout` callback.** Q02's original hold-mail pacing used a `setTimeout` to delay `sendAdrianMail(...)` (a nested `setTimeout` chain at first, then two flat/parallel `setTimeout` calls after the nesting was ruled out) — in both forms, the hold mail never arrived. Meanwhile `completeObjective(...)` called from inside its own `setTimeout` worked reliably every time (confirmed by Q01's already-proven single-timer pattern). Isolating the difference: the callback invoking `Mail.send` (directly or via `sendAdrianMail`) was the one that silently failed; the callback invoking only `completeObjective` was not. **Fix:** the Q02 hold mail is now sent **synchronously** (no delay) the instant the report is validated; only `completeObjective` is deferred, via a single flat `setTimeout` — mirroring Q01's proven shape exactly.
3. **Content-declaration refactor.** `Q01_COMPLETION_MAIL_CONTENT` and `Q02_COMPLETION_MAIL_CONTENT` were originally declared as local literals duplicated inside each quest file (production vs. replay), because their wording genuinely differs (production mentions the real money reward; replay says "DEV replay complete."). Per the project's "quest files only call, `content/` declares" rule, both are now defined once in `content/q01.ts` / `content/q02.ts` as explicitly named `_PRODUCTION` / `_REPLAY` variants, imported by the respective quest file — preserving the deliberate wording divergence while eliminating stray literals outside `content/`.
4. **Hint cleanup.** Objective 02's hint simplified from "nmap only accepts an IP address. Resolve the hostname first." to just **"Resolve the hostname."** Objective 05's hint ("Reply to Adrian with your findings.") removed entirely, since the GoMail compose template already teaches the report format interactively (mirrors the same reasoning already applied to Objective 04's hint removal).
5. **Naming polish.** Report subject renamed `"Anomaly Report — edge-03"` → `"Anomaly Report — Skynet Logistics"`. Gateway page `<title>` renamed `"gateway.internal — Certificate"` → `"Private Gateway"`.
6. **Delay tuning.** `Q01_SUBMIT_AUDIT_DELAY_MS` 15s → 7s. Q02's pacing collapsed from two additive delays (`Q02_HOLD_MAIL_DELAY_MS` 10s + `Q02_COMPLETION_DELAY_MS` 25s, removed per finding 2 above) to a single `Q02_COMPLETION_DELAY_MS`, tuned 10s → final **20s**.
