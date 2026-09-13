# ENTITY RESOLUTION — Quest Implementation Structure Standard

Date: 2026-09-14
Status: **LOCKED** — this is the mandatory structural pattern for every quest from Q03 through Q16. It must not change without the user's explicit request, regardless of how any individual quest's story content differs.

This standard was derived from Q01 and Q02's full implementation, live-validation, and post-PASS stabilization cycles. Every rule below exists because of a concrete bug or live-test finding — see `docs/phase13-q01-final-lock.md` and `docs/phase13-q02-source-recovered.md` for the incidents that produced them.

## 1. File split: `content/` declares, quest files call

- `src/content/qNN.ts` holds every piece of **data** a quest needs: target IPs/hosts, objective IDs, the `Objectives` array, nmap/lynx fixture results, network port lists, reward numbers, report subjects/bodies/templates, delay constants (`setTimeout` durations), template IDs/labels.
- `src/infrastructure/hackhub/qNN-quest.ts` (production) and `dev/qNN-replay-quest.ts` (replay) only **import and use** those declarations. No local `const` literal arrays/objects duplicating content that content/ already owns.
- Exception: small **helper functions** (fixture registration, host normalization, `sendAdrianMail`-style wrappers, event handlers) stay in the quest files — they are behavior, not content, even though production and replay each define their own copy.

## 2. Content that genuinely differs between production and replay

When text must legitimately differ (production mentions a real money reward, replay says "DEV replay complete."; production's incoming mail is the full narrative, replay's is a terse test fixture) — define **both** as separately named exports in `content/qNN.ts`, suffixed `_PRODUCTION` / `_REPLAY`. Never fall back to a bare local literal in the quest file to sidestep this — that was the exact mistake corrected for `Q01_COMPLETION_MAIL_CONTENT` / `Q02_COMPLETION_MAIL_CONTENT` post-PASS.

If an `Objectives` array's wording is fully identical between production and replay, export ONE shared `QNN_OBJECTIVES` array (`Q02_OBJECTIVES` pattern). If even one hint differs, keep `Objectives` local per file rather than forcing a fake shared array with overrides.

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

## 6. Website protocol-gating (HTTPS-only hosts)

For any `Website` whose native port profile is HTTPS-only (per its `NMAP_RESULT` fixture — port 80/plain-HTTP `CLOSE`), gate its pages with a `DynamicWebsitePageDefinition` instead of a static one:

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

## 8. Docs and workflow discipline

- Every quest gets its own `docs/phase13-qNN-source-recovered.md` (or equivalent) recording: recovered/adapted design source, implementation decisions, live-test findings (numbered, appended as new bugs surface), and a final "Post-validation stabilization" section for anything found after the initial PASS.
- `docs/phase13-sequential-campaign-lock.md` and `docs/phase13-story-implementation.md` get their status line and "Current Target" section updated the moment a quest passes.
- Standing process for every change, no exceptions: discuss the design/fix before touching code → implement → `npm run typecheck` (both the main tsconfig and the standalone `dev/` check) → `npm test` → `npm run build` (production) → `npm run build:replay:q01` → install **only** the replay build into HackHub's mods folder → report back and wait for live-test feedback → iterate. Production is built every time (so it never silently falls behind) but is not installed/live-tested until the full Q01→Q16 combined regression pass.
