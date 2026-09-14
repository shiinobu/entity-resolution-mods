# ENTITY RESOLUTION — Q01 Live Validation

Status: **PASSED — 2026-09-13** (see `docs/phase13-q01-final-lock.md` for the locked contract this validates)

## Preconditions

Use the development replay package for repeatable testing:

```powershell
npm run build:replay:q01
```

Install the complete `dist-replay/` contents into `HackHub/mods/entity-resolution-dev/` and restart HackHub.

Use a fresh replay build after each code change. Each replay build receives a new quest identity.

## Live Scenario

1. Confirm `THE CONTRACT — DEV REPLAY` is visible in HackHub.
2. Accept the development quest.
3. Confirm Adrian's Q01 contract mail arrives from:

```text
adrian.cole@phantom-net.void
```

4. Confirm the six locked objective names are presented in this order, with `nmap`/`lynx`/`dirhunter` icons on Objectives 02–04:

```text
Review audit scope
Scan the ip target                    (nmap icon)
Identify the exposed web presence     (lynx icon)
Enumerate hidden pages                (dirhunter icon)
Perform basic vulnerability checks
Submit audit report
```

5. Confirm Objective 01 does **not** auto-complete on accept. Open the mail from Adrian; only then does Objective 01 complete and Objective 02 unlock.
6. Confirm the audit mail provides target `203.0.113.42` but does **not** provide the public web URL, company answer, open-port answer, or security-page URL in the report template.
7. Open Terminal and run the scan command from Objective 02:

```bash
nmap
```

The implementation also accepts `nmap 203.0.113.42` for compatibility with the terminal runtime.

8. Confirm the result contains:

```text
22/tcp  CLOSE  ssh
80/tcp  CLOSE  http
443/tcp OPEN   https
```

9. Confirm Objective 02 is satisfied (Objective 03 does not complete from nmap alone).
10. Discover the canonical public web host from the target IP:

```bash
lynx 203.0.113.42
```

The implementation also accepts:

```bash
lynx https://203.0.113.42/
```

11. Confirm the Lynx response exposes:

```text
Address: https://www.skynet-logistics.idx/
Additional: Skynet Logistics / Jakarta Operations / Canonical public web host discovered from the target IP.
```

12. Confirm Objective 03 completes from this Lynx result.
13. Install and run the **native** `dirhunter` command against the discovered host:

```bash
apt-get install dirhunter
dirhunter https://www.skynet-logistics.idx/
```

14. Confirm dirhunter returns exactly:

```text
/
/portal
/status
/security
```

15. Confirm Objective 04 completes from this real native `Terminal.Dirhunter` event (no fixture/custom command involved).
16. Open the discovered paths in the FirebearBrowser:

```text
https://www.skynet-logistics.idx/
https://www.skynet-logistics.idx/portal
https://www.skynet-logistics.idx/status
https://www.skynet-logistics.idx/security
```

17. Confirm `/` is the public homepage, `/portal` and `/status` return `403 FORBIDDEN`, and `/security` is the only real audit surface.
18. Confirm the `/security` page uses the black/green terminal-style presentation and shows the audit findings, including 443/tcp as OPEN and the basic assessment conclusion.
19. Confirm Objective 05 completes only from the HTTPS `Browser.Meta` interaction against `https://www.skynet-logistics.idx/security` (requires Objectives 03 and 04 already complete).
20. Verify that HTTP does not provide a Q01 audit path because port 80 is closed.
21. Submit the audit report using Adrian's supplied format:

```text
Format report audit:
Subject: Security Audit — Jakarta

Target: <COMPANY>
Open Ports: <PORTS>
Url: <URL>

No critical vulnerabilities identified.
Further internal assessment is recommended.
```

22. Replace `<COMPANY>`, `<PORTS>`, and `<URL>` with the discovered values and send the normal in-game mail/reply.
23. Confirm Objective 06 completes only for the resolved canonical values (including the new `Url:` line), while literal placeholders do not complete the objective.
24. Confirm the development quest finishes, Adrian replies, and MISSION COMPLETE is shown.
25. Confirm the replay build does not grant production XP/money and does not set:

```text
entity_resolution.q01.completed
```

26. Confirm no Q14 or Phase 12 diagnostic content is exposed by the replay package.

## Objective 05 Boundary

Objective 05 (`basicVulnerabilityChecks`) requires the following completed discovery chain before the final browser interaction:

```text
lynx 203.0.113.42
  ↓
https://www.skynet-logistics.idx/
  ↓
dirhunter https://www.skynet-logistics.idx/
  ↓
/, /portal, /status, /security
  ↓
Browser.Meta
```

The final browser interaction must use:

```text
protocol: https:
hostname: www.skynet-logistics.idx
pathname: /security
```

Native SSH is not part of the Q01 acceptance path.

## Web Boundary

One host, four paths:

```text
www.skynet-logistics.idx
  /          → public homepage
  /portal    → 403 FORBIDDEN
  /status    → 403 FORBIDDEN
  /security  → audit target
```

The apex domain (`skynet-logistics.idx`) is not registered as a Website or a live domain. The canonical public host is discovered through Lynx; the four paths are discovered through native `dirhunter`.

## Open-Port Boundary

The Q01 target exposes only:

```text
22/tcp  CLOSE
80/tcp  CLOSE
443/tcp OPEN  https
```

Canonical HTTPS URLs omit `:443`. Where Browser.Meta supplies an explicit port, Q01 accepts only port `443` for the audit target.

## Email Boundary

Adrian's sender identity is canonical and must never be randomized:

```text
character.adrian.cole
adrian.cole@phantom-net.void
```

Submission values are discovered rather than supplied directly:

```text
recipient = adrian.cole@phantom-net.void
subject   = Security Audit — Jakarta
body      = resolved report using the supplied template (Target/Open Ports/Url)
```

## Production Gate

**PASSED.** The full scenario above succeeded in the real HackHub runtime on 2026-09-13; the observed result is recorded in `docs/phase13-q01-final-lock.md`.
