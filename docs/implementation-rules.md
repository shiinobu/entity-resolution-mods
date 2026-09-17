# ENTITY RESOLUTION — Quest Implementation Structure Standard

Date: 2026-09-14
Status: **LOCKED** — this is the mandatory structural pattern for every quest from Q03 through Q16. It must not change without the user's explicit request, regardless of how any individual quest's story content differs.

This standard was derived from Q01 and Q02's full implementation, live-validation, and post-PASS stabilization cycles. Every rule below exists because of a concrete bug or live-test finding — see `docs/source-current.md` (design/implementation facts) and `docs/bugs.md` (the incidents themselves) for the source material.

## 0. Relay → Mail substitution

The source design's "Relay" private-messaging system (distinct from the phone-call `Dialog` mechanic and the public `Pulse`/`Twotter` feed) has no native HackHub SDK equivalent — only `Mail` exists. Every quest that needs "Relay" content (first used for Adrian's short post-report response in Q01) implements it through the existing Mail channel. Treat this as an adapter detail, not a new story-system contract — do not build a second messaging primitive.

## 1. File split: `content/` declares, quest files call

- `src/content/qNN.ts` holds every piece of **data** a quest needs: target IPs/hosts, objective IDs, the `Objectives` array, nmap/lynx fixture results, network port lists, reward numbers, report subjects/bodies/templates, delay constants (`setTimeout` durations), template IDs/labels, the `HackhubPost` feed-post definition (content text + author), and the phone-call **`Dialog` tree** (all `QuestDialogDefinition` branches/lines — pure narrative data). `HackhubPost` was missed on the first pass for both Q01 and Q02 — it stayed as an inline object literal in the quest files until caught and corrected on 2026-09-14 — so treat it as content exactly like mail bodies, not as behavior. `Dialog` was missed the same way for Q03 (834-line quest file, caught and split out 2026-09-17) — check for this explicitly on every future quest with dialogue (Q08, Q09, Q11-Q16). The actual `Dialog.onEnd`/`onSelect` fix (bugs.md entry 1) only requires building `Dialog` with `switchBranch`/`isEnd` and zero function properties — no wrapper is required for a quest to work. `infrastructure/hackhub/dialog-utils.ts`'s `withDialogLineReadTap` Proxy wrapper is optional diagnostic tooling (logs which line was read, for debugging a stalled dialog) — reach for it only while investigating a dialogue problem, then remove it from the shipped `Dialog` field once the quest reaches FINAL LOCK (see §11).
- `src/infrastructure/hackhub/qNN-quest.ts` is the **only** quest file — it only **imports and uses** those declarations. No local `const` literal arrays/objects duplicating content that `content/` already owns. (Historical: this used to be two files, production + a separate `dev/qNN-replay-quest.ts`; the whole dev-replay-file system was removed and replaced by the single `isDev` flag — see §7.)
- Exception: small **helper functions** (fixture registration, host normalization, `sendAdrianMail`-style wrappers, event handlers) stay in the quest file — they are behavior, not content.

## 2. Content is a single value — never forked by `isDev`

Unlike the old (removed) production/replay-file split, `isDev` gates exactly three things (see §7) and nothing else. Mail bodies, `HackhubPost` text, delay/timer constants, and report subjects are each a **single** value in `content/qNN.ts` — never a `_PRODUCTION`/`_REPLAY` pair. Whether `isDev` is `true` or `false`, the player sees the same narrative content; only the dependency gate, objective unlock order, and reward-granting differ.

**`HackhubPost` text**: a short teaser that points to the mail for details ("Short audit for a client in Jakarta. Details in your mail.") — never a near-duplicate summary of the incoming mail's body (Q01's original text was corrected away from this on 2026-09-14).

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
- **Port 80 `CLOSE`, or absent from the fixture entirely** → `http://` **must** return a "400 Bad Request" page; only `https://` may serve real content. An unlisted port defaults to `CLOSE` — locked 2026-09-14 after `Q02EdgeWebsite` was found still serving identical content on both protocols despite its target's `NMAP_RESULT` never listing port 80 (fixed the same day; see `docs/bugs.md` entry 12).

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

## 7. `isDev` — the dev/prod flag (replaces the old dual-file replay system)

**Superseded 2026-09-17.** Q01–Q03 used to ship a second, hand-maintained `dev/qNN-replay-quest.ts` file per quest (separate quest class, separate build target, "DEV REPLAY" title). That whole system — the `dev/` folder, `scripts/build-*-replay.ts`, the `npm run build:replay:qNN` scripts — was deleted and replaced by a single boolean:

```ts
// src/content/dev-flag.ts
export const isDev = true; // flip to false for a real production/full-chapter run
export function applyDevGating(objectives) { /* strips unlocksAfter when isDev */ }
```

Every quest's production file (`src/infrastructure/hackhub/qNN-quest.ts` — the only quest file, per §1) imports `isDev`/`applyDevGating` and gates **exactly three things**, nothing else:

```ts
QuestsToComplete: isDev ? [] : [ /* real prerequisite quest ids */ ],
Objectives: applyDevGating(QNN_OBJECTIVES),
// inside OnComplete():
if (!isDev) {
    // Bank.transaction / RewardService claim / economy.applyMissionReward — the whole reward block
}
```

- `HackhubPost`, mail bodies, and delay constants are **not** forked by `isDev` (see §2) — there is no "[DEV]" variant of any narrative text.
- Full-chapter/full-campaign validation is done by literally setting `isDev = false` and playing the real quest chain in order — not a third mode, not a separate build.
- Flipping `isDev`, running `npm run build`, copying `dist/` into the HackHub mods folder, and restarting HackHub are **manual steps the user performs themselves** — Claude edits source and runs `typecheck`/`test`/`build` as verification only, and never touches the mods folder or restarts the game.
- Do not rely on a `hidden: true` field on an objective definition to make it surprise-reveal mid-quest. It exists in the SDK's `.d.ts` (undocumented) but was live-tested on Q02 (a hidden bonus objective meant to appear only once `completeObjective()` fired for it) and did **not** surface in-game — root cause not yet isolated (could be the field itself, or `completeObjective()` on a not-yet-"unlocked" objective being a no-op). Until this is diagnosed (e.g. with a temporary event-payload log, the same technique used to debug the Q02 GoMail template issue), keep every objective — mandatory or optional/bonus — visible in `QNN_OBJECTIVES` from the start rather than gating its visibility on `hidden`.

## 8. Docs and workflow discipline

- Each quest's recovered/adapted design source and implementation decisions live in `docs/source-current.md` (per-quest section, with a "Changes from original source" table); live-test findings/bugs go in `docs/bugs.md` as new numbered entries, not a new per-quest doc.
- **`docs/changelog.md` is the mandatory timeline — every real change gets a dated entry there** (not just a quest passing): a bug found or fixed, a mechanic changed, an email/domain rule changed, a doc reorganized, anything. One line, format and categories defined at the top of `changelog.md` itself. Full detail always lives in the specialized file (`source-current.md`/`bugs.md`/`email-rules.md`/`mechanics-reference.md`/this file/`implementation-notes.md`), never duplicated into the changelog entry itself.
- **Standing process for every iteration, Q04-Q16 (superseded 2026-09-17 by the `isDev` unification in §7 — no more separate replay build)**: discuss the design/fix before touching code → implement with `isDev = true` → `npm run typecheck` → `npm test` (or `npm run test:all` if the change touches `tests/engine/`) → `npm run build` → the user manually copies `dist/` into HackHub's mods folder and restarts → report back and wait for live-test feedback → iterate. When the quest is ready for a full-chapter/campaign validation pass, flip `isDev = false` and repeat the same build/install/restart steps for that run only. There is only one build target now (`npm run build`) — the old two-tier "skip production build until FINAL LOCK" tradeoff no longer applies, since `isDev` is a source-level flag, not a separate bundle.

## 9. Unreachable-host page template catalog

For any quest target that must exist narratively (nslookup/nmap fixtures reveal it) but must never actually be reachable, reuse the shared templates in `src/infrastructure/hackhub/websites/templates/` instead of relying on HackHub's generic "no such host" 404 or hand-rolling a new page from scratch. Both were designed and reviewed as an artifact mockup (three options compared) on 2026-09-14 before either was built — see the discussion in this session for the full comparison; only the two kept as templates are summarized here.

- **`unreachable-diagnostic.html` ("Diagnostic overlay") — IMPLEMENTED**, first used by `q02-cri-gateway-portal.ts` for the CRI gateway's hidden hostname/private IP (`Q02_HIDDEN_HOSTNAME` / `Q02_HIDDEN_HOSTNAME_IP`). Styled like the game's own network tools rendering a failed probe: a boot sequence that plays once on load via CSS `animation-delay`/`fill-mode: forwards` — `resolving TARGET` with its `...` revealed dot-by-dot then a green `ok`; `connecting to TARGET:PORT` the same dot-by-dot reveal then a red `error`; an ASCII retry bar that fills **FULL (never stops mid-fill)** each attempt across exactly 2 retries, resetting to empty after the first failure and — on the final attempt only — staying full **in red** instead of resetting again; then `timed out` / `route` / `SIGNAL LOST` (extra top margin separates this block from the retry bar above it). Respects `prefers-reduced-motion` (final state: full red bar, `retry 2/2 — failed`) and needs no external fonts (system monospace stack only, since the page runs in HackHub's own sandboxed iframe, not an Artifacts-CSP context). Revised 2026-09-14 from an earlier 3-retry version that settled at a partial (45%) width, which read as broken/stuck rather than deliberately failed. Placeholders: `__TARGET__` (the hostname or IP shown in the resolve/connect lines) and `__PORT__`. Register **one `Website` class per identifier** the player might type (hostname needs `Network.registerDomain`; a raw IP needs none, matching `Q02GatewayWebsite`'s existing pattern) — `Website.Host` only takes a single string, so a hostname and its IP both being reachable requires two registrations sharing the same rendered template.
- **`unreachable-perimeter.html` ("Perimeter notice") — RESERVED, not yet implemented anywhere.** A starker "ROUTE NOT PERMITTED" infrastructure block-page implying a deliberate wall rather than an accidental timeout — heavier foreshadowing, saved for a future quest (Q03+) where that stronger read is wanted. Placeholder: `__SEGMENT_CODE__`. Gut-check before use: it stays inside the "never name it" constraints of whichever quest deploys it, but the vibe alone reads more suspicious than the diagnostic template and may tip off a sharp player faster.
- Both templates follow the same render pattern already used for `q02-gateway-http-error.html`'s `__NGINX_VERSION__` placeholder: import the raw `.html` string, `.replace()` (or `.replaceAll()`) the placeholder(s), pass the result as a page's `html`. No `DynamicWebsitePageDefinition` needed unless the new use case also wants protocol-gating (§6) — the CRI gateway page deliberately does not, since being unreachable doesn't depend on `http://` vs `https://`.
- **Live-test gotcha, confirmed 2026-09-14**: `unreachable-diagnostic.html`'s boot-sequence animation (including the *infinite* SIGNAL LOST pulse) did not play at all in-game — it rendered the fully-settled end state instantly, with zero motion, on a machine where it should have animated. Root cause: HackHub's in-game browser is a real embedded browser engine (not a hand-rolled skin), and it reads the **Windows OS-level** `prefers-reduced-motion` media feature independently of any in-game "Reduce Motion" toggle HackHub itself exposes — the two are unrelated. This machine had Windows' own animation setting turned off (`Settings → Accessibility → Visual effects → "Animation effects"`, reachable via `Win+R` → `ms-settings:easeofaccess-visualeffects`); turning it on made the animation play immediately, with no code changes. Not a bug — the CSS was correctly honoring the accessibility preference it detected. Check this Windows setting first before treating a "frozen"/non-animating page as a code issue in future live-tests.

## 10. Character and organization email domains

Full rules and revision history live in `docs/email-rules.md` — summary for quick reference when introducing a new contact or org mailbox in Q03-Q16:

- **Personal/individual character** (a contact not tied to a visible organization's own website, e.g. Adrian) → `.void` TLD (e.g. `phantom-net.void`). Add the identity to `src/content/characters.ts` before implementing the quest that sends/receives mail from them — never a per-quest random alias.
- **Organization mailbox** → that organization's own hostname TLD, matching its `Website.Host` (e.g. `@skynet-logistics.idx`, not `.void`) — an org's mail domain realistically matches its own web domain.
- Never invent a third TLD for either case without updating the contract doc first.

## 11. FINAL LOCK comment policy — MANDATORY RULE

Once a quest reaches **FINAL LOCK** (its design and live-test cycle are done, no further behavior changes expected), its source files must end up **comment-free**, with every genuinely useful piece of institutional knowledge relocated to permanent docs first:

1. Read every comment in that quest's `content/qNN.ts`, `infrastructure/hackhub/qNN-quest.ts`, and any `infrastructure/hackhub/commands/qNN-*.ts` files.
2. For each comment that records a real decision, bug, SDK quirk, or rationale not already covered: add/extend the matching entry in `docs/bugs.md` (engine/SDK bugs and quirks) or the quest's section in `docs/source-current.md` (design/story/objective rationale) — never a new doc file, never a per-quest scratch file.
3. Only after every comment's content has a permanent home, delete the comments from the source file. A comment that only restates what the code already says (no non-obvious "why") can be deleted outright with no doc entry.
4. Verify with `grep -n "//"` (and `grep -n "console\."`, see §12) on every touched file — zero matches expected.

This does **not** apply retroactively to quests that are still in progress (not yet FINAL LOCK) — normal in-progress commenting is fine while a quest's design is still settling. Applied to Q03 2026-09-17 (see `docs/bugs.md` entries 18-24 and `docs/source-current.md`'s Q03 section for what was extracted).

## 12. Diagnostic tracing — MANDATORY RULE

Never call `console.log` directly for a debugging/trace print. Use the shared `trace(scope, message, ...args)` helper in `src/infrastructure/hackhub/logger.ts` instead — one place that owns the log format (`[SCOPE DIAG] message`), so tracing never sprawls into scattered ad-hoc `console.log` calls across quest files again. Remove all `trace()` calls from a quest's source once it reaches FINAL LOCK, per §11 — tracing is investigation tooling, not shipped behavior.
