# HackHub — Hacking Tools & Commands Reference

**Scope: global, not tied to any single phase or quest.** This is the one
place that tracks (1) every hacking/security tool HackHub's SDK exposes
natively, (2) every custom terminal command this project has built, and (3)
which quest/objective uses which tool. Update this file whenever a quest
introduces or confirms a new tool — do not let it drift out of sync with the
per-quest `docs/phaseNN-qNN-source-recovered.md` files, which remain the
narrative/design source of truth; this doc is the tools-only cross-reference
over all of them.

## How to read this doc

- **Native** — built into HackHub itself. We only supply data (via
  `Shell.addCommandData`), network/user declarations (via
  `Network.createSubnetNetwork`), or listen to the tool's event(s). We do not
  own or control the tool's internal behavior.
- **Custom** — a command this project wrote from scratch as a `Command`
  subclass registered with `@RegisterCommand`. We own 100% of its logic.
- **Source of truth for the Master Tool Registry below**:
  `node_modules/@hotbunny/hackhub-content-sdk/index.d.ts`, specifically the
  `ModEventMap` interface (event names HackHub's native tools fire) and the
  `Shell.CommandDataMap` interface (built-in commands that accept typed
  `Shell.addCommandData` responses). This is bundled with the project itself
  — re-grep that file directly if the SDK version ever changes; do not rely
  on external wikis for this list (checked 2026-09-15: the community wiki at
  `hackhubultimatehackersimulator.wiki` was incomplete/inconsistent against
  the actual SDK types — e.g. it never mentions `dirhunter`, `subfinder`,
  `nuclei`, `bettercap`, `sqlmap`, or Metasploit's moddable event hooks, all
  of which the SDK's own types confirm exist).

## 1. Master Tool Registry (every native hacking tool the SDK exposes)

### Recon / info-gathering

| Tool | SDK hook(s) | What it does |
|---|---|---|
| `nmap` | `Terminal.NmapScan`, `CommandDataMap.nmap` | Port/service scan against an IP |
| `lynx` | `Terminal.Lynx.Search`, `Terminal.Lynx.Lookup`, `CommandDataMap.lynx` | Terminal-based web browsing/lookup |
| `nslookup` | `Terminal.Nslookup`, `CommandDataMap.nslookup` | Resolve a hostname to an IP |
| `whois` | `Terminal.Whois`, `CommandDataMap.whois` | Domain/IP registration lookup |
| `mxlookup` | `Terminal.Mxlookup`, `CommandDataMap.mxlookup` | Mail-exchange record lookup |
| `dig` | `Terminal.Dig` | DNS record lookup |
| `geoip` | `Terminal.Geoip`, `CommandDataMap.geoip` | Geolocate an IP |
| `ifconfig` | `Terminal.Ifconfig` | Show the player's own network interface/IP |
| `dirhunter` | `Terminal.Dirhunter` (`{host, results}`) | Enumerate hidden paths on a web host |
| `subfinder` | `Subfinder.Try`, `Subfinder.Results` | Subdomain enumeration — **native, collides with our custom `subfinders`**, see §2 |
| `nuclei` | `Nuclei.Item`, `Nuclei.Results` | Templated vulnerability scanning |

### Access / connection

| Tool | SDK hook(s) | What it does |
|---|---|---|
| `ssh` | `Terminal.SSH.Connected`/`.Disconnected`/`.FileDownload`/`.Shutdown`, `CommandDataMap.ssh` | Remote shell session — requires `-h [user@ip]` syntax, not a bare IP |
| `ftp` | `Terminal.FTP.Connect`, `CommandDataMap.ftp` | File transfer session |
| `weechat` | `WeeChat.Connected`/`.Disconnected`/`.Message`, `CommandDataMap.weechat` | IRC chat client |

### Password / credential attacks

| Tool | SDK hook(s) | What it does |
|---|---|---|
| `hydra` | `Terminal.Hydra`, `Terminal.Hydra.Try`, `CommandDataMap.hydra` | Online brute-force login |
| `hashcat` | `Hashcat` | GPU hash cracking |
| `john` | `John.DecryptHash` | Wordlist-based hash cracking (John the Ripper) |
| `fern` | `Fern.FindPassword` | WiFi password recovery |

### Network attack / MITM

| Tool | SDK hook(s) | What it does |
|---|---|---|
| `bettercap` | `Bettercap.Open`/`.Close`/`.NetProbe`/`.NetShow`/`.WifiRecon`/`.WifiDeAuth` | Network MITM / WiFi recon & deauth |
| `wireshark` | `Wireshark.Started`/`.Stopped` | Packet capture |

### Exploitation

| Tool | SDK hook(s) | What it does |
|---|---|---|
| `metasploit` / `msfconsole` | `Metasploit.Event`, `.Search`, `.Use`, `.Event.Try`, `.Msfconsole`, `.ShowOptions`, `.SetOption`, `.Rootgrab`, `.Meterpreter.Connected`, `Meterpreter.Download` | Exploit framework (search/use/configure/run modules, Meterpreter sessions) — see §4 reference notes |
| `sqlmap` | `Sqlmap.ListTables`, `Sqlmap.DumpTable` | Automated SQL injection |

### File / OS / scripting

| Tool | SDK hook(s) | What it does |
|---|---|---|
| `ls` | `Terminal.Ls` (`{id, name}`) | List directory contents (file-ID based) |
| `cd` | `Terminal.Cd` | Change working directory |
| `cat` | `Terminal.Cat` | Print file contents |
| `openssl` | `Terminal.Openssl` | Certificate/crypto operations |
| `python3` | `Python3.ExecFile` | Execute a Python script file |
| `explorer` | `Terminal.Explorer` | GUI file explorer (not a terminal command) |
| process kill | `Process.Killed` | Kill a running process by PID |

### Infrastructure / admin (borderline "hacking tool", included for completeness)

| Tool | SDK hook(s) | What it does |
|---|---|---|
| pfSense | `PFSense.Login`, `PFSense.Changes` | Router/firewall admin web panel |

**Explicitly out of scope for this doc** (general in-game apps, not hacking
tools): Twotter, Kisscord, Mail, Bank, Database, generic Browser/AppStore/BCC
News events, and the generic `Files.*` / `Terminal.Command` /
`Terminal.InstallPackage` mechanisms (those are plumbing every tool above
rides on, not tools themselves).

## 2. Custom Commands Registry (built by this project)

| Command | File | Built for | Registration | Notes |
|---|---|---|---|---|
| `subfinders` | `src/infrastructure/hackhub/commands/q01-subfinder.ts` | Q01 (optional/flavor — does not gate any objective) | `@RegisterCommand({ default: true })` | Deliberately plural — HackHub's production runtime rejects a mod command shadowing the **native** `subfinder` executable (see Master Registry above). Renders a fixed subdomain list matching Q01's fixtures. |
| `recon` | `src/infrastructure/hackhub/commands/recon.ts` | Q01 (shared "DSS // Data Surveillance System" flavor module, optional — does not gate any objective) | `@RegisterCommand({ default: true })` | Thematic reconnaissance banner/output; not tied to a specific quest objective. |
| `filestat` | `src/infrastructure/hackhub/commands/q03-filestat.ts` | Q03 Objective 03 (`checkTimestamp`) | `@RegisterCommand({ default: true, scope: "remote" })` | Implemented and live-tested 2026-09-15 end to end in production. Renamed from source's literal `stat` due to native-collision risk (see §4 methodology note). Output is a bordered `FILE \| MODIFY \| BIRTH` table (one `println()` call per line — `println()` does not interpret embedded `\n` as separate terminal lines). Usage: `filestat <file>` (not `<path>` — corrected 2026-09-15 wording, since the player usually runs it against a file already in the current directory). |
| `bootlog` | `src/infrastructure/hackhub/commands/q03-bootlog.ts` | Q03 Objective 04 (`reviewBootHistory`) | `@RegisterCommand({ default: true, scope: "remote" })` | Implemented and live-tested 2026-09-15 end to end in production. Renamed from source's literal `journalctl` — HackHub confirms `systemctl` as native, and `journalctl` is systemd's own sibling tool, so treated as same collision risk. Output is a bordered `BOOT \| START \| END` table, one `println()` per line; `"present"` is title-cased to `"Present"`. |
| `zgrep` | `src/infrastructure/hackhub/commands/q03-zgrep.ts` | Q03 Objective 05 (`checkGatewayLogs`, "first real clue," ungated bonus tool) | `@RegisterCommand({ default: true, scope: "remote" })` | Implemented and live-tested 2026-09-15. Renamed 2026-09-15 (post-FINAL-LOCK naming pass) from the placeholder `archgrep` — confirmed live that native `grep`/`zgrep` cannot decompress `.gz` content at all (tested against a guaranteed-present string, not the intentionally-absent private IP clue), so this custom command fills a real gap rather than shadowing a working native tool; no collision. Requires 2 args (`zgrep "<pattern>" <path-or-glob>`); relative globs resolve against cwd via `Files.resolvePath`. Output is a per-match block, not a table (revised 2026-09-15 — see below): a `file — timestamp — source` header line, then the message on its own `└─ `-prefixed, word-wrapped (50-char cap) indented line. |

**Implementation gotchas confirmed during the Q03 probe (2026-09-15),
applicable to any future custom command that reads remote files:**

1. The mod's manifest must declare the **`"filesystem"`** permission, or any
   `Files.*` call throws `[ContentSDK] Mod "..." tried to use
   Files.isRemoteSession without "filesystem" permission`.
2. `Files.getByPath` does **not** resolve a relative path against the
   terminal's current working directory on its own (unlike native `ls`/
   `cat`). Always call `Files.resolvePath(path)` first, then pass the
   result to `Files.getByPath`/`Files.exists`.

**Terminal rendering gotchas confirmed during Q03's naming/UX pass
(2026-09-15), applicable to any future command producing multi-column or
wide output:**

3. HackHub's terminal **collapses runs of 2+ plain space characters down
   to one visible space** (screenshot-confirmed live) — standard HTML
   whitespace-collapsing behavior, even though a run of non-whitespace
   characters (e.g. a `-` border) renders at the correct width. Any
   column-padding logic must pad with **U+00A0 (non-breaking space)**
   instead of a plain space, or the padding silently collapses and columns
   drift out of alignment. See `renderAsciiTable`/`formatSearchMatches` in
   `src/infrastructure/hackhub/commands/q03-log-tools.ts`.
4. HackHub's terminal window has a real, fairly narrow **minimum
   width** (screenshot-confirmed ~55-60 characters) — a `println()` line
   wider than that wraps mid-content at an arbitrary point, breaking any
   fixed-width grid/table layout. There is no SDK API to read the current
   terminal width from mod code, so a wide multi-column table cannot
   reliably adapt — the SDK's own `Command.Run` API offers no hook either.
   `zgrep`'s original `FILE`/`TIMESTAMP`/`SOURCE`/`MESSAGE` table (~108
   chars wide) was replaced with a narrower per-match block layout for
   exactly this reason (no single line needs to exceed ~55 chars); keep
   any future wide-content command's line width well under this bound, or
   avoid horizontal tables entirely for content whose width can't be
   bounded in advance.

Full details: `docs/bugs.md` entries 2, 6, 16.

## 3. Per-Quest Usage Map

### Q01 — PASS/LOCKED

| # | Objective | Tool | Type | Completion trigger |
|---|---|---|---|---|
| 01 | Review audit scope | — | — | `Mail.Read` (reading the brief) |
| 02 | Scan the IP target | `nmap` | Native | `Terminal.Command` (`nmap <ip>`) |
| 03 | Identify the exposed web presence | `lynx` | Native | `Terminal.Command` (`lynx <ip\|url>`) |
| 04 | Enumerate hidden pages | `dirhunter` | Native | `Terminal.Dirhunter` |
| 05 | Basic vulnerability checks | — | — | `Browser.Meta` (visiting the discovered security page) |
| 06 | Submit audit report | — (GoMail, not a hacking tool) | — | `Mail.Sent` |
| *(optional/flavor, not gating any objective)* | — | `subfinders`, `recon` | Custom | manual exploration only |

### Q02 — PASS/LOCKED

| # | Objective | Tool | Type | Completion trigger |
|---|---|---|---|---|
| 01 | Check the new target | — | — | `Mail.Read` |
| 02 | Scan the host | `nmap` | Native | `Terminal.Command` (`nmap <ip> -sV` — bare scan insufficient, `-sV` required) |
| 03 | Identify the service | `nmap` | Native | Same `nmap -sV` call completes both 02 and 03 together |
| 03b (hidden, optional) | Check the DNS | `nslookup` | Native | `Terminal.Command` (`nslookup <hidden hostname>`) |
| 04 | Inspect the certificate | — (in-game Browser, not a terminal tool) | — | `Browser.Meta` (visiting `https://` gateway) |
| 05 | Report the anomaly | — (GoMail) | — | `Mail.Sent` |

### Q03 — FINAL LOCK, LIVE INGAME PASSED 2026-09-15

Renamed/restructured 2026-09-15 (post-FINAL-LOCK naming pass, session
discussion — pure UX polish, no gameplay-logic change beyond splitting one
objective into two independent completions): the original single "determine
last activity" objective (required both `filestat` AND `bootlog`) is split
into two objectives, each completing independently on its own command, for
clearer progress feedback.

**Added 2026-09-16/17 (credential-delivery redesign, not yet re-verified live):**
a new `findAccess` (00) objective precedes `accessHost` — the player runs
the custom `crackhash <hash>` command against a hash found in the incoming
mail's `old-creds.bak` attachment to recover the SSH username/password
(replacing two abandoned native-tool attempts, `john`/`hydra` — see
`docs/bugs.md` entry 3).

| # | Objective | Tool | Type | Status |
|---|---|---|---|---|
| 00 | Dig up the SSH credentials (`findAccess`) | `crackhash` | Custom | Not yet re-verified live |
| 01 | Access the remote host (`accessHost`) | `ssh` | Native | Confirmed live |
| 02 | Check the servers system logs (`checkLogs`) | `ls`/`cat` against `NetworkUser.rootFiles` | Native | Confirmed live |
| 03 | Check the file timestamp (`checkTimestamp`) | `filestat` (was `stat`) | Custom | Confirmed live |
| 04 | Review the boot history (`reviewBootHistory`) | `bootlog` (was `journalctl`) | Custom | Confirmed live |
| 05 | Check the gateway logs (`checkGatewayLogs`) | `ls` (sole completion trigger — `zgrep` is an ungated bonus, not required) | Native | Confirmed live. `Terminal.Ls` reports only the listed folder's own name (never child filenames) once per `ls`, and `/var/log/gateway/`/`/var/backups/gateway/` share that name — completion is keyed off `Files.getById(data.id).parent` matching folder `"log"`, not the folder's own name, to tell them apart. |
| 05b (optional) | Cross-reference the backup archive (`checkBackup`) | `ls`/`cat` (same mechanism as 02/05) | Native | Confirmed live |
| 06 | Report findings (`reportFindings`) | GoMail template + native phone-call `Dialog` reaction, full A/B/C branching | — / native | Confirmed live — see note below |

**Phone-call `options`/`onEnd`/`onSelect` (2026-09-15):** the SDK's
`onEnd`/`onSelect` callback fields are confirmed permanently non-functional
in this HackHub build (external bug filed:
`docs/bugs.md (entry 1)`) — but `options`/`switchBranch`
branching itself works correctly once every function property is removed
from the whole `Dialog` object. Full A/B/C player-choice branching from the
source design is shipped and live-tested. One residual, unfixable
limitation: objective/reward completion can't be tied precisely to the call
actually ending (no dialog-driven signal exists at all — see
`docs/bugs.md` entry 1's root-cause discussion), so it still runs on a
generous fixed delay from call-start instead.

Full technical detail: `docs/bugs.md` entry 1; story/objective detail:
`docs/source-current.md`.

### Q04–Q16 — SKELETON ONLY, no quest registered/implemented

A structural skeleton (objectives/rewards/flags/dialogue/mail where
sourced) exists for all of Q04–Q16 as of 2026-09-16 — see
`docs/implementation-notes.md` for the full inventory. None
are wired into `src/index.ts`; none have real command/event logic. Tool
mappings below are the skeleton's `// tool:` comments (provisional,
confirm when each quest is actually implemented), not confirmed live
usage — do not treat this table as PASS/CONFIRMED the way Q01–Q03's rows
above are.

| Quest | Native tools (provisional) | Custom commands |
|---|---|---|
| Q04 | `nmap`, `ssh`+`ls`/`cat` | — |
| Q05 | `dirhunter`, `lynx` | — |
| Q06 | `sqlmap` | — |
| Q07 | `sqlmap` | `netgraph` |
| Q08 | `sqlmap` | — |
| Q09 | `sqlmap` | — |
| Q10 | `ssh`+`ls`/`cat`, `sqlmap` | — |
| Q11 | `ssh`+`cat`, `sqlmap` | — |
| Q12 | `sqlmap` | — |
| Q13 | `sqlmap`, `whois` | — |
| Q14 | `Files.*` local access (NOT ssh/network — see skeleton-scaffold doc) | — |
| Q15 | `Files.*` local access + `openssl` decrypt (NOT ssh/network) | `timeline`, `chaintrace` |
| Q16 | `sqlmap`, `cat` | `interventiontrace` |

This section will be replaced quest-by-quest with the same PASS/CONFIRMED
format as Q01–Q03 above as each quest is actually implemented and live-
tested — never mark a row PASS/CONFIRMED speculatively ahead of that.

## 4. Reference: Metasploit (real-world tool — not yet used in this project)

Included per discussion on 2026-09-15 comparing Metasploit's function/usage
against Q03's `filestat`/`bootlog`/`zgrep` custom commands.

**Real-world Metasploit**: a modular penetration-testing framework built
around four module types — **Exploit** (gain initial access by leveraging a
vulnerability), **Auxiliary** (scanners/fuzzers, no payload), **Post-
Exploitation** (gather info or extend access on an already-compromised
system), **Payload** (the shellcode an exploit delivers). Interaction is
stateful and multi-step via `msfconsole`: `search` a module → `use` it →
`set` options (e.g. `LHOST`/`LPORT`/`RHOST`) → `run`/`exploit` → optionally
chain post-exploitation modules on the resulting session.

**In HackHub specifically**: sits in the game's own learning sequence after
Nmap (recon) and before password-cracking tools — "you cannot exploit what
you have not found." Workflow per the community wiki: choose a module,
configure the payload, match `LHOST`/`LPORT` to the player's own `ifconfig`
IP, stage a listener, then chain post-exploitation steps against a
mission-randomized vulnerable service.

**Corrected finding (2026-09-15)**: an earlier working assumption in this
project was that Metasploit is a closed native subsystem with no mod hooks.
That is **wrong** — the SDK's `ModEventMap` exposes a full set of Metasploit
events a mod can listen to: `Metasploit.Search`, `Metasploit.Use`,
`Metasploit.ShowOptions`, `Metasploit.SetOption`, `Metasploit.Msfconsole`,
`Metasploit.Event`/`.Event.Try`, `Metasploit.Rootgrab`,
`Metasploit.Meterpreter.Connected`, and `Meterpreter.Download`. A future
quest **could** build objectives around Metasploit usage (e.g. completing an
objective when a specific module is `use`d, or when `Metasploit.Rootgrab`
fires against a specific host/file) — this is a real, moddable mechanism,
not a hypothetical one. Still unused anywhere in this project as of this
writing.

**How it compares to Q03's tools**:

| Aspect | Metasploit | `filestat`/`bootlog`/`zgrep` |
|---|---|---|
| Purpose | Gain access to a system not yet compromised | Read data on a system already compromised (post-SSH) |
| Closest Metasploit category | — | Post-Exploitation module (gather info after compromise) |
| Interaction style | Stateful, multi-step (`search`→`use`→`set`→`run`) | Stateless, one command + arguments, like a Unix coreutil |
| Target scope | Network/service (`RHOST`/`RPORT`, vulnerability-matched) | Filesystem/path, resolved via `Files.resolvePath`+`getByPath`, only inside an active remote session |
| Executes a payload? | Yes | No — read-only |
| SDK implementation | Native tool, but moddable via the event hooks listed above | 100% custom `@RegisterCommand`, full logic owned by this project |
