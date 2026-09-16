# ENTITY RESOLUTION — Original Source (early design pass, unedited)

This file preserves the **original design content exactly as it was first
written**, before any in-engine feasibility work, renaming, or
live-test-driven changes happened. Nothing in this file is canon and nothing
here should be implemented literally — it is a historical record only. For
what is actually live in the game today, see `docs/source-current.md`.

Source: an early design conversation supplied by the project owner, predating
this repository's implementation work.

Original naming used throughout this file (do not "fix" it — that mapping is
itself documented in `docs/source-current.md`):

```text
Quest IDs:        dead_signal_qNN
Chapter 1 title:  DEAD SIGNAL
Client:           Meridian Logistics
Client domain:    meridian.local
```

---

## Q01 — THE CONTRACT (original)

Extracted from "Detailed Quest Design — Q01: THE CONTRACT"
(source lines ~6382–6787) and cross-checked against the later "Chapter 1
Final Resume + Consistency Audit" pass (source lines ~9233–9296), which
independently re-confirms the same numbers — this was never revised again
within the source itself.

### Basic Information

| Field | Value |
|---|---|
| Quest ID | `dead_signal_q01` |
| Title | THE CONTRACT |
| Chapter | 01 — DEAD SIGNAL |
| Location | Jakarta |
| Primary Character | Adrian Cole |
| Difficulty | Easy |
| Estimated Playtime | 8–12 minutes |
| Narrative Function | Establish player, Adrian, and normal gameplay loop |

### Opening

No dramatic opening, no hacking montage, no mysterious voice — deliberately.
Player receives:

```text
Subject: Security Audit — Jakarta

I have a client looking for a short security audit.

Nothing complicated.

One external network.
A few services.
Basic vulnerability assessment.

If you're interested, I'll send the scope.

— Adrian
```

Player accepts.

### Objectives (4, linear)

```text
01 — Accept the contract
02 — Review the target
03 — Scan the network
04 — Submit the audit
```

**01 — Accept the contract.** Player opens the email and accepts. Introduces
Adrian, the player's profession, and the client. No mystery.

**02 — Review the target.** Player receives:

```text
CLIENT

Company:
Meridian Logistics

Location:
Jakarta

Target:
203.0.113.42

Scope:
External infrastructure only.

Authorized:
Network discovery
Service enumeration
Basic vulnerability checks

Not Authorized:
Data extraction
Internal access
Credential attacks
```

Meridian Logistics is a fictional company. ARKA is not yet named as a
conspiracy center — the source notes it may later turn out that Meridian uses
ARKA-managed infrastructure.

**03 — Scan the network.**

```text
> nmap 203.0.113.42
```

```text
PORT     STATE    SERVICE
22/tcp   open     ssh
80/tcp   open     http
443/tcp  open     https
```

Explicit design note: keep this simple, all three ports open, no CRI content
surfaced here — "Q01 harus terasa normal" (Q01 must feel normal).

**04 — Submit the audit.**

```text
Target: Meridian Logistics
Open Ports: 22, 80, 443

No critical vulnerabilities identified.

Further internal assessment is recommended.
```

### Adrian's response

```text
Adrian:
Looks clean.

Client should be happy.

Payment's on the way.
```

```text
Adrian:
I'll let you know if they need anything else.
```

Quest ends.

### Reward

```text
Money: $500
XP: 25
```

Explicit design note: "reward tidak boleh terasa terlalu besar" — the reward
must not feel too large, the player is just starting out. Figures are
flagged as placeholder, to be tuned against the game's real economy later.

### Hidden detail (breadcrumb, not an objective)

The nmap scan's HTTPS certificate:

```text
Issuer:
ARKA Secure Infrastructure
```

Never called out by any objective ("Investigate ARKA" does not exist). A
careful player may notice it; an inattentive player completes the quest
regardless. Explicit design rationale: avoid forced exposition.

### Completion / transition

```text
ACCOUNT

+$500

SOURCE:
Meridian Logistics
```

then, a few seconds later:

```text
EMAIL

From: Adrian Cole

Got another one for you.

Different client.

Same kind of work.
```

Chapter 1 continues to **Q02 — THE ANOMALY**.

### Design rationale (why this simple)

Explicit source commentary: introducing government/CIA/secret-database/
military/conspiracy elements all at once gives the player no baseline to
compare "normal" against "wrong." Q01 must produce the thought *"Okay, I'm a
freelance security engineer. This is my job."* — so that Q02 breaking that
assumption lands. Stated narrative principle: **"Nothing is wrong. At least,
nothing the player knows about yet."**

### Status at time of writing

Marked ✅ across story/character/objectives/gameplay/reward/breadcrumb/SDK
mapping, but explicitly **not yet production-locked** — the source itself
says this is pending a check of whether every objective is realizable against
the real HackHub API. (It was not realizable as written — see
`docs/source-current.md` for what actually shipped.)

---

## Q02 — THE ANOMALY (original)

Reconstructed (not re-extracted verbatim) from the naming-adaptation table
and superseded-draft figures already documented in the current doc this
project built from source — the underlying mechanism (nmap → cert inspection
→ hidden SAN → optional DNS lookup) is the same in source and live game; only
naming and reward numbers changed.

### Basic Information

```text
ID:            dead_signal_q02
Title:         THE ANOMALY
Chapter:       01 — DEAD SIGNAL
Location:      Jakarta
Primary:       Adrian Cole
Prerequisite:  dead_signal_q01 completed
Client:        Meridian Logistics
New target:    edge-03.meridian.local (host absent from the client's asset inventory)
Reward (draft): $350 + 35 XP
```

### Opening

A few hours after Q01 closes, Adrian sends a short, non-alarming follow-up
naming one new host not in Meridian Logistics' asset inventory:
`edge-03.meridian.local`.

### Objectives (5 mandatory + 1 optional)

```text
01 Check the new target       — review Adrian's brief; host not in inventory
02 Scan the host              — nmap edge-03.meridian.local → 22/tcp, 443/tcp, 8443/tcp open
03 Identify the service       — service enumeration on port 8443 → nginx, X-Service: gateway.internal
04 Inspect the certificate    — Subject: gateway.internal / Issuer: ARKA Secure Infrastructure
                                 hidden SAN entry: cri-gateway.internal (never surfaced as an objective)
05 Report the anomaly         — send findings to Adrian; player does not accuse anyone
   (optional) Check the DNS   — nslookup cri-gateway.internal → 10.42.7.18 (private, unreachable)
```

Design constraint (explicit in source): Q02 must never say CRI, CIVIC,
GOVERNMENT, RISK, or SURVEILLANCE by name — only "ARKA", "gateway.internal",
and "unknown infrastructure."

### Adrian's reaction

First behavioral anomaly — instead of forwarding the report as usual, Adrian
asks the player to hold it while he "confirms something first."

### Persistent state (draft naming)

```text
dead_signal.q02.anomaly_found
dead_signal.q02.arka_certificate_found
dead_signal.q02.cri_hostname_found
dead_signal.q02.cri_private_ip_found
dead_signal.q02.adrian_suspicious
```

### Reward (draft, superseded)

```text
$350 money
+35 XP
```

Superseded by the source's own later "Phase 8" economy-lock pass — see
`docs/source-current.md` for the final $250/90 XP figures.

---

## Q03 — MISSING LOGS (original)

Same reconstruction approach as Q02 — mechanism unchanged from source
(ssh → log review → rotation gap → optional backup check → report), only
naming and reward numbers differ.

### Basic Information

```text
ID:            dead_signal_q03
Title:         MISSING LOGS
Chapter:       01 — DEAD SIGNAL
Location:      Jakarta
Primary:       Adrian Cole
Prerequisite:  dead_signal_q02 completed
Client:        Meridian Logistics
Target:        edge-03.meridian.local (same host Q02 investigated)
Reward (draft): $350 + 40 XP
```

### Opening

Adrian forwards the client's response: they claim `edge-03` is old,
decommissioned infrastructure, and want confirmation it isn't still active.
"Don't touch anything else" — a small, deliberate tell that Adrian is being
more careful than a routine audit calls for.

### Objectives (5 mandatory + 1 optional)

```text
01 Connect to the server        — ssh into edge-03.meridian.local
02 Check the system logs        — access.log only goes back a few days despite
                                   months of runtime
03 Determine last activity      — stat/boot-history checks show activity further
                                   back than the logs cover
04 Investigate missing entries  — rotated gateway logs have a gap (some .gz
                                   archives simply don't exist)
05 Report findings              — no accusation, just "the evidence is incomplete"
   (optional) Check the backup  — same gap exists in the backup archive;
                                   metadata: retention-policy: restricted;
                                   hidden clue: policy_id: CRI-07 (never explained)
```

Hard narrative constraint (explicit in source): the player must never be told
"the logs were deleted" — only that they're incomplete.

### Adrian's reaction

Escalates the Q02 pattern: Adrian asks the player not to include the backup
finding in the client report, without explaining why. First explicit setup
of his arc: Complicity → Responsibility.

### Persistent state (draft naming)

```text
dead_signal.q03.logs_missing
dead_signal.q03.backup_checked
dead_signal.q03.backup_restricted
dead_signal.q03.cri_policy_found

# Global (unprefixed in source, i.e. not per-quest):
dead_signal.adrian_suspicious
dead_signal.adrian_warned_player
```

### Reward (draft, superseded)

```text
$350 money
+40 XP
```

Superseded by the source's own later "Phase 8" economy-lock pass — see
`docs/source-current.md` for the final $300/100 XP figures.

## Q04–Q16 (original — Phase 8 spec, full detail)

The source's own "PHASE 8 — COMPLETE TECHNICAL QUEST SPEC" pass (plus its
later "XP ALLOCATION REVISION" for the final numbers) is the earliest full
spec found for this whole range — reproduced here in full, in original
naming, so this file stands on its own. Q04 also has an even earlier draft
(see its own subsection). Q14/Q15 were later superseded again by a dedicated
locked spec after Phase 8 — that final layer lives in `docs/source-current.md`;
what's below for Q14/Q15 is the Phase-8-era draft only.

Naming for this whole range: `dead_signal_qNN` IDs; unprefixed flags
(`marcus_introduced`, `adrian_suspicious`, etc.) are campaign-wide, not
quest-scoped; chapter titles `DEAD SIGNAL` / `THE LIST` / `FALSE POSITIVE` /
`THE OVERRIDE` (only Chapter 1's rename to `GHOST SERVER` has been decided).
Dependency chain is strictly linear, `Q01→Q02→...→Q16`.

### Q04 — LEAVE IT ALONE

**Earliest draft** (from the "Chapter 1 Final Resume + Consistency Audit"
pass, predating Phase 8): 4 objectives (review the decommission notice,
verify server status, close the audit, decide what to do with the evidence)
plus one optional ("check the last connection" — `10.42.7.18` shows a
successful `gateway.log` session with no matching `auth.log` entry). Reward:
**$350 money, +45 XP main / +15 XP optional**.

**Phase 8 (final draft, used below):**

```text
ID:      dead_signal_q04 · Chapter 01 — DEAD SIGNAL · Jakarta · Primary: Adrian
Time:    12–18 min · Difficulty: Medium
Depends on: dead_signal_q03.completed = true · Next: Q05
```

Premise: client confirms `edge-03`'s decommission and asks Adrian to close
the audit — but the server is still live until the stated cutoff, and
Adrian's "leave it alone" is his first moment of visibly knowing more than
he says.

Objectives (4 mandatory + 1 optional):

```text
1. reviewDecommissionNotice — review the notice (still before the cutoff time)
2. verifyServerStatus       — verify the server is still active (ping/nmap,
                               same ports as Q02: 22/443/8443)
3. closeAudit                — close the audit (close-as-requested vs. add-a-note,
                               both valid)
4. decideOnEvidence          — decide what to do with remaining evidence
                               (leave it alone / keep a copy / take one last look
                               — the third opens the optional objective)
5. (optional) checkLastConnection — 10.42.7.18 (Q02's cri-gateway.internal IP)
                               shows a successful session in gateway.log with
                               no matching auth.log entry — a log/auth mismatch
```

Reward: $350 money, **100 XP max** (verify decommission 20, investigate
active server 20, analyze last connection 20, identify auth/log mismatch 20,
preserve/recognize anomalous evidence 20).

State: `dead_signal.q04.completed`, `dead_signal.q04.last_connection_checked`,
`dead_signal.q04.cri_ip_confirmed`, `dead_signal.q04.log_mismatch_found`, plus
campaign-wide `adrian_warned_player = true`, `unknown_contacted_player = true`
(sets up the anonymous "You shouldn't have looked... — U" mail that closes
Chapter 1), `cri_known = false` (still unresolved going into Chapter 2).

### Q05 — SECOND CLIENT

```text
ID: dead_signal_q05 · Chapter 02 — THE LIST · Jakarta
Primary: Adrian · Supporting: Maya Hart (introduced) · ~15 min · Medium
Depends on: dead_signal_q04.completed = true · Next: Q06
```

Premise: a new client engagement (Nusantara Pay) surfaces a restricted
internal "classification" API surface echoing Q02–Q04's ARKA/CRI breadcrumbs;
Maya reaches out separately about unrelated financial-review irregularities.

Objectives (4 mandatory + 1 optional):

```text
1. reviewScope                     — review assessment scope
2. inspectApiSurface                — inspect staging.nusantarapay.id
3. identifyClassificationEndpoints  — /api/internal/classification and siblings
                                       (do NOT bypass auth)
4. inspectStagingEnvironment        — inspect the "Operations Classification Console"
5. (optional) enumerateApi          — enumerate the full set of restricted
                                       classification endpoints
```

Reward: $400 money, **100 XP max** (audit 20, ARKA pattern 15, classification
API 20, internal endpoint discovery 15, Maya's public-report correlation 10,
API enumeration 10, "recognize pattern without claiming proof" 10).

State: `dead_signal.q05.completed`, `.arka_infrastructure_found`,
`.classification_api_found`, `.api_enumerated`, `.maya_contacted`,
`.maya_replied`, plus campaign-wide `adrian_knows_pattern = true`.

### Q06 — THE DATABASE

```text
ID: dead_signal_q06 · Chapter 02 · Jakarta
Primary: Adrian · Supporting: Maya · 12–18 min · Medium
Depends on: dead_signal_q05.completed = true · Next: Q07
```

Premise: a diagnostic archive (`classification_snapshot.db`) is discovered —
first quest to explicitly name **CRI** ("Civic Risk Index") and introduces
Rizky Pratama as a HIGH-risk (score 74, confidence 0.58, PENDING/AUTOMATED
review) record.

Objectives (4 mandatory + 1 optional, two named sub-checks):

```text
1. inspectDatabase        — schema: subjects/classifications/events/organizations/
                             system_metadata/model_versions/data_sources
2. identifySystemMetadata — this is where "Civic Risk Index / CRI" is confirmed
3. inspectDataSources
4. investigateRizky       — HIGH/74/0.58/PENDING/AUTOMATED, reason:
                             "association threshold exceeded"
5. (optional) checkModel  — CRI-Core model version v3.7, updated 2026-07-14
6. (optional) traceRecord — Rizky's score history LOW → MEDIUM → HIGH
```

Reward: $450 money, **120 XP max** (locate archive 20, inspect schema 20, CRI
definition 15, data sources 15, investigate Rizky 20, confidence/history
analysis 10, model metadata 10, trace history 10). XP is for *finding* the
facts, explicitly not for concluding CRI was manipulated.

State: `dead_signal.q06.completed`, `.cri_database_found`,
`.cri_definition_found`, `.model_metadata_found`, `.data_sources_found`,
`.rizky_found`, `.rizky_high_risk`, `.rizky_low_confidence`,
`.rizky_history_found`, `.rizky_score_jump_found`, `.maya_contact_established`,
`.maya_trust_increased`, plus campaign-wide **`cri_known = true`** (first
quest CRI stops being a mystery term).

### Q07 — CONNECTIONS

```text
ID: dead_signal_q07 · Chapter 02 · Jakarta → Bandung
Primary: Daniel (introduced) · Supporting: Maya + Adrian · 15–20 min · Medium
Depends on: dead_signal_q06.completed = true · Next: Q08
```

Premise: establishes the relationship/association-weighting mechanism CRI
uses to compute risk, comparing Rizky against two other subjects
(Dimas/Naufal). First appearance of Daniel.

Objectives (3 mandatory + 1 optional):

```text
1. inspectRelationshipData
2. identifyAssociationWeighting — the association_weight mechanism and its
                                   contribution to risk
3. compareSubjects              — Rizky/Dimas/Naufal, trace the relationship network
4. (optional) mapNetwork        — map the network to find SUBJECT-88172
                                   (restricted access — becomes Q08's thread)
```

Reward: $500 money, **120 XP max** (relationship model 20, association_weight
ID 15, risk contribution 15, network analysis 20, understand mechanism 20,
map graph 15, restricted subject 5, correct interpretation 10).

State: `dead_signal.q07.completed`, `.relationship_system_found`,
`.association_weight_found`, `.risk_contribution_found`, `.network_mapped`,
`.restricted_subject_found`, plus campaign-wide `daniel_introduced = true`,
`daniel_pipeline_confirmed = true`, `daniel_trust = 1`,
`adrian_knows_network_analysis = true`, `adrian_complicity_increased = true`,
`maya_player_record_found = true`, `cri_uses_relationships = true`.

### Q08 — YOUR NAME

```text
ID: dead_signal_q08 · Chapter 02 · Jakarta
Primary: Maya · Supporting: Adrian + Daniel · 15–20 min · Medium
Depends on: dead_signal_q07.completed = true · Next: Q09 (Chapter 3 begins)
```

Premise: the personal turn — the player finds their **own** CRI record
(LOW/18/0.94/MANUAL review, reason `ENTITY_ASSOCIATION`, score history
12→15→18) and discovers they're linked to the same `SUBJECT-88172` as Rizky
(confidence 0.67). Closes Chapter 2.

Objectives (3 mandatory + 1 optional):

```text
1. locatePlayerRecord
2. inspectPlayerClassification    — LOW/18/0.94/MANUAL/ENTITY_ASSOCIATION
3. inspectPlayerRelationship      — player → SUBJECT-88172 (same subject as Rizky)
4. (optional) identifyRestrictedSubject — match_method = PROBABILISTIC,
                                    match_confidence = 0.67
```

Reward: $550 money, **120 XP max** (find record 20, classification analysis
15, manual review ID 15, trace relationship 15, identify SUBJECT-88172 10,
entity resolution investigation 15, low match confidence 10, correlate
player/Rizky 10, recognize entity-resolution concern 10). No XP tied to any
emotional/roleplay choice.

State: `dead_signal.q08.completed`, `.player_record_found`,
`.player_record_active`, `.player_risk_level = LOW`, `.player_manual_review`,
`.player_review_reason = ENTITY_ASSOCIATION`, `.restricted_subject_linked`,
`.entity_match_checked`, `.low_match_confidence_found`,
`.player_linked_to_subject`, `.rizky_linked_to_subject`, plus campaign-wide
`daniel_entity_resolution_concern = true`, `maya_player_record_found = true`,
`player_in_cri = true`.

### Q09 — RIZKY PRATAMA

```text
ID: dead_signal_q09 · Chapter 03 — FALSE POSITIVE · Jakarta
Primary: Maya · Supporting: Daniel · 15–20 min · Medium
Depends on: dead_signal_q08.completed = true · Next: Q10
```

Premise: the player interviews Rizky directly. His CRI classification cites
communication record `COM-07-88421` as evidence, but that record cannot be
found in available phone records — a source conflict, not proof of
innocence. Establishes the campaign's central epistemic rule.

Objectives (4 mandatory + 1 optional):

```text
1. reviewRizkyCase
2. interviewRizky
3. inspectCriClassification
4. verifyCom07        — compare COM-07-88421 against phone records (missing)
5. (optional) checkSource — check source metadata (payload unavailable —
                            a source conflict, not a resolution)
```

Critical rule: the report/conclusion text must never say "no communication
occurred," only "the source cannot currently be supported by available
records."

Reward: $600 money, **125 XP max** (interview/review 20, classification
review 15, relationship evidence 20, compare source records 20, identify
missing record 15, check metadata 10, manual clearance 5, **correctly
conclude evidence is insufficient 20** — the single largest line item,
deliberately weighted toward the epistemic lesson over fact-finding).

State: `dead_signal.q09.completed`, `.rizky_interviewed`,
`.rizky_case_reviewed`, `.source_conflict_found`, `.source_checked`,
`.manual_clearance_found`, plus campaign-wide
`rizky_false_connection_suspected = true`, `cri_data_integrity_questioned = true`.

### Q10 — THE FALSE CONNECTION

```text
ID: dead_signal_q10 · Chapter 03 · Jakarta → Bandung
Primary: Daniel · Supporting: Maya · 15–20 min · Medium→Hard
Depends on: dead_signal_q09.completed = true · Next: Q11
```

Premise: the player traces the full entity-resolution pipeline (raw source →
entity resolution → candidate → accept → relationship → CRI) and finds the
critical fact: the raw source for `COM-07-88421` never actually contained
`SUBJECT-88172` — that relationship was *generated* by the entity-resolution
step itself, at only 0.67 confidence.

Objectives (4 mandatory + 1 optional):

```text
1. locatePipelineArchive
2. inspectRawSource          — the raw COM-07-88421 source
3. traceEntityResolution     — PERSON-19382 → SUBJECT-88172, confidence 0.67, ACCEPT
4. identifyProvenanceGap     — original source doesn't contain SUBJECT-88172 at all
5. (optional) checkResolutionLog — the resolution log for the accept decision
```

Reward: $650 money, **130 XP max** (locate archive 15, inspect raw source 20,
trace resolution 20, identify candidate 15, identify 0.67 confidence 10,
trace generated relationship 15, identify incomplete provenance 15, check
log 10, correctly reconstruct 10).

State: `dead_signal.q10.completed`, `.pipeline_archive_found`,
`.entity_resolution_found`, `.relationship_generated_by_resolution`,
`.entity_match_confidence = 0.67`, `.source_provenance_incomplete`,
`.resolution_log_checked`, `.resolution_decision_found`, plus campaign-wide
`daniel_pipeline_understood = true`, `daniel_accountability_increased = true`.

### Q11 — DANIEL

```text
ID: dead_signal_q11 · Chapter 03 · Bandung
Primary: Daniel · Supporting: Maya · 15–20 min · Medium
Depends on: dead_signal_q10.completed = true · Next: Q12
```

Premise: compares the historical (human-review-required) vs. current
(automatic-acceptance-with-conditional-exception) resolver pipeline, and
identifies Daniel's own 2026-01-18 engineering change to `resolver-service`
("support normalized relationship events for downstream processing") as a
contributing — not culpable — technical cause.

Objectives (4 mandatory + 1 optional):

```text
1. inspectHistoricalArchitecture
2. compareResolvers        — review wasn't removed, it became conditional
3. identifyReviewException — the human-review exception behavior
4. inspectDanielsChange    — component resolver-service, dated 2026-01-18
5. (optional) checkTheChange — check further, then question Daniel directly
```

Reward: $650 money, **130 XP max** (locate archive 15, reconstruct legacy
pipeline 20, reconstruct current pipeline 20, conditional review 15,
automatic acceptance 15, review exception 10, Daniel's component/change 10,
check change 5, correctly identify reduced review coverage 10). Explicitly no
XP for accusing Daniel of being the manipulator — reward is for the more
precise conclusion "Daniel contributed to the technical change, but that does
not make him the operator."

State: `dead_signal.q11.completed`, `.historical_pipeline_found`,
`.old_review_flow_found`, `.current_review_flow_found`,
`.automated_acceptance_found`, `.human_review_exception_found`,
`.daniel_component_confirmed`, `.daniel_change_found`,
`.review_coverage_reduced`, plus campaign-wide
`daniel_complicity_confirmed = true`, `daniel_accountability_increased = true`.

### Q12 — THE PIPELINE

```text
ID: dead_signal_q12 · Chapter 03 · Bandung → Jakarta
Primary: Daniel · Supporting: Maya · 15–20 min · Hard
Depends on: dead_signal_q11.completed = true · Next: Q13
```

Premise: Maya hands the player policy ID `POL-1847`. Comparing legacy
(`relationship_review_mode = REQUIRED`) against current (`CONDITIONAL` +
`approved_source_bypass = ENABLED`) configuration explains exactly why
`COM-07`-class sources skip review — a *policy* decision, deployed
2026-07-14, with its approval identity redacted.

Objectives (4 mandatory + 1 optional):

```text
1. inspectPolicyHistory        — POL-1847
2. compareConfigurations       — legacy vs. current
3. identifyReviewBehaviorChange — REQUIRED → CONDITIONAL, bypass enabled
4. determineCom07Behavior      — review_requirement = NOT_REQUIRED under the new policy
5. (optional) checkChangeHistory — the policy's change history (approval trail, identity redacted)
```

Reward: $650 base + $50 optional = **$700 max**, **140 XP max** (base 120:
locate archive 15, compare policy 25, conditional review 20, approved-source
bypass 20, trace COM-07 15, identify POL-1847 10, deployment date 5, correct
interpretation 10 · optional 20: check change history).

State: `dead_signal.q12.completed`, `.policy_found`, `.legacy_policy_found`,
`.current_policy_found`, `.conditional_review_found`,
`.approved_source_bypass_found`, `.com07_review_not_required`,
`.policy_change_found`, `.policy_history_found`,
`.policy_deployment_date_found`, `.approval_identity_redacted`, plus
campaign-wide `cri_policy_change_confirmed = true`,
`cri_automation_expanded = true`.

### Q13 — THE OPERATOR

```text
ID: dead_signal_q13 · Chapter 03 · Jakarta
Primary: Maya · Supporting: Daniel + Adrian · 18–25 min · Hard
Depends on: dead_signal_q12.completed = true · Next: Q14 (Chapter 4 begins)
```

Premise: the player locates the privileged `OVERRIDE_OPERATOR` account
(active since 2026-06-18) and its activity log — including the 2026-08-18
`CONFIGURATION_OVERRIDE` session `A-77402` originating from `10.42.7.31`
(ARKA's administrative network) — establishing a real privileged operator
performed the policy change, without yet identifying who controls it.
Explicit rule: this does NOT prove an ARKA institutional conspiracy.

Objectives (4 mandatory + 1 optional):

```text
1. searchOperationalAudit
2. identifyPrivilegedIdentity  — the OVERRIDE_OPERATOR identity
3. traceActivity                — POL-1847 deploy, policy reloads, the 08-18 override
4. correlateOriginNetwork       — 10.42.7.31 → ARKA Administrative Network
5. (optional) investigateFirstUse — first use / account origin
```

Reward: $700 base + $100 optional = **$800 max**, **150 XP max** (base 135:
locate account 20, inspect metadata 15, trace activity 20, link to policy 20,
analyze session A-77402 20, correlate origin 15, confirm privileged identity
15, correctly maintain unknown-operator status 10 · optional 15: investigate
first use). No XP for concluding Marcus is the operator — explicitly wrong at
this stage.

State: `dead_signal.q13.completed`, `.override_account_found`,
`.override_account_active`, `.policy_deployment_linked`,
`.configuration_activity_found`, `.com07_policy_activity_found`,
`.arka_network_origin_confirmed`, `.first_use_found`,
`.override_account_origin_found`, `.override_audit_found`,
`.operator_account_confirmed`, `.operator_identity_unknown = true`.

### Q14 — THE OWNER (Phase 8 draft — superseded, see `source-current.md`)

```text
ID: dead_signal_q14 · Chapter 04 — THE OVERRIDE · Jakarta
Primary: Maya · Supporting: Daniel + Adrian + Marcus (introduced) · 18–25 min · Hard
Depends on: dead_signal_q13.completed = true · Next: Q15
```

Premise: traces the `OVERRIDE_OPERATOR` account's delegated-access model to
an approved access request (`AR-44192`, window 2026-08-18 01:45–03:00,
linked to session `A-77402`) approved by `M.REED` — resolved to Marcus Reed,
ARKA's Executive Director of Security Administration. Marcus = authorized
approver ≠ confirmed operator.

Objectives (4 mandatory + 1 optional):

```text
1. inspectAccessRegistry
2. traceDelegatedAccess    — owner: Operations, approval required, group: OPERATIONS-SECURITY
3. findAuthorizationRequest — AR-44192, linked to session A-77402
4. identifyApprover         — M.REED → Marcus Reed
5. (optional) checkExceptionAccess — check exception-access details, then interview Marcus
```

Reward: $700 base + $100 optional = **$800 max**, **140 XP max** (base 130:
locate registry 15, delegated access model 15, authorization window 15, link
AR-44192 20, link A-77402 20, identify M.REED 15, correlate to Marcus Reed
15, correctly distinguish approver from operator 15 · optional 10: check
exception access). Deliberately rewards *not* overclaiming Marcus's
involvement.

State: `dead_signal.q14.completed`, `.override_access_registry_found`,
`.delegated_access_confirmed`, `.access_window_found`,
`.override_session_found`, `.marcus_access_approval_confirmed`,
`.marcus_reed_confirmed`, `.operator_identity_unknown = true`,
`.exception_access_found`, `.primary_audit_system_required`, plus
campaign-wide `marcus_introduced = true`, `marcus_authority_confirmed = true`.

**This entire draft was superseded** by a dedicated locked spec supplied
after Phase 8 (6 mandatory + 1 optional objectives) — see
`docs/source-current.md`, which is what `src/content/q14.ts` actually
implements.

### Q15 — THE EVIDENCE (Phase 8 draft — superseded, see `source-current.md`)

```text
ID: dead_signal_q15 · Chapter 04 · Jakarta
Primary: Maya · Supporting: Daniel + Marcus · 20–30 min · Hard
Depends on: dead_signal_q14.completed = true · Next: Q16
```

Premise: the technical climax. The player accesses the encrypted forensic
export (`operations_audit_2026-08-18.enc`), reconstructs the full `A-77402`
action timeline (login → open policy → CONFIGURATION_OVERRIDE →
save/validate/reload → open COM-07 → logout), and formally correlates
operator identity through to `ARKA-OPS-0441`. Proves the *conditions*
changed (policy config), explicitly not that anyone manually edited Rizky's
risk score.

Objectives (5 mandatory + 1 optional):

```text
1. accessForensicExport
2. reconstructSession          — session A-77402's full timeline
3. compareBeforeAfterPolicy    — REQUIRED/bypass disabled vs. CONDITIONAL/bypass enabled
4. reconstructRizkyChain       — COM-07-88421 → 0.67 → SUBJECT-88172 → accepted →
                                  review not required → CRI risk 74
5. correlateOperatorIdentity   — through to ARKA-OPS-0441; assemble the evidence package
6. (optional) verifyBeforeAfterIndependently
```

Reward: $700 base + $200 optional = **$900 max**, **150 XP max** (base 140:
access export 15, locate A-77402 15, reconstruct session 20, reconstruct
override 20, compare before/after 20, trace COM-07 path 15, correlate
operator identity 15, reconstruct Rizky chain 10, correctly distinguish
policy/input manipulation from score editing 10 · optional 10: verify
independently).

State: `dead_signal.q15.completed`, `.primary_audit_accessed`,
`.operator_session_found`, `.operator_identity_hash_found`,
`.operator_identity_correlated`, `.policy_change_reconstructed`,
`.relationship_policy_modified`, `.com07_policy_path_confirmed`,
`.rizky_processing_chain_reconstructed`, `.before_after_policy_verified`,
`.review_behavior_changed_confirmed`, `.operator_identity_restricted`,
`.operator_employment_arka`, plus campaign-wide
`evidence_chain_complete = true`, `operator_identity_known_to_system = true`.

**This entire draft was superseded** by a dedicated locked spec (7 mandatory
+ 1 optional objectives) — see `docs/source-current.md`, which is what
`src/content/q15.ts` actually implements.

### Q16 — THE DECISION

```text
ID: dead_signal_q16 · Chapter 04 · Jakarta
Primary: Unknown · Supporting: Maya + Daniel + Victor (introduced) + Marcus
25–35 min · Hard · Depends on: dead_signal_q15.completed = true · Last quest.
```

Premise: the finale. Traces `ARKA-OPS-0441` (the Unknown operator's canonical
identity) through a documented internal concern (`OPS-CONCERN-1847`, closed
with no action) and a pattern of escalating unauthorized interventions,
confronts Unknown directly (motivation: believed the CRI policy was harmful
after the official concern was dismissed; explicitly did NOT target Rizky,
create the relationship, or edit any score — found it already broken and
tried to force review), receives Victor's temporary governance
authorization, then the player makes the final call.

Objectives (9 mandatory, no optional — every thread converges):

```text
1. traceArkaOps0441
2. compareInterventionSessions
3. findInternalConcern           — OPS-CONCERN-1847, closed with no action
4. establishFirstIntervention    — a temporary "additional review required"
                                    exception, later reverted, no data modification
5. reconstructInterventionPattern — review → source handling → resolver
                                    inspection → config validation → broader
                                    intervention → operational inconsistency
6. confrontUnknown                — identity = ARKA-OPS-0441 / OVERRIDE_OPERATOR;
                                    confirms delegated access, unauthorized use
7. evaluateFinalEvidence          — the final evidence package (OPS-REVIEW-0441)
8. obtainGovernanceAuthorization  — Victor's temporary emergency authorization
                                    (suspend CRI, freeze automated outputs,
                                    require human review, preserve evidence —
                                    explicitly NOT ownership)
9. makeFinalDecision              — DESTROY / EXPOSE / OVERRIDE
```

Reward: **$1,000 flat**, **150 XP max, identical for all three endings**
(trace ARKA-OPS-0441 15, compare sessions 15, find internal concern 15,
reconstruct first intervention 15, reconstruct pattern 20, reveal identity
15, understand motivation 15, Rizky/CRI distinction 10, SUBJECT-88172
uncertainty 10, evaluate evidence 10, make decision 10). No ending is
weighted as more "correct" — `SUBJECT-88172`'s own identity/danger is
deliberately left unresolved even at campaign end.

Endings (mutually exclusive, same reward):

```text
DESTROY  — suspend/freeze/disconnect/disable CRI classification entirely.
EXPOSE   — assemble a sanitized evidence package and hand it to Maya.
OVERRIDE — apply Victor's governance authorization permanently (freeze
           automation, require human review, require provenance, dual-approval
           config changes, governance control on restricted data, full audit
           on overrides) without claiming ownership.
```

State: as above plus the ending flag (`dead_signal.ending = "DESTROY" |
"EXPOSE" | "OVERRIDE"`). No `Next` — this is the last quest.

### Title drift (pre-Phase-8 outline, corrected by Phase 8 above)

The source's own early campaign outline used different titles for three
quests before the Phase 8 pass (reproduced above) corrected them:

| Quest | Early outline title | Corrected by Phase 8 |
|---|---|---|
| Q14 | THE CORE | THE OWNER |
| Q15 | THE ORIGINAL DESIGN | THE EVIDENCE |
| Q16 | THE OVERRIDE (stale — that's Chapter 4's title, not Q16's) | THE DECISION |

### Flagged ambiguities (carried from the source recovery itself)

1. Chapter 2–4 titles unadapted — only Chapter 1 (`DEAD SIGNAL` →
   `GHOST SERVER`) has a confirmed rename.
2. Objective slugs above (`camelCase`) are an implementation proposal
   matching Q01–Q03's convention, not sourced identifiers — the source gives
   numbered prose objectives only.
3. No mail/dialogue text was extracted for Q04–Q13/Q16 — objective/state/
   reward level only, same gap noted when this was first recovered.
4. Target hosts/IPs for Q05+ are not established in the source (Q04 reuses
   Q02/Q03's `edge-03`; Q05 introduces `staging.nusantarapay.id` with no IP
   given).
