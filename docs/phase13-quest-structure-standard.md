# ENTITY RESOLUTION — Quest Implementation Structure Standard

Date: 2026-09-14
Status: **LOCKED** — this is the mandatory structural pattern for every quest from Q03 through Q16. It must not change without the user's explicit request, regardless of how any individual quest's story content differs.

This standard was derived from Q01 and Q02's full implementation, live-validation, and post-PASS stabilization cycles. Every rule below exists because of a concrete bug or live-test finding — see `docs/phase13-q01-final-lock.md` and `docs/phase13-q02-source-recovered.md` for the incidents that produced them.

## 1. File split: `content/` declares, quest files call

- `src/content/qNN.ts` holds every piece of **data** a quest needs: target IPs/hosts, objective IDs, the `Objectives` array, nmap/lynx fixture results, network port lists, reward numbers, report subjects/bodies/templates, delay constants (`setTimeout` durations), template IDs/labels, and the `HackhubPost` feed-post definition (content text + author). `HackhubPost` was missed on the first pass for both Q01 and Q02 — it stayed as an inline object literal in the quest files until caught and corrected on 2026-09-14 — so treat it as content exactly like mail bodies, not as behavior.
- `src/infrastructure/hackhub/qNN-quest.ts` (production) and `dev/qNN-replay-quest.ts` (replay) only **import and use** those declarations. No local `const` literal arrays/objects duplicating content that content/ already owns.
- Exception: small **helper functions** (fixture registration, host normalization, `sendAdrianMail`-style wrappers, event handlers) stay in the quest files — they are behavior, not content, even though production and replay each define their own copy.

## 2. Content that genuinely differs between production and replay

When text must legitimately differ (production mentions a real money reward, replay says "DEV replay complete."; production's incoming mail is the full narrative, replay's is a terse test fixture) — define **both** as separately named exports in `content/qNN.ts`, suffixed `_PRODUCTION` / `_REPLAY`. Never fall back to a bare local literal in the quest file to sidestep this — that was the exact mistake corrected for `Q01_COMPLETION_MAIL_CONTENT` / `Q02_COMPLETION_MAIL_CONTENT` post-PASS.

If an `Objectives` array's wording is fully identical between production and replay, export ONE shared `QNN_OBJECTIVES` array (`Q02_OBJECTIVES` pattern). If even one hint differs, keep `Objectives` local per file rather than forcing a fake shared array with overrides.

**`HackhubPost` text**: a short teaser that points to the mail for details ("Short audit for a client in Jakarta. Details in your mail.") — never a near-duplicate summary of the incoming mail's body (Q01's original text was corrected away from this on 2026-09-14). Production and replay always differ here (replay is explicitly marked "DEV REPLAY..." with an `"Adrian Cole [DEV]"` author), so both get `QNN_HACKHUB_POST_PRODUCTION` / `_REPLAY` exports per the `_PRODUCTION`/`_REPLAY` rule above.

**Mail subject threading**: the opening mail's subject and the eventual report's subject may either (a) be the same subject reused throughout the whole thread (brief → report → completion reply, all one `Re:`-chained thread), or (b) be two deliberately separate subjects (a casual opening subject, a distinct formal report subject). Q01 uses (a); Q02 uses (b). Q01's pattern is kept as a historical exception (FINAL LOCK, already live-proven — not worth reopening for stylistic consistency); **Q02's pattern (b) is the standard for Q03-Q16**: the opening mail reads as a casual ping, the report gets its own professional subject as a distinct deliverable.

## 3. GoMail report-submission template

Every quest with a mail-based report objective registers a `Mail.registerTemplate`:

```ts
Mail.registerTemplate({
    id: QNN_REPORT_TEMPLATE_ID,       // e.g. "entity_resolution.qNN.report"
    label: QNN_REPORT_TEMPLATE_LABEL, // dropdown display name — NOT the mail subject
    title: QNN_REPORT_SUBJECT,        // the real mail subject
    content: QNN_REPORT_TEMPLATE_CONTENT, // {{field}} placeholders
    fields: ["fieldOne", "fieldTwo"],
});
```

- `label` and `title` are different concerns — `label` is only the compose-dropdown name, `title` is the actual subject line. Keep them as separate named constants.
- **Never call `Mail.unregisterTemplate()`.** Confirmed live: GoMail re-renders a *previously sent* mail's history entry from its template at *view time*, not a snapshot frozen at send time. Unregistering a template retroactively corrupts every past sent-mail entry that used it, turning nicely rendered text into raw JSON + the template id as the subject. Leaving templates registered forever is harmless (a small, permanent compose-dropdown entry) — do not add cleanup code for this.
- Confirmed live (under this mod's API-v1 compatibility mode): sending via a registered template does **not** merge `{{field}}` into rendered text for the `Mail.Sent` event payload. `data.subject` becomes the template `id`, and `data.content` becomes a raw JSON object of the field values the player filled in. Validate accordingly — see the dual-path pattern below.
- The player-visible **Sent-history rendering** (what the player actually sees when they open their own sent mail) is separate from the `Mail.Sent` event payload and renders correctly (nice text, real subject) as long as the template stays registered.

## 4. Dual-path report validation

Every report-objective handler supports two submission paths and must not require the player to pick one over the other:

```ts
private isXxxReport(subject: string, content: string): boolean {
    if (this.isTemplateXxxReport(subject, content)) {
        return true;
    }
    // freehand exact-match fallback, unchanged from before templates existed
    const normalizedSubject = subject.trim().toLowerCase();
    const normalizedContent = content.trim();
    const subjectMatches = normalizedSubject === QNN_REPORT_SUBJECT.toLowerCase()
        || normalizedSubject === `re: ${QNN_REPORT_SUBJECT}`.toLowerCase();
    return subjectMatches && normalizedContent === QNN_REPORT_BODY;
}

private isTemplateXxxReport(subject: string, content: string): boolean {
    if (subject !== QNN_REPORT_TEMPLATE_ID) return false;
    let fields: unknown;
    try { fields = JSON.parse(content); } catch { return false; }
    if (!fields || typeof fields !== "object") return false;
    const { fieldOne, fieldTwo } = fields as Record<string, unknown>;
    return fieldOne === QNN_EXPECTED_FIELD_ONE && fieldTwo === QNN_EXPECTED_FIELD_TWO;
}
```

Name the "correct answer" values as constants in `content/qNN.ts` (shared with the freehand `QNN_REPORT_BODY` construction) rather than hardcoding literals twice.

## 5. `Mail.send` must never be called from inside `setTimeout`

Confirmed live: `Mail.send()` (directly, or via a `sendAdrianMail`-style wrapper) does not fire reliably when invoked from inside a `setTimeout` callback — neither nested (`setTimeout` inside a `setTimeout`) nor flat/parallel (two independent `setTimeout` calls in the same tick). `completeObjective(...)` invoked from inside a `setTimeout` **does** work reliably.

Rule: any mail that must accompany report submission is sent **synchronously**, in the same tick the report is validated. Only the objective completion (and therefore the framework's own `OnComplete()` hook, which may itself send a completion mail synchronously) may be deferred, via exactly **one flat, non-nested** `setTimeout`:

```ts
sendAdrianMail(`Re: ${QNN_REPORT_SUBJECT}`, QNN_HOLD_MAIL_CONTENT); // synchronous
setTimeout(() => {
    this.completeObjective(QNN_OBJECTIVE_IDS.reportSomething);
}, QNN_COMPLETION_DELAY_MS);
```

Do not reintroduce a second delay stage (e.g. a separate delay before the hold mail itself) — that was tried and confirmed broken.

## 6. Website protocol-gating — MANDATORY RULE

Every `Website`'s HTTP behavior is dictated strictly by port 80's status in that target's own `NMAP_RESULT`-equivalent fixture, no exceptions:

- **Port 80 `OPEN`** → plain `http://` is allowed; serve the real page content over HTTP too (no gating needed).
- **Port 80 `CLOSE`, or absent from the fixture entirely** → `http://` **must** return a "400 Bad Request" page; only `https://` may serve real content. An unlisted port defaults to `CLOSE` — locked 2026-09-14 after `Q02EdgeWebsite` was found still serving identical content on both protocols despite its target's `NMAP_RESULT` never listing port 80 (fixed the same day; see `docs/phase13-q02-source-recovered.md` item 8's sibling fix in that file's history).

For the CLOSE/absent case, gate the page with a `DynamicWebsitePageDefinition` instead of a static one:

```ts
const page = (path, html, title, description): DynamicWebsitePageDefinition => ({
    path,
    metadata: (context: PageContext): PageMetadata => {
        if (!context.url.startsWith("https:")) {
            return { title: "400 Bad Request", description: "Insecure request rejected.", html: httpErrorPage };
        }
        return { title, description, html };
    },
});
```

`context.url` is evaluated **mod-side** (not inside the page's sandboxed iframe), so this reliably distinguishes `http://` from `https://` — a client-side script inside the page itself cannot be trusted to see the real requested protocol. The HTTP-rejected response reproduces nginx's real "400 Bad Request — The plain HTTP request was sent to HTTPS port" text for authenticity.

## 7. Replay quest conventions

- No `QuestsToComplete` gate — replay quests start independently so each can be tested without replaying the whole chain. Production keeps the real dependency.
- `Rewards = { money: 0, xp: 0 }` always — replay never grants real rewards; the native `Rewards` field is bypassed entirely in favor of `gameRuntime.reward.claim`/`Bank.transaction`, called only from production's `OnComplete`.
- Own `Title`, `HackhubPost`, `Name` (the latter suffixed with a per-build replay ID) — always visibly marked "DEV REPLAY" so it can never be confused with the real quest in-game.
- Mirror every production quest-logic change into the replay file in the same pass — they must stay behaviorally identical except for the deliberate content divergences covered in §2.
- **Optional: unlocksAfter-free replay display variant.** When faster manual QA is wanted (so a tester isn't forced through the objective order just to reach the one they're testing), define `QNN_REPLAY_OBJECTIVES` in `content/qNN.ts` as `QNN_OBJECTIVES.map(({ unlocksAfter: _unlocksAfter, ...objective }) => objective)`, and point only the replay file's `Objectives` at it (`dev/qNN-replay-quest.ts`); production always keeps the real gated `QNN_OBJECTIVES`. This strips only the visual unlock-order gate — it must never relax any internal `Data`-flag gating (e.g. a handler that checks `this.Data.serviceIdentified` before allowing certificate inspection stays exactly as strict). Piloted and confirmed live on Q02, then explicitly rolled back from Q02 once Q02 reached FINAL LOCK on 2026-09-14 (a locked quest has no more need for a QA shortcut) — the pattern itself remains standard and available starting Q03.
- Do not rely on a `hidden: true` field on an objective definition to make it surprise-reveal mid-quest. It exists in the SDK's `.d.ts` (undocumented) but was live-tested on Q02 (a hidden bonus objective meant to appear only once `completeObjective()` fired for it) and did **not** surface in-game — root cause not yet isolated (could be the field itself, or `completeObjective()` on a not-yet-"unlocked" objective being a no-op). Until this is diagnosed (e.g. with a temporary event-payload log, the same technique used to debug the Q02 GoMail template issue), keep every objective — mandatory or optional/bonus — visible in `QNN_OBJECTIVES` from the start rather than gating its visibility on `hidden`.

## 8. Docs and workflow discipline

- Every quest gets its own `docs/phase13-qNN-source-recovered.md` (or equivalent) recording: recovered/adapted design source, implementation decisions, live-test findings (numbered, appended as new bugs surface), and a final "Post-validation stabilization" section for anything found after the initial PASS.
- `docs/phase13-sequential-campaign-lock.md` and `docs/phase13-story-implementation.md` get their status line and "Current Target" section updated the moment a quest passes.
- Standing process for every iteration, Q03-Q16 (discuss the design/fix before touching code → implement → `npm run typecheck`, both the main tsconfig and the standalone `dev/` check → `npm test` → `npm run build:replay:q01` → install **only** the replay build into HackHub's mods folder → report back and wait for live-test feedback → iterate): **`npm run build` (production) is skipped during this loop** — deferred until the quest reaches **FINAL LOCK - LIVE INGAME PASSED**, run once as the closing checkpoint before advancing to Q(n+1). Changed 2026-09-14 to save tokens/time across the many discuss→fix→retest rounds a quest typically takes; accepted tradeoff: a production-only bundling regression (something `typecheck` wouldn't catch, e.g. an esbuild/asset-copy issue) surfaces only at that checkpoint instead of every iteration, which may cost more effort to isolate if it happens — mitigation left an open question for later, not yet decided. This is scoped to Q03-Q16 only; Q01 and Q02 are already FINAL LOCK and unaffected.

## 9. Unreachable-host page template catalog

For any quest target that must exist narratively (nslookup/nmap fixtures reveal it) but must never actually be reachable, reuse the shared templates in `src/infrastructure/hackhub/websites/templates/` instead of relying on HackHub's generic "no such host" 404 or hand-rolling a new page from scratch. Both were designed and reviewed as an artifact mockup (three options compared) on 2026-09-14 before either was built — see the discussion in this session for the full comparison; only the two kept as templates are summarized here.

- **`unreachable-diagnostic.html` ("Diagnostic overlay") — IMPLEMENTED**, first used by `q02-cri-gateway-portal.ts` for the CRI gateway's hidden hostname/private IP (`Q02_HIDDEN_HOSTNAME` / `Q02_HIDDEN_HOSTNAME_IP`). Styled like the game's own network tools rendering a failed probe: a boot sequence that plays once on load via CSS `animation-delay`/`fill-mode: forwards` — `resolving TARGET` with its `...` revealed dot-by-dot then a green `ok`; `connecting to TARGET:PORT` the same dot-by-dot reveal then a red `error`; an ASCII retry bar that fills **FULL (never stops mid-fill)** each attempt across exactly 2 retries, resetting to empty after the first failure and — on the final attempt only — staying full **in red** instead of resetting again; then `timed out` / `route` / `SIGNAL LOST` (extra top margin separates this block from the retry bar above it). Respects `prefers-reduced-motion` (final state: full red bar, `retry 2/2 — failed`) and needs no external fonts (system monospace stack only, since the page runs in HackHub's own sandboxed iframe, not an Artifacts-CSP context). Revised 2026-09-14 from an earlier 3-retry version that settled at a partial (45%) width, which read as broken/stuck rather than deliberately failed. Placeholders: `__TARGET__` (the hostname or IP shown in the resolve/connect lines) and `__PORT__`. Register **one `Website` class per identifier** the player might type (hostname needs `Network.registerDomain`; a raw IP needs none, matching `Q02GatewayWebsite`'s existing pattern) — `Website.Host` only takes a single string, so a hostname and its IP both being reachable requires two registrations sharing the same rendered template.
- **`unreachable-perimeter.html` ("Perimeter notice") — RESERVED, not yet implemented anywhere.** A starker "ROUTE NOT PERMITTED" infrastructure block-page implying a deliberate wall rather than an accidental timeout — heavier foreshadowing, saved for a future quest (Q03+) where that stronger read is wanted. Placeholder: `__SEGMENT_CODE__`. Gut-check before use: it stays inside the "never name it" constraints of whichever quest deploys it, but the vibe alone reads more suspicious than the diagnostic template and may tip off a sharp player faster.
- Both templates follow the same render pattern already used for `q02-gateway-http-error.html`'s `__NGINX_VERSION__` placeholder: import the raw `.html` string, `.replace()` (or `.replaceAll()`) the placeholder(s), pass the result as a page's `html`. No `DynamicWebsitePageDefinition` needed unless the new use case also wants protocol-gating (§6) — the CRI gateway page deliberately does not, since being unreachable doesn't depend on `http://` vs `https://`.
- **Live-test gotcha, confirmed 2026-09-14**: `unreachable-diagnostic.html`'s boot-sequence animation (including the *infinite* SIGNAL LOST pulse) did not play at all in-game — it rendered the fully-settled end state instantly, with zero motion, on a machine where it should have animated. Root cause: HackHub's in-game browser is a real embedded browser engine (not a hand-rolled skin), and it reads the **Windows OS-level** `prefers-reduced-motion` media feature independently of any in-game "Reduce Motion" toggle HackHub itself exposes — the two are unrelated. This machine had Windows' own animation setting turned off (`Settings → Accessibility → Visual effects → "Animation effects"`, reachable via `Win+R` → `ms-settings:easeofaccess-visualeffects`); turning it on made the animation play immediately, with no code changes. Not a bug — the CSS was correctly honoring the accessibility preference it detected. Check this Windows setting first before treating a "frozen"/non-animating page as a code issue in future live-tests.

## 10. Character and organization email domains

Full rules and revision history live in `docs/email-character-contract.md` — summary for quick reference when introducing a new contact or org mailbox in Q03-Q16:

- **Personal/individual character** (a contact not tied to a visible organization's own website, e.g. Adrian) → `.void` TLD (e.g. `phantom-net.void`). Add the identity to `src/content/characters.ts` before implementing the quest that sends/receives mail from them — never a per-quest random alias.
- **Organization mailbox** → that organization's own hostname TLD, matching its `Website.Host` (e.g. `@skynet-logistics.idx`, not `.void`) — an org's mail domain realistically matches its own web domain.
- Never invent a third TLD for either case without updating the contract doc first.
