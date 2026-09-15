import {
    Quest as HackHubQuest,
    RegisterQuest,
    type QuestDialogDefinition,
} from "@hotbunny/hackhub-content-sdk";

import { Q09_OBJECTIVES } from "../../content/index.js";

// Direct quotes from the design doc's Q09 LOCKED v1.0 "Manual Clearance" /
// "Maya's Conclusion" / "Q09 Ending" scenes — assembled here as one
// sequential flow (the source doesn't specify exact SDK trigger points; real
// wiring is still TODO in OnObjectivesStart). switchBranch/isEnd only —
// never onEnd/onSelect, see q03-quest.ts's Dialog field comment (permanently
// non-functional in this HackHub build, docs/hackhub-dialog-onend-bug-report.md).
const Q09_DIALOG: QuestDialogDefinition = {
    main: [
        { speaker: "player", text: "Who cleared it?", audio: "", timeout: 3000 },
        { speaker: "Rizky", text: "I don't know.", audio: "", timeout: 3000 },
        { speaker: "Rizky", text: "They just told me the review was complete.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "Rizky isn't the only one.", audio: "", timeout: 3000 },
        { speaker: "player", text: "How many?", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "Enough.", audio: "", timeout: 3000 },
        { speaker: "Rizky", text: "I never even knew I was connected to anyone.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "That's the part that bothers me.", audio: "", timeout: 3000 },
        { speaker: "player", text: "The false match?", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "No.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "That someone had to notice it.", audio: "", isEnd: true },
    ],
};

interface Q09QuestData {
    readonly reviewRizkyCaseDone: boolean;
    readonly interviewRizkyDone: boolean;
    readonly inspectCriClassificationDone: boolean;
    readonly verifyCom07Done: boolean;
    readonly checkSourceDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ09Quest extends HackHubQuest<Q09QuestData> {
    override Name = "entity_resolution.q09";
    override Title = "RIZKY PRATAMA";
    override Description =
        "The player interviews Rizky directly — his cited evidence record cannot be found in available phone records.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q08"];
    override Rewards = { money: 0, xp: 0 };
    override Dialog = Q09_DIALOG;
    override Objectives = Q09_OBJECTIVES;

    override CreateData(): Q09QuestData {
        return {
            reviewRizkyCaseDone: false,
            interviewRizkyDone: false,
            inspectCriClassificationDone: false,
            verifyCom07Done: false,
            checkSourceDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see docs/phase13-q04-q16-design-recovered.md.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q09.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q09_REWARDS:
        //   gameRuntime.reward.claim(... interviewReview, 20)
        //   gameRuntime.reward.claim(... relationshipEvidence, 20)
        //   gameRuntime.reward.claim(... classificationReview, 15)
        //   gameRuntime.reward.claim(... manualClearance, 5)
        //   gameRuntime.reward.claim(... compareSourceRecords, 20)
        //   gameRuntime.reward.claim(... identifyMissingRecord, 15)
        //   gameRuntime.reward.claim(... correctlyConcludeEvidenceInsufficient, 20)
        //   gameRuntime.reward.claim(... checkMetadata, 10) — if checkSource done
        //   Bank.transaction(... Q09_REWARDS.money)
        //   gameRuntime.flagStore.set(Q09_FINAL_STATE_FLAG, true)
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
