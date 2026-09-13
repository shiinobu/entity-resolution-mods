# ENTITY RESOLUTION — Q01 Lynx/Subdomain Amendment

Date: 2026-09-12
Status: **SUPERSEDED**

This historical document described the four-subdomain web model (`www`/`portal`/`status`/`security` as separate hostnames) and the DSS-recon-based enumeration command. Live testing on 2026-09-13 replaced this with a single-host, path-based model (`www.skynet-logistics.idx` with `/`, `/portal`, `/status`, `/security`) discovered via the native `dirhunter` command. See `docs/phase13-q01-final-lock.md` for the active, live-validated contract.

## Authority

This amendment supersedes the Q01 web-surface details that previously modeled the audit target as `/security` on the apex host.

Q01 now uses the HackHub SDK `Shell.addCommandData()` mechanism for deterministic terminal command fixtures. The official SDK documents `lynx` as a typed built-in command with string input and response fields including `address`, `ips`, and `additional`; custom command names may use arbitrary input/data. citeturn313821search0

## Revised Recon Flow

```text
Adrian contract mail
        ↓
Target IP: 203.0.113.42
        ↓
nmap 203.0.113.42
        ↓
443/tcp OPEN — https
        ↓
lynx 203.0.113.42
        ↓
https://www.skynet-logistics.idx/
        ↓
subfinder -d skynet-logistics.idx
        ↓
4 subdomains
        ↓
probe discovered hosts
        ↓
security.skynet-logistics.idx
        ↓
HTTPS security review
        ↓
Audit report submission
```

## Web Contract

Apex domain:

```text
skynet-logistics.idx
```

Exactly four subdomains are exposed in the Q01 world model:

```text
www.skynet-logistics.idx
portal.skynet-logistics.idx
status.skynet-logistics.idx
security.skynet-logistics.idx
```

Behavior:

```text
www      → public operations homepage
portal   → 403 FORBIDDEN
status   → 403 FORBIDDEN
security → Q01 audit target
```

The apex hostname is not registered as a Website. The canonical public web identity is discovered through the `lynx` result.

## Open-Port Boundary

Q01 provisions the target with:

```text
22/tcp  CLOSE  ssh
80/tcp  CLOSE  http
443/tcp OPEN   https
```

The canonical URLs therefore omit an explicit `:443`. HTTPS is the service exposed by port 443. Q01's Browser.Meta guard accepts the audit target only over `https:` and, when a port is supplied by the runtime event, only when that port is `443`.

The underlying network model remains authoritative for actual connectivity because only 443 is active.

## Lynx Contract

Accepted Q01 inputs:

```text
lynx 203.0.113.42
lynx https://203.0.113.42/
```

Both return the same canonical public host:

```text
https://www.skynet-logistics.idx/
```

## Subfinder Contract

Q01 uses a deterministic custom Shell fixture for:

```text
subfinder -d skynet-logistics.idx
```

The expected result contains exactly the four Q01 subdomains. This is an in-game command abstraction, not an external dependency on an internet passive-enumeration service.

## Email Boundary

Adrian's mail no longer contains a direct web-audit URL. It provides the target IP and report template only:

```text
Format report audit:
Subject: Security Audit — Jakarta

Target: <COMPANY>
Open Ports: <PORTS>

No critical vulnerabilities identified.
Further internal assessment is recommended.
```

The player must discover the company and open port through reconnaissance and the security-review page.

## Objective 04 Boundary

Objective 04 requires:

```text
nmap completed
lynx discovery completed
subfinder enumeration completed
```

followed by an HTTPS Browser.Meta interaction at:

```text
https://security.skynet-logistics.idx/
```

## Production Validation Gate

A clean live run must demonstrate:

```text
nmap
  → 443/tcp OPEN

lynx 203.0.113.42
  → https://www.skynet-logistics.idx/

subfinder -d skynet-logistics.idx
  → exactly four subdomains

portal / status
  → 403 FORBIDDEN

security
  → SECURITY REVIEW
  → Objective 04 complete

report with discovered values
  → Objective 05 complete
```
