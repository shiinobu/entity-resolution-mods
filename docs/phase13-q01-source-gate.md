# ENTITY RESOLUTION — Q01 Source Gate

Date: 2026-09-12
Status: **SUPERSEDED**

This historical document described the four-subdomain/subfinder web model. See `docs/phase13-q01-final-lock.md` for the active, live-validated (2026-09-13) path-based/dirhunter contract.

## Source Authority

Q01 remains `entity_resolution.q01` and keeps the locked five-objective structure and Phase 8 reward allocation. The current project-owner revision changes the web discovery model to Lynx + subdomain enumeration and changes Adrian's report email to a player-completed format.

The revision does not add a new character, persistent completion flag, dependency, reward, or objective.

## Canonical Q01 Contract

```text
ID:          entity_resolution.q01
Title:       THE CONTRACT
Location:    Jakarta
Primary:     Adrian Cole
Target:      203.0.113.42
Client:      Skynet Logistics
Apex domain: skynet-logistics.idx
Completion:  audit report submitted
State:       entity_resolution.q01.completed = true
Reward:      $200 + up to 80 XP
```

## Locked Objectives

```text
01 Review audit scope
02 Scan the ip target
03 Identify exposed services
04 Perform basic vulnerability checks
05 Submit audit report
```

Objective IDs remain:

```text
q01.objective.01
q01.objective.02
q01.objective.03
q01.objective.04
q01.objective.05
```

## Service Enumeration

```text
22/tcp  CLOSE  ssh
80/tcp  CLOSE  http
443/tcp OPEN   https
```

Port 443/HTTPS is the only exposed web service. Canonical HTTPS URLs omit the explicit `:443`.

## Web Discovery

Exactly four subdomains exist in the Q01 world model:

```text
www.skynet-logistics.idx
portal.skynet-logistics.idx
status.skynet-logistics.idx
security.skynet-logistics.idx
```

Behavior:

```text
www      → public homepage
portal   → 403 FORBIDDEN
status   → 403 FORBIDDEN
security → Q01 audit target
```

The apex domain is the enumeration root and has no Website page of its own.

## Lynx

The Q01 adapter provides the HackHub typed `lynx` response through Shell command data:

```text
lynx 203.0.113.42
```

Compatibility input:

```text
lynx https://203.0.113.42/
```

Both resolve to the canonical public address:

```text
https://www.skynet-logistics.idx/
```

## Subfinder

The Q01 adapter provides a deterministic custom command fixture:

```text
subfinder -d skynet-logistics.idx
```

The result contains exactly the four locked subdomains.

HackHub's official Shell documentation defines `Shell.addCommandData()` as the mechanism for injecting command responses and lists `lynx` as a typed built-in; non-built-in command names can use arbitrary input/data. citeturn313821search0

## Objective 04 Method

```text
nmap
 ↓
443/tcp OPEN
 ↓
lynx 203.0.113.42
 ↓
www.skynet-logistics.idx
 ↓
subfinder -d skynet-logistics.idx
 ↓
security.skynet-logistics.idx
 ↓
HTTPS Browser.Meta
```

Objective 04 completes only when `Browser.Meta` reports:

```text
protocol = https:
hostname = security.skynet-logistics.idx
pathname = /
```

Port enforcement is provided by the target network definition; Q01 does not depend on an undocumented Browser.Meta port field.

## Security Boundary

Q01 remains non-exploitative. Credential attacks, internal access, data extraction, SQL injection, RCE, and SSH access are not required.

## Report Contract

Adrian's incoming email contains:

```text
Format report audit:
Subject: Security Audit — Jakarta

Target: <COMPANY>
Open Ports: <PORTS>

No critical vulnerabilities identified.
Further internal assessment is recommended.
```

The player must derive the company and open-port values from the reconnaissance/audit surfaces.

Canonical resolved body:

```text
Target: Skynet Logistics
Open Ports: 443

No critical vulnerabilities identified.
Further internal assessment is recommended.
```

## State Boundary

Only the canonical completion flag is persistent:

```text
entity_resolution.q01.completed = true
```

Lynx/subfinder discovery state remains transient Q01 quest data.

## Production Gate

Production Q01 is not declared live-PASS until a clean HackHub run demonstrates:

```text
nmap → 443/tcp OPEN
lynx → www.skynet-logistics.idx
subfinder → exactly four subdomains
portal/status → 403 FORBIDDEN
security → audit page
report → Objective 05
completion → $200 + 80 XP
```
