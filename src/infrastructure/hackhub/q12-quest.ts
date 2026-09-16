import {
    Quest as HackHubQuest,
    RegisterQuest,
    type QuestDialogDefinition,
} from "@hotbunny/hackhub-content-sdk";

import { Q12_OBJECTIVES } from "../../content/index.js";

// Direct quotes from the design doc's Q12 LOCKED FINAL v1.0 opening trigger
// (Maya sends POL-1847) and "Final Dialogue" ending scene. switchBranch/
// isEnd only — never onEnd/onSelect, see q03-quest.ts's Dialog field comment
// (permanently non-functional in this HackHub build,
// docs/bugs.md (entry 1)).
const Q12_DIALOG: QuestDialogDefinition = {
    main: [
        { speaker: "player", text: "What is POL-1847?", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "That's a policy deployment.", audio: "", timeout: 3000 },
        { speaker: "player", text: "For CRI?", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "For the relationship pipeline. I can check the archived version.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "So nobody changed Rizky's record.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Not necessarily.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "They changed what the system was allowed to do with it.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "That's what the policy says.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Who approved it?", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "I don't know.", audio: "", timeout: 3000 },
        { speaker: "player", text: "But it went through?", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Yes. Normally, apparently.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "Then we need to know who 'normally' was.", audio: "", isEnd: true },
    ],
};

interface Q12QuestData {
    readonly inspectPolicyHistoryDone: boolean;
    readonly compareConfigurationsDone: boolean;
    readonly identifyReviewBehaviorChangeDone: boolean;
    readonly determineCom07BehaviorDone: boolean;
    readonly checkChangeHistoryDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ12Quest extends HackHubQuest<Q12QuestData> {
    override Name = "entity_resolution.q12";
    override Title = "THE PIPELINE";
    override Description =
        "Comparing legacy vs. current policy configuration (POL-1847) explains why COM-07-class sources skip review.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q11"];
    override Rewards = { money: 0, xp: 0 };
    override Dialog = Q12_DIALOG;
    override Objectives = Q12_OBJECTIVES;

    override CreateData(): Q12QuestData {
        return {
            inspectPolicyHistoryDone: false,
            compareConfigurationsDone: false,
            identifyReviewBehaviorChangeDone: false,
            determineCom07BehaviorDone: false,
            checkChangeHistoryDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see docs/source-current.md.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q12.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q12_REWARDS:
        //   gameRuntime.reward.claim(... locateArchive, 15)
        //   gameRuntime.reward.claim(... identifyPol1847, 10)
        //   gameRuntime.reward.claim(... comparePolicy, 25)
        //   gameRuntime.reward.claim(... deploymentDate, 5)
        //   gameRuntime.reward.claim(... conditionalReview, 20)
        //   gameRuntime.reward.claim(... correctInterpretation, 10)
        //   gameRuntime.reward.claim(... approvedSourceBypass, 20)
        //   gameRuntime.reward.claim(... traceCom07, 15)
        //   gameRuntime.reward.claim(... checkChangeHistory, 20) — if checkChangeHistory done
        //   Bank.transaction(... moneyBase + (checkChangeHistory done ? moneyOptional : 0))
        //   gameRuntime.flagStore.set(Q12_FINAL_STATE_FLAG, true)
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
