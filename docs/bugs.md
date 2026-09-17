# ENTITY RESOLUTION — Bug & Limitation Log

This is the **single** log for every engine/SDK bug, platform limitation, or
native-tool quirk found anywhere in this project — fixed or not. When a new
one is found, add an entry here; do not create a new doc file for it.

Each entry: **Status** (`OPEN` — no fix, workaround only / `WORKAROUND` —
functionally resolved, root cause not fixed upstream / `RESOLVED` — root
cause understood and no longer an issue), where it was found, what happens,
why, and the fix or workaround actually shipped.

---

## 1. `Dialog.onEnd` / `QuestDialogOption.onSelect` never fire

**Status: RESOLVED (fixed upstream between SDK 0.21.0 and 0.24.0)**
Found: Q03, 2026-09-15. Environment: HackHub 1.2.1,
`@hotbunny/hackhub-content-sdk@0.21.0`, Windows 11/Steam.

`onEnd` (on a `Dialog` speech line) and `onSelect` (on a dialog option) are
documented callback fields on the phone-call `Dialog` system, but in live
testing **neither ever fires, under any circumstance** — not on a line
reached by normal auto-advance, not via `switchBranch`, not via `nextIndex`.
Holds true even for a bare no-op `console.log`, ruling out anything specific
to what the callback does.

Confirmed across every mechanism the SDK exposes for triggering one:

| Attempt | Function property location | Result |
|---|---|---|
| `isEnd: true` + `onEnd: () => this.createDialog(otherBranch)` (mid-call branch jump) | Speech line | Advanced correctly through prior plain lines, then froze at that line — no error |
| `switchBranch` on an option, target line has `onEnd` | Speech line (jump target) | Option's own text echoed, then froze — target content never appeared |
| `nextIndex` on an option (same-array jump), target index has `onEnd` | Speech line (jump target) | Froze *before* the options screen even appeared, inconsistently across identical runs |
| `isEnd: true` + `onSelect` directly on the option (no jump) | Option object | Options screen worked, selection echoed, then froze — call never visibly ended |
| Isolated no-op `onEnd: () => console.log(...)` on a `switchBranch` target | Speech line | Never printed |
| Isolated no-op `onEnd: () => console.log(...)` on a purely linear, definitely-reached line | Speech line | Never printed |

The last two rows are the cleanest evidence: a side-effect-free callback on
an ordinary line that's definitely reached (everything after it still works)
never fires — this isn't about branching, timing, or the callback's body.

**Suspected root cause:** `createDialog()` appears to eagerly and
synchronously read the *entire* reachable branch graph at call-setup time —
confirmed by wrapping a fully function-free `Dialog` in a `Proxy`: every
`Dialog[branch][index]` property across all reachable branches (~23 lines
across 5 branches, in one dialogue tree) was read within the same logged
second `createDialog()` was called, long before the player saw anything.
This supports a `structuredClone`-throws-on-a-function theory: unlike
`JSON.stringify` (which would silently drop a function), `structuredClone`
throws when it hits one — if the engine clones the whole graph up front for
internal playback state, a function anywhere in it would corrupt that clone,
plausibly explaining why display works fine right up to the exact line
carrying the function, then silently stalls with no error.

**External corroboration:** a separate, independently-built community
quest-editor tool for this game
([TheZeis/Hackhub-Quest-Editor](https://github.com/TheZeis/Hackhub-Quest-Editor))
compiles its dialogue nodes to raw `Dialog` objects that **never emit
`onEnd`/`onSelect` at all** and calls `createDialog()` fire-and-forget —
i.e. the wider modding community has already independently converged on
avoiding both fields entirely.

**Workaround (shipped, Q03):** build `Dialog` with `switchBranch`/`isEnd`
only — zero function properties anywhere in the object. Any "the call/line
ended" side effect is triggered from the caller of `createDialog()` on a
fixed `setTimeout`, tuned to outlast the call's worst-case duration (see
Q03's `Q03_COMPLETION_DELAY_MS`, raised 20s → 32s to cover the longest
branch). Imprecise — there's no way to know exactly when the player
finishes — but the only mechanism confirmed to work reliably.

**Reproduction:**
```ts
override Dialog: QuestDialogDefinition = {
    main: [
        { speaker: "NPC", text: "Line one.", timeout: 3000, onEnd: () => console.log("[BUG] onEnd fired") },
        { speaker: "NPC", text: "Line two.", isEnd: true },
    ],
};
```
Call `this.createDialog("main")`, let it advance past "Line one." — the log
line never appears, at any point, even after the call fully ends.

**Fixed upstream (2026-09-17):** community report that `onEnd` no longer
stalls the dialog, on a newer HackHub/SDK build than when this was found.
Re-verified directly in this project: a probe `onEnd: () => trace(...)` on
Q03's `postReportA`/`B`/`C` final lines (SDK `0.24.0`, up from `0.21.0` when
this bug was found) fired cleanly — confirmed via the HackHub log, no stall,
no error. Q03's `reportFindings` objective now completes from `onEnd`
directly (exact timing) instead of the fixed `Q03_COMPLETION_DELAY_MS`
guess-the-worst-case timeout. The `Proxy`-based `withDialogLineReadTap`
workaround (`infrastructure/hackhub/dialog-utils.ts`) is no longer needed
and has been deleted — `onEnd` can be used directly on `Dialog` speech
lines again. Any future quest using a phone-call `Dialog` (Q08/Q09/Q11-Q16)
should default to `onEnd` for "call ended" side effects; only fall back to
the fixed-delay pattern if `onEnd` turns out not to fire for some other
reason.

---

## 2. Native SSH connection failed on first isolated smoke test

**Status: RESOLVED (root cause was invocation syntax, not a real SDK bug)**
Found: Q01 development, pre-2026-09-13. SDK `0.21.0`.

An isolated smoke-test mod (no Q01 content, no custom command data, just
`Network.createSubnetNetwork()` + a router with TCP 22/ssh + an admin user)
was built to test native SSH in isolation, using `ssh -h admin@<ip>`. The
test's own doc recorded the expected failure mode as
`Connection could not be established.` if native SSH didn't work in that
runtime at all.

**Consequence at the time:** Q01's design was changed to drop its
SSH-based objective entirely (`docs/phase13-q01-objective-reconciliation.md`,
now deleted — see the Group-A/B reorg note at the bottom of this file)
in favor of an HTTP/HTTPS web-audit objective, on the assumption native SSH
was unreliable in this HackHub build.

**Later correction (Q03, 2026-09-15):** native SSH was confirmed working
correctly, end-to-end, once invoked with the right syntax:

```text
ssh -h auditor@198.51.100.11
```

not a bare `ssh <ip>` (which returns the command's own usage message,
`Usage: ssh -h [username@ip] -p [port (optional)]`, instead of connecting).
`-p [port]` is optional and validated against the actually-open port. The
password prompt uses the `Network.createUser({ password })` value directly,
not `Shell.addCommandData`'s `key` field (which only feeds port/status
gating, mirroring `nmap`).

**Takeaway:** the original Q01-era smoke test most likely never actually
hit an engine bug — it's very likely nobody tried the `-h user@ip` syntax
before concluding SSH was broken. Q01's redesign away from SSH remains the
shipped design (not revisited), but any future quest needing SSH should
trust the Q03-confirmed syntax above rather than re-litigating this.

**Related gotcha (also confirmed via the Q03 probe):** the SSH password
prompt uses the `Network.createUser({ password })` value directly — not
`Shell.addCommandData("ssh", {...key})`'s `key` field, which only feeds the
port/status gating check (mirroring `nmap`'s own gating). `-p [port]` is
optional and is validated against whichever port is actually declared open.

---

## 3. Native `hydra`/`john` reject every wordlist / can't crack mod fixtures

**Status: WORKAROUND SHIPPED (custom command built instead)**
Found: Q03 credential-delivery redesign, 2026-09-15/16.

Two native password-cracking commands were tried to deliver Q03's SSH
password to the player and both failed for reasons outside mod control:

- **`john <hash>`** — ignores mod-registered fixtures entirely; runs its own
  internal crack simulation unrelated to any hash the mod provides.
- **`hydra -P <wordlist>`** — correctly wired per the SDK's typed
  `CommandDataMap`, but hit an undocumented native
  `"Invalid wordlist file."` validation that rejected every wordlist file
  tried, including one that contained the literal correct password.

Neither was resolved; both were abandoned as a delivery mechanism.

**Fix:** built a fully custom, local (non-`scope: "remote"`) command,
`crackhash <hash>`, registered directly by the mod
(`src/infrastructure/hackhub/commands/q03-crackhash.ts`) — a fixed lookup
against one real SHA-256 hash (`Q03_ACCESS_HASH`, hash of the actual
credential string) with no dependency on any native cracking tool's
internal behavior. The password is delivered to the player via a mail
attachment (`old-creds.bak`) containing the hash, not typed into the mail
body.

---

## 4. Native `nmap` rejects hostnames — always target a resolved IP

**Status: RESOLVED (design constraint, not a bug — confirmed intentional)**
Found: Q02, 2026-09-13.

Running `nmap <hostname>` (e.g. `nmap edge-03.skynet-logistics.idx`) prints
the native `Usage: nmap [ip address]` error — nmap only accepts a literal
IP. An early Q02 objective handler still completed anyway, because it only
checked that a fixture existed for that key, never whether the native
command actually produced port data.

**Fix:** every quest's `nmap` objective targets a resolved IP exclusively;
the player is expected to resolve any hostname themselves first (e.g. via
`nslookup`, wired as a `Shell.addCommandData` fixture). This also makes the
early-return guard correctly reject wrong/invalid input. Confirmed as
intentional design (not worth "fixing" nmap around) — matches real nmap
behavior.

---

## 5. `Terminal.Ls` can't distinguish folders by name alone

**Status: RESOLVED**
Found: Q03, 2026-09-15.

`Terminal.Ls` fires once per `ls` call with `data.name` set to the name of
the **listed folder itself**, not any child item — so `ls` in
`/var/log/gateway/` and `/var/backups/gateway/` both report
`data.name === "gateway"` (only `data.id` differs). No name-based check can
ever tell the two folders apart from this event alone; an initial
implementation using this event incorrectly let the backup folder complete a
log-folder-only objective.

**Fix:** use `Files.getById` (works from any context, unlike
`Files.resolvePath`/`getByPath`, which are only session-aware from inside a
running custom command) to look up `data.id`, confirm the folder's own name,
then walk up one level via `FileInfo.parent` and check the **parent**
folder's name instead.

---

## 6. `Files.getByPath` does not resolve relative paths against terminal cwd

**Status: RESOLVED**
Found: Q03 SSH probe, 2026-09-15.

Unlike native `ls`/`cat`, `Files.getByPath("probe.txt")` from cwd `/var/log`
(or `Files.getByPath("var/log/probe.txt")` from `~`) both returned `null`.

**Fix:** always call `Files.resolvePath(path)` first (it resolves against
the terminal's current cwd per its own doc comment), then pass the result to
`Files.getByPath`/`Files.exists`. Applies to every custom command that takes
a path argument. Also: using `Files.*` from a custom command requires the
`"filesystem"` manifest permission — omitting it throws
`Files.isRemoteSession without "filesystem" permission` on the first call.

---

## 7. `Mail.unregisterTemplate()` corrupts previously-sent mail history

**Status: RESOLVED**
Found: Q01/Q02, 2026-09-14.

GoMail re-renders a *previously sent* mail's history entry from its
registered template **at view time**, not a snapshot frozen at send time,
keyed by template id. Once a mod calls `Mail.unregisterTemplate(id)`, GoMail
can no longer find that template to re-render older mail using it — the
history entry degrades to raw JSON + the template id as the subject.
Diagnosed by comparing two quests' mail history (one degraded after
`OnComplete` unregistered its template, one still fine because it hadn't
completed yet) and confirmed via frame-extraction from a user-supplied
screen recording.

**Fix:** removed every `Mail.unregisterTemplate()` call from
`OnComplete`/`OnAbandon`. Report templates now stay registered permanently —
harmless, just a small permanent entry in GoMail's compose dropdown.

---

## 8. `Mail.send()` unreliable from inside a `setTimeout` callback

**Status: RESOLVED**
Found: Q02, 2026-09-14.

Q02's original hold-mail pacing delayed `sendAdrianMail(...)` via
`setTimeout` (both a nested chain and flat/parallel forms were tried) — the
mail never arrived in either form, while `completeObjective(...)` called
from its own `setTimeout` worked reliably every time.

**Fix:** send the hold mail **synchronously** the instant its trigger
condition is validated; only `completeObjective` is deferred via a single
flat `setTimeout`, mirroring Q01's already-proven shape.

---

## 9. `Mail.registerTemplate` doesn't merge `{{field}}` placeholders under API v1 compatibility mode

**Status: WORKAROUND SHIPPED (not reattempted with `apiVersion: 2`)**
Found: Q02, 2026-09-14. HackHub logged
`Mod "..." uses API v1 (current: v2). Running in compatibility mode`.

Under that mode, a `Mail.Sent` event from a GoMail-template-based report had
`subject` set to the template's `id` (not its `title`/`label`) and
`content` as a **raw JSON object** of the filled field values, not the
rendered template text.

**Fix:** report-detection logic checks two independent paths — the original
freehand exact-body match, or parsing `content` as JSON and checking the
expected field values against named constants shared with the freehand
template. Not reattempted with `apiVersion: 2` — kept as a possible future
revisit if the compatibility-mode behavior ever needs to go away.

The template's free-text fields (a date, a list of numbers) have no single
natural format a player would type — "Sep 8" vs "sep 08" vs "September 08";
"5, 6" vs "5,6" vs "6, 5" — so exact-string comparison would reject valid
answers. `monthDayMatches`/`numberSetsMatch`
(`src/infrastructure/hackhub/commands/q03-log-tools.ts`) normalize both
sides (canonical `Mon DD`; sorted digit set) before comparing, tolerating
wording/order/spacing variance without accepting a wrong answer.

---

## 10. Terminal rendering: collapsed whitespace and table width

**Status: RESOLVED (general pattern, not quest-specific)**
Found: Q03, 2026-09-15.

Two related rendering issues in HackHub's terminal, confirmed via a
user-supplied screenshot:

- **Whitespace collapsing:** HackHub's terminal collapses runs of plain
  space characters (standard HTML behavior) — a bordered ASCII table's
  border rendered at the correct width, but header/data text squished to
  single spaces. **Fix:** pad with U+00A0 (non-breaking space) instead of a
  plain space; HTML's whitespace-collapsing rule excludes it by spec.
- **Minimum terminal width (~55–60 chars):** a 4-column table
  (`FILE`/`TIMESTAMP`/`SOURCE`/`MESSAGE`, ~108 chars wide) wrapped mid-cell
  and broke its box grid at the game's minimum window size — structurally
  unfixable by shrinking columns (the first three alone need ~58 chars).
  **Fix:** replaced with a per-match block layout instead of a table: a
  `file — timestamp — source` header line, then the message on its own
  `└─ `-prefixed, word-wrapped (50-char cap) indented line — no line exceeds
  ~55 chars, safe at any window size. Narrower tables (~32–38 chars) were
  left as tables.

---

## 11. Custom port not reachable — HackHub's browser can't find non-default-port hosts

**Status: RESOLVED**
Found: Q02, 2026-09-13.

`https://edge-03.skynet-logistics.idx:8443/` returned a native
"Firebear can't find the server" error — the browser never even looked for a
registered `Website`; explicit custom ports on a hostname aren't supported.

**Fix:** model the extra service as a second `Website` registered directly
on a raw IP (`Website.Host` = an IP address, not a hostname) with a
`status: "FORWARDED"`/`destination` pointer from the nmap fixture, rather
than trying to serve it on a non-default port of the existing hostname.

---

## 12. `Website` pages are protocol-blind by default — plain HTTP serves HTTPS-only content

**Status: RESOLVED**
Found: Q02, 2026-09-13/14.

A `Website`'s static `WebsitePageDefinition` renders identically regardless
of `http://` vs `https://` — there's no protocol concept in the base page
model. This let plain-HTTP requests see content (e.g. a certificate page)
that was supposed to require HTTPS, and objectives strictly gated on
`Browser.Meta.protocol === "https:"` would just silently never complete
instead of explaining why.

**Fix:** switch the affected pages to `DynamicWebsitePageDefinition`, whose
`metadata(context)` runs mod-side (not inside the sandboxed page iframe) and
receives the real `context.url` — letting the page itself branch on
protocol and return an in-fiction plain-HTTP error (e.g. reproducing
nginx's real "400 Bad Request — plain HTTP sent to HTTPS port") instead of
leaking HTTPS-only content or silently failing an objective with no
feedback. Applied everywhere a `Website`'s content must differ by protocol
or a port is absent from a target's nmap fixture (absent port defaults to
`CLOSE`, so HTTP must error there too).

---

## 13. Objective completion tied to `Terminal.Command` fires even when the read failed

**Status: RESOLVED**
Found: Q03, 2026-09-15.

`Terminal.Command` fires on the raw typed command text regardless of
whether the command actually succeeded — e.g. running `cat` from the wrong
directory, producing a real on-screen "File not found.", still matched and
completed a file-read objective.

**Fix:** never complete a file-read/list objective from `Terminal.Command`.
Use only `Terminal.Cat`/`Terminal.Ls` (and other specific native result
events), which fire exclusively when the read/list actually produced real
data.

---

## 14. Phone-call caller identity comes from `Employer`, not any `Dialog` field

**Status: RESOLVED (undocumented requirement)**
Found: Q03, 2026-09-15.

Without an explicit `Employer = { firstName, lastName, email, avatar }` on
the quest class, the native phone UI silently showed a base-game default
contact instead of the intended character — `createDialog()` itself never
throws or warns.

**Fix:** always set `Employer` explicitly on any quest that uses
`createDialog`/phone-call `Dialog`.

---

## 15. `Dialog` must be a static field — runtime reassignment silently renders nothing

**Status: RESOLVED (confirmed SDK behavior, not fixable, only avoidable)**
Found: Q03, 2026-09-15.

Assigning `this.Dialog = ...` dynamically at runtime (e.g. inside an event
handler) never throws, and reading `this.Dialog` back afterward shows the
correct object — but the phone-call UI then renders nothing at all (no
text, no options). The SDK reads `Dialog` once at quest registration; later
reassignment has no effect on what actually plays.

**Fix:** any per-playthrough conditional dialogue content must be handled by
choosing between multiple fully-static starting branches at the initial
`createDialog(branchName)` call (branch chosen by a flag/condition check),
never by mutating the `Dialog` object itself afterward.

---

## 16. `Files.*` custom commands need the `"filesystem"` manifest permission

**Status: RESOLVED (undocumented requirement)**
Found: Q03 SSH probe, 2026-09-15.

A custom `@RegisterCommand` calling `Files.isRemoteSession`/other `Files.*`
methods without `"filesystem"` declared in the mod manifest throws
`[ContentSDK] Mod "..." tried to use Files.isRemoteSession without
"filesystem" permission` on the first call.

**Fix:** add `"filesystem"` to the manifest permissions list alongside
`"shell"`/`"network"`/`"events"` for any mod using the `Files` namespace
from a custom command. (Paired with entry 6 above — resolve the path with
`Files.resolvePath` first, then call `Files.getByPath`/`Files.read`.)

---

## 17. Hold-mail sent right after the wrong objective, not after the report

**Status: RESOLVED**
Found: Q02, 2026-09-13.

`Q02_HOLD_MAIL_CONTENT` ("Don't send this to the client yet...") was
mistakenly wired to fire right after the player read Adrian's *first* mail
(Objective 01), instead of after the report is submitted (Objective 05) as
intended — an event-handler placement mistake, not an SDK issue.

**Fix:** moved the send call into the `Mail.Sent` handler, at the exact
point where the report is detected and Objective 05 completes.

---

## 18. `Network.createSubnetNetwork` needs a Router-wrapping-child-Device shape for SSH

**Status: RESOLVED**
Found: Q03, 2026-09-15.

A bare top-level `Device`, and a top-level `Router` with `users`/`ports`
declared directly on it (no child), both failed to accept SSH connections
live (`"Connection to the remote server could not be established."`) — even
though the SDK docs describe `createSubnetNetwork` as producing "a full
subnet network (Router with children hierarchy)."

**Fix:** always give the Router a separate IP and put the actual
SSH-reachable `Device` (with its `ports`/`users`/`rootFiles`) as that
Router's **child**, matching the shape the SSH probe used when it worked.
When the player-facing IP must stay a specific value (e.g. reused across
quests), the Router gets its own never-mentioned wrapper IP instead, and
the child Device keeps the real target IP — purely structural, invisible to
the player.

---

## 19. Stale `nmap` fixture leaks across quests sharing the same target IP

**Status: RESOLVED**
Found: Q03, 2026-09-15.

`nmap`'s displayed result comes entirely from the `Shell.addCommandData`
fixture registered for that exact IP — it does not automatically reset
between quests. Q03 reuses Q02's target IP (`edge-03`, same host), and
without Q03 registering its own fresh fixture for that IP, `nmap` kept
showing **Q02's stale result** (port 22 CLOSE) instead of Q03's (port 22
OPEN) — nothing had cleared Q02's entry.

**Fix:** any quest reusing a previous quest's target IP must explicitly
re-register (or clear-then-register) its own `nmap` fixture for that IP in
`OnObjectivesStart`, never assume the previous quest cleaned up after
itself.

---

## 20. Native `cat` cannot read a `.gz`-extension file at all

**Status: RESOLVED (design constraint, not a bug)**
Found: Q03, 2026-09-15.

Native `cat` refuses to open any file with a `.gz` extension
(`"Unable to read file."`), regardless of its actual text content — this is
why `zgrep` exists as a tool in the first place (searching `.gz` content
without `cat`-ing it directly).

**Fix/implication:** any fixture file meant to be `cat`-able directly (e.g.
Q03's backup archive metadata, framed narratively as a `.tar.gz`) must use
a real non-`.gz` extension (Q03 uses `.txt`, with the `.tar.gz` framing
preserved only inside the file's own `archive: ...` header text) — the
extension the player literally reads via `cat` and the extension the
narrative *describes* the file as don't have to match.

---

## 21. `Shell.addCommandData` fixtures don't survive a HackHub restart

**Status: RESOLVED**
Found: Q03, 2026-09-15 (third pass).

Like `nmap`/`hydra`, an `ssh` fixture registered via `Shell.addCommandData`
does not persist across a game restart. `OnStart` runs exactly once, ever,
per claim — registering the fixture there (as an early revision did) meant
it was never re-registered on subsequent restarts of an already-claimed
quest, so SSH connections failed again after every restart despite working
right after the initial claim.

**Fix:** register (and defensively clear-then-register) all `Shell`
fixtures in `OnObjectivesStart`, never `OnStart` — the SDK's own `Quest`
base class doc comment confirms `OnObjectivesStart` runs "once on claim AND
again every time the game starts," which `OnStart` does not.

---

## 22. `await` before `Network.createSubnetNetwork` loses mod context

**Status: RESOLVED**
Found: Q03, 2026-09-15.

Awaiting anything (even an unrelated `Network.destroyNetwork` call) before
calling `Network.createSubnetNetwork` in the same handler makes the engine
lose track of which mod is calling across the async boundary — the create
call then fails with
`[ContentSDK] Mod "null" tried to use Network.createSubnetNetwork without
"network" permission`, even though the manifest correctly declares that
permission.

**Fix:** keep `OnStart` fully synchronous — fire-and-forget any
`Network.destroyNetwork` cleanup call (don't `await` it) before creating the
real network. This is safe: `OnComplete`/`OnAbandon` already call
`destroyNetwork` the same fire-and-forget way. Related: don't call
`destroyNetwork` on a network you're about to immediately re-create at the
same address either — a destroy-then-immediately-create race against the
engine's own (non-instant) async teardown of a genuinely present network
can make the fresh create fail too; only clean up addresses that might be
orphaned from a *different* source (e.g. a previous quest reusing the same
IP), never the one you're about to rebuild yourself in the same call.

---

## 23. `Network.destroyNetwork` takes the Router's IP, not a child Device's IP

**Status: RESOLVED (API usage note)**
Found: Q03, 2026-09-15.

For a Router-with-child-Device network shape (see entry 18),
`Network.destroyNetwork(ip)` must be called with the **Router's** IP to tear
down the whole hierarchy, including its children — calling it with a child
Device's IP does not work.

---

## 24. `Terminal.SSH.Connected`'s payload is a bare IP string, not an object

**Status: RESOLVED (undocumented/deprecated-interface gotcha)**
Found: Q03, 2026-09-15.

The event fires with a plain string (the connected IP), not an object —
the SDK's own `SSHConnectedEvent` interface is marked `@deprecated` for
exactly this reason. Destructuring the payload as if it were an object
fails silently wrong; treat it as a plain string.

---

## 25. `findAccess` objective completed from `Mail.Read` instead of the actual credential crack

**Status: RESOLVED**
Found: Q03, 2026-09-17 (live-test report from the user).

The "Dig up the SSH credentials" objective was auto-completing the instant
the player read Adrian's mail — before the player had actually cracked
anything. The mail carries the attachment, not the credentials; completion
belonged on a successful `crackhash` decrypt, not on reading mail.

**Fix:** removed the `Mail.Read` listener from `q03-quest.ts` entirely.
`crackhash` (see entry 26 for its own redesign) now emits a custom
`Q03.CrackhashSuccess` event on a real match; the quest listens for that
event specifically to complete `findAccess`. This was also the first
custom mod event used anywhere in this codebase — chosen over having the
quest independently re-resolve/re-check the file itself (which would have
duplicated `crackhash`'s own file-read logic and only proven "the command
ran with a plausible-looking argument," not "actually cracked").

---

## 26. `crackhash` originally took a raw hash string, not the file a player would naturally point at

**Status: RESOLVED**
Found: Q03, 2026-09-17 (live-test report: `crackhash <path-to-downloaded-attachment>` → "No match found").

`crackhash <hash>` expected the literal hash text as its argument. A player
naturally runs `crackhash old-creds.bak` — pointing at the downloaded mail
attachment — not typing out a raw hash they'd have no reason to already
know. `.bak` also can't be opened with `cat` to reveal the hash text first
(confirmed live), so there was no legitimate path to success as designed.

**Fix:** `crackhash` now takes a file path, resolves it via
`Files.resolvePath`/`Files.getByPath` (same pattern `filestat` already
uses), and compares the file's own `data` content to `Q03_ACCESS_HASH`.

---

## 27. No terminal-command API to update a single line in place — `clear()` wipes the whole screen

**Status: OPEN (limitation, no workaround needed for Q03's use)**
Found: Q03, 2026-09-17, while building `crackhash`'s cracking-progress
animation. SDK `0.24.0` (latest published version at the time).

`CommandTools` (the interface every custom terminal command's `Run()`
receives) has no way to update or replace a single previously-printed
line — no cursor control, no ANSI/`\r` support (consistent with the
whitespace-collapse behavior documented elsewhere: this terminal renders
each `println()` as its own literal text row, not a real character-grid
terminal emulator). `clear()` is the only "reset the visual state"
primitive that exists, and it clears the **entire** terminal — confirmed
live — not just the calling command's own output.

**Workaround shipped:** `crackhash`'s progress-bar animation uses
`clear()` + re-`println()` each frame anyway; the player accepted losing
terminal scrollback during that ~2-second animation as an acceptable
trade-off. Reported to the HackHub SDK dev/community as a possible future
feature (a single-line update API) — revisit this entry if that ever
ships.

---

## 28. `Terminal.Ping` didn't surface a `hidden` objective live — rolled back to `nslookup`

**Status: RESOLVED (workaround shipped: different trigger event)**
Found: Q02, pre-2026-09-17 (undocumented until this comment-extraction
pass caught it — the in-code comment describing it had also gone stale).

Q02's hidden bonus objective `checkDns` (`hidden: true` — an undocumented
SDK field, no `.d.ts` entry) was originally completed by having the player
ping the private IP `nslookup` reveals (`Terminal.Ping`, checking
`isUp === false`). Live-testing found the hidden objective never actually
surfaced/completed through that trigger — whether the root cause was the
`Terminal.Ping` event itself or something about `hidden` objective
completion in general was never isolated.

**Fix:** rolled back to completing `checkDns` directly off the `nslookup`
lookup result via `Terminal.Command` (the same event/pattern already
proven reliable elsewhere in `q02-quest.ts`, e.g. Objectives 02/03) instead
of a separate ping step. No `handlePing` method exists in the shipped
code — an old comment in `content/q02.ts` still referenced it after the
rollback; corrected as part of this pass.

---

## Reorg note

Full bug/live-test writeups that used to live inline inside
`docs/phase13-q02-source-recovered.md` and `docs/phase13-q03-source-recovered.md`
("Live-test findings" / "Post-validation stabilization" / "Live-Test
Findings" sections) are now entries 1, 4, 7–16 above — those sections in the
two source-recovered docs should be treated as historical/superseded by this
file, not a second copy of the same bug content.

The five Q01-era "amendment"/"correction" docs that used to live in
`docs/` (`phase13-q01-ux-correction.md`, `-lynx-subdomain-amendment.md`,
`-recon-promotion.md`, `-web-boundary-amendment.md`,
`-objective-reconciliation.md`) were **deleted, not merged here** — they
were successive superseded iterations of Q01's web-discovery design, fully
and completely replaced by `docs/phase13-q01-final-lock.md` (which is itself
slated to move into `docs/source-current.md`'s Q01 section during this same
docs reorg). None of their content was a "bug" in the sense this file
tracks; they're pure design-iteration history with nothing left to preserve
once the final design is recorded elsewhere.
