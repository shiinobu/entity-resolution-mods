import {
    Quest as HackHubQuest,
    RegisterQuest,
    type QuestDialogDefinition,
} from "@hotbunny/hackhub-content-sdk";

import { Q16_OBJECTIVES } from "../../content/index.js";

// Direct quotes from the design doc's Q16 LOCKED FINAL v1.2 (the final-
// lock-candidate revision — supersedes the "v1.1" the original dialogue-
// extraction pass condensed from; source's own "FINAL AUDIT — Q16 THE
// DECISION v1.1" section graded it PASS with 3 minor corrections, all
// applied in v1.2: (1) OPS-CONCERN-1847's submitter clarified as
// ARKA-OPS-0441 itself, (2) EXPOSE's final message changed from
// "RELEASED" to "TRANSFERRED" — see the `expose` branch below, (3) OVERRIDE
// explicitly grounded in "Victor's temporary emergency governance
// authorization", not an unexplained player power — see the `override`
// branch). `main` now covers the full confrontation arc (Unknown Revealed
// -> Why Unknown Started -> Why They Used The Override -> What They
// Thought They Were Doing -> Rizky Question -> SUBJECT-88172 -> The
// Mirror -> Final Admission -> Maya's Assessment -> Victor's Position ->
// Marcus' Position -> The Final Question), i.e. source scenes 10-23 —
// richer than the original condensed pass. Scenes 2-9 (evidence-gathering
// beats tied to traceArkaOps0441/compareInterventionSessions/
// findInternalConcern/establishFirstIntervention/
// reconstructInterventionPattern) are Relay content, not Dialog — see
// Q16_RELAY_OPENING_CONTENT/Q16_RELAY_SECOND_CONTACT_CONTENT in
// content/q16.ts. Each ending branch's "Final message" IS the source's
// exact locked closing text. switchBranch/isEnd only — never
// onEnd/onSelect, see q03-quest.ts's Dialog field comment (permanently
// non-functional in this HackHub build,
// docs/bugs.md (entry 1)).
const Q16_DIALOG: QuestDialogDefinition = {
    main: [
        { speaker: "player", text: "ARKA-OPS-0441.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "That's the operational reference.", audio: "", timeout: 3000 },
        { speaker: "player", text: "You used OVERRIDE_OPERATOR.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "player", text: "The account wasn't yours.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "No.", audio: "", timeout: 3000 },
        { speaker: "player", text: "You used delegated access.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "player", text: "It was doing what the policy allowed.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "Exactly.", audio: "", timeout: 3000 },
        { speaker: "player", text: "And that was the problem.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "player", text: "So you used the account. Without authorization.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Why?", audio: "", timeout: 3000 },
        {
            speaker: "Unknown",
            text: "Because waiting for another review meant more cases would pass through the same way.",
            audio: "",
            timeout: 3000,
        },
        { speaker: "player", text: "You could have stopped.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "I could have. I didn't.", audio: "", timeout: 3000 },
        { speaker: "player", text: "At first I was trying to stop specific cases.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "Then I started trying to stop the behavior.", audio: "", timeout: 3000 },
        { speaker: "player", text: "And eventually?", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "Eventually I stopped asking whether I was allowed to.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Did you target Rizky? Did you change his score? Did you create the connection?", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "No. No. No.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Then what did you do?", audio: "", timeout: 3000 },
        {
            speaker: "Unknown",
            text: "I found it. The relationship was already there. By the time I saw it, the source evidence was already gone.",
            audio: "",
            timeout: 3000,
        },
        { speaker: "player", text: "What do you know about SUBJECT-88172?", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "Enough to know it existed outside CRI.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Is it dangerous?", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "I don't know.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Then why did you keep treating it as suspicious?", audio: "", timeout: 3000 },
        {
            speaker: "Unknown",
            text: "Because I saw the same relationship pattern repeating. That's not evidence. It wasn't.",
            audio: "",
            timeout: 3000,
        },
        { speaker: "player", text: "You said association wasn't enough. But you used it.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "Because I thought the system was wrong.", audio: "", timeout: 3000 },
        { speaker: "player", text: "And that made you right?", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "No.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Were you trying to fix CRI?", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "At first.", audio: "", timeout: 3000 },
        { speaker: "player", text: "And later?", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "I was trying to make it behave the way I thought it should.", audio: "", timeout: 3000 },
        { speaker: "player", text: "You became another person deciding what the system should do.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "I know. When I couldn't tell anymore which changes were mine.", audio: "", timeout: 3000 },
        {
            speaker: "Maya",
            text: "We can prove the policy changed. We can prove the operator intervened. We can prove the concern was raised and closed.",
            audio: "",
            timeout: 3000,
        },
        { speaker: "player", text: "Can we prove intent?", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "No.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Can we prove the system was safe?", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "No.", audio: "", timeout: 3000 },
        { speaker: "Victor", text: "You have enough to demonstrate a governance failure.", audio: "", timeout: 3000 },
        { speaker: "player", text: "And the restricted subject?", audio: "", timeout: 3000 },
        { speaker: "Victor", text: "Still restricted. Especially now.", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "I approved an access request. I did not authorize what happened afterward.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Should you have known?", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "Probably.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "You have the evidence. You know what they did. You know what I did.", audio: "", timeout: 3000 },
        { speaker: "player", text: "What do you want me to do?", audio: "", timeout: 3000 },
        {
            speaker: "Unknown",
            text: "That's not my decision. I made decisions for everyone else. That's why I'm not making this one.",
            audio: "",
            options: [
                { label: "DESTROY — Suspend CRI", text: "Suspend CRI.", switchBranch: "destroy", audio: "" },
                { label: "EXPOSE — Release the evidence", text: "Release the evidence.", switchBranch: "expose", audio: "" },
                { label: "OVERRIDE — Freeze and reform CRI", text: "Freeze and reform CRI.", switchBranch: "override", audio: "" },
            ],
        },
    ],
    // v1.2 correction: uses "the temporary emergency governance
    // authorization" (Victor's grant, obtainGovernanceAuthorization) —
    // not an unexplained player power.
    destroy: [
        {
            speaker: "system",
            text: "SYSTEM STATUS — CRI PROCESSING SUSPENDED — AUTOMATED CLASSIFICATION: OFFLINE",
            audio: "",
            switchBranch: "finalUnknownScene",
        },
    ],
    // v1.2 correction: final message changed from "RELEASED" to
    // "TRANSFERRED" (the player verifies and hands the package to Maya,
    // who becomes responsible for public disclosure — not the player
    // unilaterally releasing it).
    expose: [
        {
            speaker: "system",
            text: "EVIDENCE PACKAGE — TRANSFERRED — PUBLIC INVESTIGATION: INITIATED",
            audio: "",
            switchBranch: "finalUnknownScene",
        },
    ],
    // v1.2 correction: explicitly "uses Victor's temporary emergency
    // governance authorization" — not permanent ownership; the
    // authorization itself is recorded and subject to later review.
    override: [
        {
            speaker: "system",
            text: "CRI STATUS — CONTROLLED OPERATION — AUTOMATED CLASSIFICATION: RESTRICTED — HUMAN REVIEW: REQUIRED",
            audio: "",
            switchBranch: "finalUnknownScene",
        },
    ],
    // Shared across all three endings ("# 27. FINAL UNKNOWN SCENE" in the
    // source) — identical regardless of which ending the player chose.
    finalUnknownScene: [
        { speaker: "Unknown", text: "Did you decide?", audio: "", timeout: 3000 },
        { speaker: "player", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "Then live with it.", audio: "", timeout: 3000 },
        { speaker: "player", text: "What about you?", audio: "", timeout: 3000 },
        { speaker: "Unknown", text: "I already did.", audio: "", timeout: 3000 },
        {
            speaker: "Unknown",
            text: "I thought being right gave me the right to decide. It didn't.",
            audio: "",
            isEnd: true,
        },
    ],
};

interface Q16QuestData {
    readonly traceArkaOps0441Done: boolean;
    readonly compareInterventionSessionsDone: boolean;
    readonly findInternalConcernDone: boolean;
    readonly establishFirstInterventionDone: boolean;
    readonly reconstructInterventionPatternDone: boolean;
    readonly confrontUnknownDone: boolean;
    readonly evaluateFinalEvidenceDone: boolean;
    readonly obtainGovernanceAuthorizationDone: boolean;
    readonly makeFinalDecisionDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ16Quest extends HackHubQuest<Q16QuestData> {
    override Name = "entity_resolution.q16";
    override Title = "THE DECISION";
    override Description =
        "The finale — confronts Unknown (ARKA-OPS-0441), then the player chooses: DESTROY, EXPOSE, or OVERRIDE.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q15"];
    override Rewards = { money: 0, xp: 0 };
    override Dialog = Q16_DIALOG;
    override Objectives = Q16_OBJECTIVES;

    override CreateData(): Q16QuestData {
        return {
            traceArkaOps0441Done: false,
            compareInterventionSessionsDone: false,
            findInternalConcernDone: false,
            establishFirstInterventionDone: false,
            reconstructInterventionPatternDone: false,
            confrontUnknownDone: false,
            evaluateFinalEvidenceDone: false,
            obtainGovernanceAuthorizationDone: false,
            makeFinalDecisionDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see docs/source-current.md.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q16.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q16_REWARDS (identical for all 3 endings):
        //   gameRuntime.reward.claim(... traceArkaOps0441, 15)
        //   gameRuntime.reward.claim(... compareSessions, 15)
        //   gameRuntime.reward.claim(... findInternalConcern, 15)
        //   gameRuntime.reward.claim(... reconstructFirstIntervention, 15)
        //   gameRuntime.reward.claim(... reconstructPattern, 20)
        //   gameRuntime.reward.claim(... revealIdentity, 15)
        //   gameRuntime.reward.claim(... understandMotivation, 15)
        //   gameRuntime.reward.claim(... rizkyCriDistinction, 10)
        //   gameRuntime.reward.claim(... subject88172Uncertainty, 10)
        //   gameRuntime.reward.claim(... evaluateEvidence, 10)
        //   gameRuntime.reward.claim(... makeDecision, 10)
        //   Bank.transaction(... Q16_REWARDS.money)
        //   gameRuntime.flagStore.set(Q16_FINAL_STATE_FLAG, true)
        //   gameRuntime.flagStore.set(Q16_ENDING_FLAG, "DESTROY" | "EXPOSE" | "OVERRIDE")
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
