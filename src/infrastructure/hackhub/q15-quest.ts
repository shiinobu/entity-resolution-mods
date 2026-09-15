import {
    Quest as HackHubQuest,
    RegisterQuest,
    type QuestDialogDefinition,
} from "@hotbunny/hackhub-content-sdk";

import { Q15_OBJECTIVES } from "../../content/index.js";

// REBUILT verbatim from `DEAD_SIGNAL_Q15_THE_EVIDENCE_LOCKED_v1.0.docx`
// (the authoritative locked source — see content/q15.ts's header comment).
// The "Opening" scene is Relay content (see Q15_RELAY_OPENING_CONTENT in
// content/q15.ts), NOT Dialog — the previous version of this file
// incorrectly duplicated it here; removed. This Dialog is only "13. Maya's
// Evidence Assessment" + "15. Ending" (sections that are genuinely
// phone-call-style spoken exchange in the source). switchBranch/isEnd
// only — never onEnd/onSelect, see q03-quest.ts's Dialog field comment
// (permanently non-functional in this HackHub build,
// docs/hackhub-dialog-onend-bug-report.md).
const Q15_DIALOG: QuestDialogDefinition = {
    main: [
        { speaker: "Maya", text: "We can reconstruct the sequence.", audio: "", timeout: 3000 },
        { speaker: "player", text: "And?", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "The score wasn't edited.", audio: "", timeout: 3000 },
        { speaker: "player", text: "No.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "The conditions were.", audio: "", timeout: 3000 },
        { speaker: "player", text: "That's enough?", audio: "", timeout: 3000 },
        {
            speaker: "Maya",
            text: "Enough to prove something changed. Not enough to prove why.",
            audio: "",
            timeout: 3000,
        },
        { speaker: "Daniel", text: "That's the chain.", audio: "", timeout: 3000 },
        { speaker: "player", text: "From source to classification.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "player", text: "And the override?", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Documented.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "Then we have enough.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Enough for what?", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "That's the question.", audio: "", isEnd: true },
    ],
};

interface Q15QuestData {
    readonly retrievePrimaryAuditExportDone: boolean;
    readonly reconstructSessionA77402Done: boolean;
    readonly traceUserReferenceDone: boolean;
    readonly reconstructSessionTimelineDone: boolean;
    readonly comparePolicyVersionsDone: boolean;
    readonly traceRizkyPipelineDone: boolean;
    readonly checkPreviousPolicyDone: boolean;
    readonly correlateOperatorIdentityDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ15Quest extends HackHubQuest<Q15QuestData> {
    override Name = "entity_resolution.q15";
    override Title = "THE EVIDENCE";
    override Description =
        "The technical climax — reconstructs the full A-77402 timeline and correlates the operator identity to ARKA-OPS-0441.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q14"];
    override Rewards = { money: 0, xp: 0 };
    override Dialog = Q15_DIALOG;
    override Objectives = Q15_OBJECTIVES;

    override CreateData(): Q15QuestData {
        return {
            retrievePrimaryAuditExportDone: false,
            reconstructSessionA77402Done: false,
            traceUserReferenceDone: false,
            reconstructSessionTimelineDone: false,
            comparePolicyVersionsDone: false,
            traceRizkyPipelineDone: false,
            checkPreviousPolicyDone: false,
            correlateOperatorIdentityDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see DEAD_SIGNAL_Q15_THE_EVIDENCE_LOCKED_v1.0.docx
        // (authoritative) via content/q15.ts's header comment.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q15.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q15_REWARDS:
        //   gameRuntime.reward.claim(... retrievePrimaryAuditExport, 10)
        //   gameRuntime.reward.claim(... reconstructSessionA77402, 10)
        //   gameRuntime.reward.claim(... traceUserReference, 10)
        //   gameRuntime.reward.claim(... reconstructSessionTimeline, 15)
        //   gameRuntime.reward.claim(... comparePolicyVersions, 15)
        //   gameRuntime.reward.claim(... traceRizkyPipeline, 15)
        //   gameRuntime.reward.claim(... correlateOperatorIdentity, 15)
        //   gameRuntime.reward.claim(... checkPreviousPolicy, 25) — if checkPreviousPolicy done
        //   Bank.transaction(... Q15_REWARDS.money) — flat $700, no optional split (LOCKED-confirmed)
        //   gameRuntime.flagStore.set(Q15_FINAL_STATE_FLAG, true)
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
