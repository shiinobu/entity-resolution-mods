# ENTITY RESOLUTION — Q04–Q16 Design Recovered (Objective/Reward Level)

Date: 2026-09-16
Status: **SOURCE RECOVERED — OBJECTIVE/REWARD/DEPENDENCY LEVEL ONLY, NOT YET IMPLEMENTED**

**SUPERSEDED FOR Q14/Q15**: dedicated LOCKED v1.0 spec files
(`DEAD_SIGNAL_Q14_THE_OWNER_LOCKED_v1.0.docx` /
`DEAD_SIGNAL_Q15_THE_EVIDENCE_LOCKED_v1.0.docx`) were found and used
instead — see `docs/phase13-q04-q16-skeleton-scaffold.md` for the full
reconciliation. The Q14/Q15 sections below are the Phase 8 draft this
skeleton was ORIGINALLY built from; `src/content/q14.ts`/`q15.ts` no
longer match them (7 and 8 real objectives instead of 5 and 6). Kept here
for historical reference only — do not use these two sections as source
for Q14/Q15 going forward.

## Source

Extracted from `ChatGPT-Mengenal Website HackHub-20260913-2050.md`'s **"PHASE 8 — COMPLETE TECHNICAL QUEST SPEC"** section (first pass ~line 46696) plus its **"PHASE 8 — XP ALLOCATION REVISION"** (the final `v1.1` LOCK, ~line 49938) — per `docs/phase13-sequential-campaign-lock.md`, Phase 8 is explicitly the source of truth for Q01–Q16 objectives/dependencies/rewards/state, superseding all earlier narrative drafts for the same quest. Q01–Q03's own recovered docs already used this same Phase 8 pass; this file extends that to Q04–Q16.

**Scope note:** this is deliberately objective/reward/dependency-level only (matching what a skeleton file needs), not a full narrative recovery (mail bodies, dialogue scripts, character voice) — that remains a per-quest task when each quest becomes the active implementation target, same as Q01–Q03 each got their own full `phase13-qNN-source-recovered.md`.

## Naming adaptation carried over from Q01–Q03

```text
dead_signal_qNN               → entity_resolution.qNN
Chapter 01 — DEAD SIGNAL      → Chapter 01 — GHOST SERVER (already implemented)
dead_signal.* flags           → entity_resolution.* flags
```

**Open item, not yet decided:** Chapters 2–4's source titles (`THE LIST`, `FALSE POSITIVE`, `THE OVERRIDE`) have not been through a naming-adaptation pass the way Chapter 1 was (`DEAD SIGNAL` → `GHOST SERVER`). Decide this when Q05, Q09, and Q14 respectively become the active implementation target — do not silently invent a rename here.

**Title correction:** the early campaign outline (top of the source doc) lists stale titles for three quests, superseded by the later Phase 8 pass used below — always use the Phase 8 title:

| Quest | Stale outline title | Final Phase 8 title (use this) |
|---|---|---|
| Q14 | THE CORE | **THE OWNER** |
| Q15 | THE ORIGINAL DESIGN | **THE EVIDENCE** |
| Q16 | THE OVERRIDE | **THE DECISION** (`THE OVERRIDE` is Chapter 4's title, not Q16's) |

## Chapter grouping (source-confirmed)

```text
Chapter 1 — GHOST SERVER      Q01–Q04   (locked; Q01-Q03 PASS, Q04 not yet implemented)
Chapter 2 — THE LIST          Q05–Q08
Chapter 3 — FALSE POSITIVE    Q09–Q13
Chapter 4 — THE OVERRIDE      Q14–Q16
```

## Dependency chain (source-confirmed)

Strictly linear, no branching except Q16's three endings:

```text
Q01 → Q02 → Q03 → Q04 → Q05 → Q06 → Q07 → Q08
   → Q09 → Q10 → Q11 → Q12 → Q13 → Q14 → Q15 → Q16 → {DESTROY | EXPOSE | OVERRIDE}
```

Every `Qn` depends on `Q(n-1).completed = true` — matches `QuestsToComplete` convention already used in Q02/Q03. No source-stated exception found for any quest in this range.

---

## Q04 — LEAVE IT ALONE

`entity_resolution.q04` · Chapter 1 · Jakarta · Primary: Adrian · 12–18 min · Medium

**Premise:** Client confirms `edge-03`'s decommission, asks Adrian to close the audit — but the server is still live until the stated decommission time, and Adrian's "leave it alone" is his first moment of visibly knowing more than he says.

**Objectives (4 mandatory + 1 optional):**
1. `reviewDecommissionNotice` — review the decommission notice (still before the stated cutoff time)
2. `verifyServerStatus` — verify the server is still active (ping/nmap — same ports as Q02: 22/443/8443)
3. `closeAudit` — close the audit (player picks close-as-requested vs. add-a-note; both valid)
4. `decideOnEvidence` — decide what to do with remaining evidence (three end-of-quest choices: leave it alone / keep a copy / take one last look — the third opens the optional objective below)
5. *(optional)* `checkLastConnection` — investigate the last recorded connection: `10.42.7.18` (same IP as Q02's `cri-gateway.internal` DNS lookup) appears in `gateway.log` with a successful session, but has **no corresponding entry** in `auth.log` — a log/auth mismatch, reinforcing Q03's "logs are incomplete" theme

**Reward:** $350 money · **100 XP max** (verify decommission status 20, investigate active server 20, analyze last connection 20, identify auth/log mismatch 20, preserve/recognize anomalous evidence 20 — no XP for which of the 3 choices the player picks)

**State flags:** `q04.completed`, `q04.last_connection_checked`, `q04.cri_ip_confirmed`, `q04.log_mismatch_found`, plus campaign-wide `adrian_warned_player = true`, `unknown_contacted_player = true` (sets up an anonymous "You shouldn't have looked... — U" mail as the Chapter 1 ending hook), `cri_known = false` (still unresolved going into Chapter 2).

**Dependency:** `entity_resolution.q03.completed = true`. **Next:** Q05.

---

## Q05 — SECOND CLIENT

`entity_resolution.q05` · Chapter 2 — THE LIST · Jakarta · Primary: Adrian, Supporting: Maya Hart (introduced this quest) · ~15 min · Medium

**Premise:** A new client engagement (Nusantara Pay) surfaces a restricted internal "classification" API surface that echoes Q02–Q04's ARKA/CRI breadcrumbs, and introduces Maya, who reaches out about unrelated financial-review irregularities.

**Objectives (4 mandatory + 1 optional):**
1. `reviewScope` — review assessment scope
2. `inspectApiSurface` — inspect the external API surface (`staging.nusantarapay.id`)
3. `identifyClassificationEndpoints` — identify classification-related endpoints (`/api/internal/classification` and siblings) — explicitly do **not** bypass auth
4. `inspectStagingEnvironment` — inspect the staging "Operations Classification Console"
5. *(optional)* `enumerateApi` — enumerate the API for the full set of restricted classification endpoints

**Reward:** $400 money · **100 XP max** (audit 20, ARKA pattern 15, classification API 20, internal endpoint discovery 15, Maya's public-report correlation 10, API enumeration 10, "recognize pattern without claiming proof" 10)

**State flags:** `q05.completed`, `q05.arka_infrastructure_found`, `q05.classification_api_found`, `q05.api_enumerated`, `q05.maya_contacted`, `q05.maya_replied`, `adrian_knows_pattern = true`.

**Dependency:** `entity_resolution.q04.completed = true`. **Next:** Q06.

---

## Q06 — THE DATABASE

`entity_resolution.q06` · Chapter 2 · Jakarta · Primary: Adrian, Supporting: Maya · 12–18 min · Medium

**Premise:** A diagnostic archive (`classification_snapshot.db`) is discovered — this is the quest that first names **CRI** ("Civic Risk Index") explicitly and introduces Rizky Pratama as a HIGH-risk (score 74, confidence 0.58, PENDING/AUTOMATED review) record the story will follow through Chapter 3.

**Objectives (4 mandatory + 1 optional, two named sub-checks):**
1. `inspectDatabase` — inspect the database (schema: subjects/classifications/events/organizations/system_metadata/model_versions/data_sources)
2. `identifySystemMetadata` — identify system metadata (this is where "Civic Risk Index / CRI" is confirmed)
3. `inspectDataSources` — inspect data sources
4. `investigateRizky` — find Rizky's record and inspect his classification (HIGH/74/0.58/PENDING/AUTOMATED, reason: "association threshold exceeded")
5. *(optional)* `checkModel` — check the CRI-Core model version (`v3.7`, updated 2026-07-14)
6. *(optional)* `traceRecord` — trace Rizky's score history (LOW → MEDIUM → HIGH)

**Reward:** $450 money · **120 XP max** (locate archive 20, inspect schema 20, CRI definition 15, data sources 15, investigate Rizky 20, confidence/history analysis 10, model metadata 10, trace history 10). Note: XP is for *finding* Rizky's HIGH/74/0.58 facts, explicitly **not** for concluding CRI was manipulated — that conclusion isn't earned until much later.

**State flags:** `q06.completed`, `q06.cri_database_found`, `q06.cri_definition_found`, `q06.model_metadata_found`, `q06.data_sources_found`, `q06.rizky_found`, `q06.rizky_high_risk`, `q06.rizky_low_confidence`, `q06.rizky_history_found`, `q06.rizky_score_jump_found`, `q06.maya_contact_established`, `q06.maya_trust_increased`, and campaign-wide **`cri_known = true`** (first quest where CRI stops being a mystery term).

**Dependency:** `entity_resolution.q05.completed = true`. **Next:** Q07.

---

## Q07 — CONNECTIONS

`entity_resolution.q07` · Chapter 2 · Jakarta → Bandung · Primary: Daniel (introduced this quest), Supporting: Maya + Adrian · 15–20 min · Medium

**Premise:** Establishes the relationship/association-weighting mechanism CRI uses to compute risk, comparing Rizky against two other subjects (Dimas/Naufal) to make the `association_weight → risk` mechanism concrete. First quest to introduce Daniel.

**Objectives (3 mandatory + 1 optional):**
1. `inspectRelationshipData` — inspect relationship data
2. `identifyAssociationWeighting` — identify the `association_weight` mechanism and how it contributes to risk
3. `compareSubjects` — compare Rizky/Dimas/Naufal and trace the relationship network
4. *(optional)* `mapNetwork` — map the network to find `SUBJECT-88172` (restricted access — this becomes Q08's central thread)

**Reward:** $500 money · **120 XP max** (relationship model 20, association_weight ID 15, risk contribution 15, network analysis 20, understand mechanism 20, map graph 15, restricted subject 5, correct interpretation 10)

**State flags:** `q07.completed`, `q07.relationship_system_found`, `q07.association_weight_found`, `q07.risk_contribution_found`, `q07.network_mapped`, `q07.restricted_subject_found`, `daniel_introduced = true`, `daniel_pipeline_confirmed = true`, `daniel_trust = 1`, `adrian_knows_network_analysis = true`, `adrian_complicity_increased = true`, `maya_player_record_found = true`, `cri_uses_relationships = true`.

**Dependency:** `entity_resolution.q06.completed = true`. **Next:** Q08.

---

## Q08 — YOUR NAME

`entity_resolution.q08` · Chapter 2 · Jakarta · Primary: Maya, Supporting: Adrian + Daniel · 15–20 min · Medium

**Premise:** The personal turn — the player finds **their own** CRI record (LOW/18/0.94/MANUAL review, reason `ENTITY_ASSOCIATION`, score history 12→15→18) and discovers they're linked to the same `SUBJECT-88172` as Rizky via probabilistic entity matching (confidence 0.67). Closes Chapter 2.

**Objectives (3 mandatory + 1 optional):**
1. `locatePlayerRecord` — locate the player's own CRI record
2. `inspectPlayerClassification` — inspect the classification (LOW/18/0.94/MANUAL/`ENTITY_ASSOCIATION`)
3. `inspectPlayerRelationship` — inspect the relationship: player → `SUBJECT-88172` (same subject Rizky links to)
4. *(optional)* `identifyRestrictedSubject` — identify the entity-match detail (`match_method = PROBABILISTIC`, `match_confidence = 0.67`, i.e. low-confidence match)

**Reward:** $550 money · **120 XP max** (find record 20, classification analysis 15, manual review ID 15, trace relationship 15, identify SUBJECT-88172 10, entity resolution investigation 15, low match confidence 10, correlate player/Rizky 10, recognize entity-resolution concern 10). No XP tied to any emotional/roleplay choice.

**State flags:** `q08.completed`, `q08.player_record_found`, `q08.player_record_active`, `q08.player_risk_level = LOW`, `q08.player_manual_review`, `q08.player_review_reason = ENTITY_ASSOCIATION`, `q08.restricted_subject_linked`, `q08.entity_match_checked`, `q08.low_match_confidence_found`, `q08.player_linked_to_subject`, `q08.rizky_linked_to_subject`, `daniel_entity_resolution_concern = true`, `maya_player_record_found = true`, `player_in_cri = true`.

**Dependency:** `entity_resolution.q07.completed = true`. **Next:** Q09 (Chapter 3 — FALSE POSITIVE begins).

---

## Q09 — RIZKY PRATAMA

`entity_resolution.q09` · Chapter 3 — FALSE POSITIVE · Jakarta · Primary: Maya, Supporting: Daniel · 15–20 min · Medium

**Premise:** The player interviews Rizky directly. His CRI classification cites communication record `COM-07-88421` as evidence, but that record **cannot be found** in available phone records — a source conflict, not proof of innocence. Establishes the quest's central epistemic rule.

**Objectives (4 mandatory + 1 optional):**
1. `reviewRizkyCase` — review Rizky's case
2. `interviewRizky` — interview Rizky
3. `inspectCriClassification` — inspect his CRI classification
4. `verifyCom07` — verify `COM-07-88421` against available phone records (comparison step — record is missing)
5. *(optional)* `checkSource` — check source metadata (payload unavailable — a source conflict, not a resolution)

**Critical rule (carries into implementation):** the report/conclusion text must never state "no communication occurred" — only "the source cannot currently be supported by available records." (Same "don't overclaim" pattern as Q03's `Important Interpretation` rule.)

**Reward:** $600 money · **125 XP max** (interview/review 20, classification review 15, relationship evidence 20, compare source records 20, identify missing record 15, check metadata 10, manual clearance 5, **correctly conclude evidence is insufficient 20** — the largest single line item, deliberately weighted toward the epistemic lesson over fact-finding)

**State flags:** `q09.completed`, `q09.rizky_interviewed`, `q09.rizky_case_reviewed`, `q09.source_conflict_found`, `q09.source_checked`, `q09.manual_clearance_found`, `rizky_false_connection_suspected = true`, `cri_data_integrity_questioned = true`.

**Dependency:** `entity_resolution.q08.completed = true`. **Next:** Q10.

---

## Q10 — THE FALSE CONNECTION

`entity_resolution.q10` · Chapter 3 · Jakarta → Bandung · Primary: Daniel, Supporting: Maya · 15–20 min · Medium→Hard

**Premise:** The player traces the full entity-resolution pipeline (raw source → entity resolution → candidate → accept → relationship → CRI) and finds the critical fact: the original raw source for `COM-07-88421` never actually contained `SUBJECT-88172` — that relationship was *generated* by the entity-resolution step itself, at only 0.67 confidence.

**Objectives (4 mandatory + 1 optional):**
1. `locatePipelineArchive` — locate the pipeline archive
2. `inspectRawSource` — inspect the raw `COM-07-88421` source
3. `traceEntityResolution` — inspect/trace the entity-resolution step (`PERSON-19382` → `SUBJECT-88172`, confidence 0.67, ACCEPT)
4. `identifyProvenanceGap` — reconstruct relationship creation and identify the provenance gap (original source doesn't contain `SUBJECT-88172` at all)
5. *(optional)* `checkResolutionLog` — check the resolution log for the accept decision

**Reward:** $650 money · **130 XP max** (locate archive 15, inspect raw source 20, trace resolution 20, identify candidate 15, identify 0.67 confidence 10, trace generated relationship 15, identify incomplete provenance 15, check log 10, correctly reconstruct 10)

**State flags:** `q10.completed`, `q10.pipeline_archive_found`, `q10.entity_resolution_found`, `q10.relationship_generated_by_resolution`, `q10.entity_match_confidence = 0.67`, `q10.source_provenance_incomplete`, `q10.resolution_log_checked`, `q10.resolution_decision_found`, `daniel_pipeline_understood = true`, `daniel_accountability_increased = true`.

**Dependency:** `entity_resolution.q09.completed = true`. **Next:** Q11.

---

## Q11 — DANIEL

`entity_resolution.q11` · Chapter 3 · Bandung · Primary: Daniel, Supporting: Maya · 15–20 min · Medium

**Premise:** Compares the historical (human-review-required) vs. current (automatic-acceptance-with-conditional-exception) resolver pipeline, and identifies Daniel's own 2026-01-18 engineering change to `resolver-service` ("support normalized relationship events for downstream processing") as a contributing — not culpable — technical cause.

**Objectives (4 mandatory + 1 optional):**
1. `inspectHistoricalArchitecture` — inspect historical architecture
2. `compareResolvers` — compare old vs. current resolver (review was not removed — it became conditional)
3. `identifyReviewException` — identify the human-review exception behavior
4. `inspectDanielsChange` — inspect Daniel's engineering change (component `resolver-service`, dated 2026-01-18)
5. *(optional)* `checkTheChange` — check the change details further, then question Daniel directly

**Reward:** $650 money · **130 XP max** (locate archive 15, reconstruct legacy pipeline 20, reconstruct current pipeline 20, conditional review 15, automatic acceptance 15, review exception 10, Daniel's component/change 10, check change 5, correctly identify reduced review coverage 10). Explicitly no XP for accusing Daniel of being the manipulator — reward is for the more precise conclusion "Daniel contributed to the technical change, but that does not make him the operator."

**State flags:** `q11.completed`, `q11.historical_pipeline_found`, `q11.old_review_flow_found`, `q11.current_review_flow_found`, `q11.automated_acceptance_found`, `q11.human_review_exception_found`, `q11.daniel_component_confirmed`, `q11.daniel_change_found`, `q11.review_coverage_reduced`, `daniel_complicity_confirmed = true`, `daniel_accountability_increased = true`.

**Dependency:** `entity_resolution.q10.completed = true`. **Next:** Q12.

---

## Q12 — THE PIPELINE

`entity_resolution.q12` · Chapter 3 · Bandung → Jakarta · Primary: Daniel, Supporting: Maya · 15–20 min · Hard

**Premise:** Maya hands the player policy ID `POL-1847`. Comparing legacy (`relationship_review_mode = REQUIRED`) against current (`CONDITIONAL` + `approved_source_bypass = ENABLED`) configuration explains exactly why `COM-07`-class sources skip review — a *policy* decision, deployed 2026-07-14, with its approval identity redacted.

**Objectives (4 mandatory + 1 optional):**
1. `inspectPolicyHistory` — inspect policy history (`POL-1847`)
2. `compareConfigurations` — compare legacy vs. current configuration
3. `identifyReviewBehaviorChange` — identify the changed review behavior (REQUIRED → CONDITIONAL, bypass enabled)
4. `determineCom07Behavior` — determine how `COM-07` sources are processed under the new policy (`review_requirement = NOT_REQUIRED`)
5. *(optional)* `checkChangeHistory` — check the policy's change history for the approval trail (identity redacted)

**Reward:** $650 base + $50 optional = **$700 max** · **140 XP max** (base 120: locate archive 15, compare policy 25, conditional review 20, approved-source bypass 20, trace COM-07 15, identify POL-1847 10, deployment date 5, correct interpretation 10 · optional 20: check change history)

**State flags:** `q12.completed`, `q12.policy_found`, `q12.legacy_policy_found`, `q12.current_policy_found`, `q12.conditional_review_found`, `q12.approved_source_bypass_found`, `q12.com07_review_not_required`, `q12.policy_change_found`, `q12.policy_history_found`, `q12.policy_deployment_date_found`, `q12.approval_identity_redacted`, `cri_policy_change_confirmed = true`, `cri_automation_expanded = true`.

**Dependency:** `entity_resolution.q11.completed = true`. **Next:** Q13.

---

## Q13 — THE OPERATOR

`entity_resolution.q13` · Chapter 3 · Jakarta · Primary: Maya, Supporting: Daniel + Adrian · 18–25 min · Hard

**Premise:** The player locates the privileged `OVERRIDE_OPERATOR` account (active since 2026-06-18) and its activity log — including the 2026-08-18 `CONFIGURATION_OVERRIDE` session `A-77402` originating from `10.42.7.31` (ARKA's administrative network) — establishing that a real privileged operator account performed the policy change, without yet identifying who controls it. Closes with the explicit rule that this does **not** prove an ARKA institutional conspiracy.

**Objectives (4 mandatory + 1 optional):**
1. `searchOperationalAudit` — search the operational audit trail
2. `identifyPrivilegedIdentity` — identify the privileged `OVERRIDE_OPERATOR` identity
3. `traceActivity` — trace its operational activity (POL-1847 deploy, policy reloads, the 08-18 CONFIGURATION_OVERRIDE)
4. `correlateOriginNetwork` — correlate the session origin (`10.42.7.31` → ARKA Administrative Network)
5. *(optional)* `investigateFirstUse` — investigate first use / account origin

**Reward:** $700 base + $100 optional = **$800 max** · **150 XP max** (base 135: locate account 20, inspect metadata 15, trace activity 20, link to policy 20, analyze session A-77402 20, correlate origin 15, confirm privileged identity 15, correctly maintain unknown-operator status 10 · optional 15: investigate first use). No XP for concluding Marcus is the operator — that's explicitly a wrong conclusion at this stage.

**State flags:** `q13.completed`, `q13.override_account_found`, `q13.override_account_active`, `q13.policy_deployment_linked`, `q13.configuration_activity_found`, `q13.com07_policy_activity_found`, `q13.arka_network_origin_confirmed`, `q13.first_use_found`, `q13.override_account_origin_found`, `q13.override_audit_found`, `q13.operator_account_confirmed`, `q13.operator_identity_unknown = true`.

**Dependency:** `entity_resolution.q12.completed = true`. **Next:** Q14 (Chapter 4 — THE OVERRIDE begins).

---

## Q14 — THE OWNER

`entity_resolution.q14` · Chapter 4 — THE OVERRIDE · Jakarta · Primary: Maya, Supporting: Daniel + Adrian + Marcus (introduced this quest) · 18–25 min · Hard

**Premise:** Traces the `OVERRIDE_OPERATOR` account's delegated-access model to an approved access request (`AR-44192`, window 2026-08-18 01:45–03:00, linked to session `A-77402`) approved by `M.REED` — resolved to Marcus Reed, ARKA's Executive Director of Security Administration. Critical distinction carried into implementation: Marcus = authorized approver ≠ confirmed operator.

**Objectives (4 mandatory + 1 optional):**
1. `inspectAccessRegistry` — inspect the access registry
2. `traceDelegatedAccess` — trace the delegated-access model (owner: Operations, approval required, authorized group: OPERATIONS-SECURITY)
3. `findAuthorizationRequest` — find `AR-44192` and link it to session `A-77402`
4. `identifyApprover` — identify approver `M.REED` → Marcus Reed
5. *(optional)* `checkExceptionAccess` — check exception-access details, then interview Marcus

**Reward:** $700 base + $100 optional = **$800 max** · **140 XP max** (base 130: locate registry 15, delegated access model 15, authorization window 15, link AR-44192 20, link A-77402 20, identify M.REED 15, correlate to Marcus Reed 15, correctly distinguish approver from operator 15 · optional 10: check exception access). Deliberately rewards *not* overclaiming Marcus's involvement.

**State flags:** `q14.completed`, `q14.override_access_registry_found`, `q14.delegated_access_confirmed`, `q14.access_window_found`, `q14.override_session_found`, `q14.marcus_access_approval_confirmed`, `q14.marcus_reed_confirmed`, `q14.operator_identity_unknown = true`, `q14.exception_access_found`, `q14.primary_audit_system_required`, `marcus_introduced = true`, `marcus_authority_confirmed = true`.

**Dependency:** `entity_resolution.q13.completed = true`. **Next:** Q15.

---

## Q15 — THE EVIDENCE

`entity_resolution.q15` · Chapter 4 · Jakarta · Primary: Maya, Supporting: Daniel + Marcus · 20–30 min · Hard

**Premise:** The technical climax. The player accesses the encrypted forensic export (`operations_audit_2026-08-18.enc`), reconstructs the full `A-77402` action timeline minute-by-minute (login → open policy → CONFIGURATION_OVERRIDE → save/validate/reload → open COM-07 → logout), and formally correlates operator identity through to `ARKA-OPS-0441`. Proves the *conditions* changed (policy config), explicitly not that anyone manually edited Rizky's risk score.

**Objectives (5 mandatory + 1 optional):**
1. `accessForensicExport` — access the forensic export
2. `reconstructSession` — reconstruct session `A-77402`'s full timeline
3. `compareBeforeAfterPolicy` — compare policy before (REQUIRED/bypass disabled) vs. after (CONDITIONAL/bypass enabled)
4. `reconstructRizkyChain` — reconstruct Rizky's full processing chain (COM-07-88421 → entity resolution 0.67 → SUBJECT-88172 → accepted → review not required → CRI risk 74)
5. `correlateOperatorIdentity` — correlate the operator identity hash through to `ARKA-OPS-0441`, then assemble the evidence package
6. *(optional)* `verifyBeforeAfterIndependently` — independently verify the before/after policy comparison

**Reward:** $700 base + $200 optional = **$900 max** · **150 XP max** (base 140: access export 15, locate A-77402 15, reconstruct session 20, reconstruct override 20, compare before/after 20, trace COM-07 path 15, correlate operator identity 15, reconstruct Rizky chain 10, correctly distinguish policy/input manipulation from score editing 10 · optional 10: verify independently)

**State flags:** `q15.completed`, `q15.primary_audit_accessed`, `q15.operator_session_found`, `q15.operator_identity_hash_found`, `q15.operator_identity_correlated`, `q15.policy_change_reconstructed`, `q15.relationship_policy_modified`, `q15.com07_policy_path_confirmed`, `q15.rizky_processing_chain_reconstructed`, `q15.before_after_policy_verified`, `q15.review_behavior_changed_confirmed`, `q15.operator_identity_restricted`, `q15.operator_employment_arka`, `evidence_chain_complete = true`, `operator_identity_known_to_system = true`.

**Dependency:** `entity_resolution.q14.completed = true`. **Next:** Q16.

---

## Q16 — THE DECISION

`entity_resolution.q16` · Chapter 4 · Jakarta · Primary: Unknown, Supporting: Maya + Daniel + Victor (introduced this quest) + Marcus · 25–35 min · Hard

**Premise:** The finale. Traces `ARKA-OPS-0441` (the Unknown operator's canonical identity) through a documented internal concern (`OPS-CONCERN-1847`, closed with no action) and a pattern of escalating unauthorized interventions, confronts Unknown directly (motivation: believed the CRI policy was harmful after the official concern was dismissed; explicitly did NOT target Rizky, create the relationship, or edit any score — found it already broken and tried to force review), receives Victor's temporary governance authorization, then the player makes the final call.

**Objectives (9 mandatory, no optional — this is the finale, every thread converges):**
1. `traceArkaOps0441` — trace `ARKA-OPS-0441`
2. `compareInterventionSessions` — compare historical intervention sessions
3. `findInternalConcern` — find the official internal concern (`OPS-CONCERN-1847`, closed with no action)
4. `establishFirstIntervention` — establish the first unauthorized intervention (a temporary "additional review required" exception, later reverted by Operations — no score/source/subject modification)
5. `reconstructInterventionPattern` — reconstruct the full intervention pattern (review behavior → source handling → resolver inspection → config validation → broader intervention → operational inconsistency)
6. `confrontUnknown` — confront Unknown (reveals identity = `ARKA-OPS-0441` / technical identity `OVERRIDE_OPERATOR`; confirms delegated access, unauthorized use)
7. `evaluateFinalEvidence` — evaluate the final evidence package (`OPS-REVIEW-0441`)
8. `obtainGovernanceAuthorization` — obtain Victor's temporary emergency governance authorization (suspend CRI, freeze automated outputs, require human review, preserve evidence — explicitly NOT ownership)
9. `makeFinalDecision` — choose the ending: **DESTROY** / **EXPOSE** / **OVERRIDE**

**Reward:** **$1,000 flat** · **150 XP max, identical for all three endings** (trace ARKA-OPS-0441 15, compare sessions 15, find internal concern 15, reconstruct first intervention 15, reconstruct pattern 20, reveal identity 15, understand motivation 15, Rizky/CRI distinction 10, SUBJECT-88172 uncertainty 10, evaluate evidence 10, make decision 10). No ending is weighted as more "correct" — `SUBJECT-88172`'s own identity/danger is deliberately left unresolved even at campaign end.

**Endings (mutually exclusive, same reward):**
- **DESTROY** — suspend/freeze/disconnect/disable CRI classification entirely. `entity_resolution.ending = "DESTROY"`
- **EXPOSE** — assemble a sanitized evidence package (policy history, governance records, provenance, Rizky case, operator activity, authorization chain, internal concern, intervention) and hand it to Maya. `entity_resolution.ending = "EXPOSE"`
- **OVERRIDE** — apply Victor's governance authorization permanently-in-effect controls (freeze automation, require human review, require provenance, dual-approval config changes, governance control on restricted data, full audit on overrides) without claiming ownership. `entity_resolution.ending = "OVERRIDE"`

**State flags:** as above plus the ending flag. This is the last quest — no `Next`.

**Dependency:** `entity_resolution.q15.completed = true`.

---

## Summary table

| Quest | Title | Chapter | Objectives (mand./opt.) | Money max | XP max | Depends on |
|---|---|---|---:|---:|---:|---|
| Q04 | LEAVE IT ALONE | 1 | 4 / 1 | $350 | 100 | Q03 |
| Q05 | SECOND CLIENT | 2 | 4 / 1 | $400 | 100 | Q04 |
| Q06 | THE DATABASE | 2 | 4 / 2 | $450 | 120 | Q05 |
| Q07 | CONNECTIONS | 2 | 3 / 1 | $500 | 120 | Q06 |
| Q08 | YOUR NAME | 2 | 3 / 1 | $550 | 120 | Q07 |
| Q09 | RIZKY PRATAMA | 3 | 4 / 1 | $600 | 125 | Q08 |
| Q10 | THE FALSE CONNECTION | 3 | 4 / 1 | $650 | 130 | Q09 |
| Q11 | DANIEL | 3 | 4 / 1 | $650 | 130 | Q10 |
| Q12 | THE PIPELINE | 3 | 4 / 1 | $700 | 140 | Q11 |
| Q13 | THE OPERATOR | 3 | 4 / 1 | $800 | 150 | Q12 |
| Q14 | THE OWNER | 4 | 4 / 1 | $800 | 140 | Q13 |
| Q15 | THE EVIDENCE | 4 | 5 / 1 | $900 | 150 | Q14 |
| Q16 | THE DECISION | 4 | 9 / 0 | $1,000 | 150 | Q15 |

Campaign total (Q01–Q16): **1,905 XP** max (explicitly a sum, not itself a cap — "150 XP is a max per mission, not per campaign," per source).

## Flagged ambiguities / open items

1. **Chapter 2–4 titles unadapted.** Only Chapter 1 (`DEAD SIGNAL` → `GHOST SERVER`) has a confirmed rename. Decide Chapters 2/3/4's canonical titles when their first quest (Q05/Q09/Q14) becomes the active implementation target.
2. **Objective internal names/slugs are invented**, not sourced — the design doc gives numbered prose objectives ("1. Review the decommission notice"), not code-ready identifiers. The slugs above follow the existing Q01–Q03 camelCase convention but are a proposal, not canon; adjust freely per-quest during real implementation.
3. **No mail/dialogue text extracted.** Every quest above is objective/state/reward level only — opening mail, report bodies, and any phone-call/dialogue branching (relevant given Q03's `onEnd`/`onSelect` findings) still need their own full narrative recovery pass per quest, same as `phase13-qNN-source-recovered.md` did for Q01–Q03.
4. **Q16 has no optional objectives** in the source (all 9 are mandatory) — confirmed intentional, not an extraction gap; it's the campaign finale and every thread converges.
5. **Target hosts/IPs for Q05+ are not established** in this pass (Q04 reuses Q02/Q03's `edge-03`; Q05 introduces `staging.nusantarapay.id` but no IP is given in the source excerpt read). Network fixtures will need deciding at implementation time, same as Q03's router/device restructuring was discovered live rather than fully speced up front.
