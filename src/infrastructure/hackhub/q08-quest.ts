import {
    Quest as HackHubQuest,
    RegisterQuest,
    type QuestDialogDefinition,
} from "@hotbunny/hackhub-content-sdk";

import { Q08_OBJECTIVES } from "../../content/index.js";

// Direct quote from the design doc's "Q08 — YOUR NAME" dialogue-progression
// note ("the dialogue turning point"). Only this one short exchange is given
// in the source — deliberately terse per the source's own note ("don't add
// long exposition here"). switchBranch/isEnd only — never onEnd/onSelect,
// see q03-quest.ts's Dialog field comment (permanently non-functional in
// this HackHub build, docs/bugs.md (entry 1)).
const Q08_DIALOG: QuestDialogDefinition = {
    main: [
        { speaker: "Maya", text: "I think I found the connection.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "Your record.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "It means you're not outside this anymore.", audio: "", isEnd: true },
    ],
};

interface Q08QuestData {
    readonly locatePlayerRecordDone: boolean;
    readonly inspectPlayerClassificationDone: boolean;
    readonly inspectPlayerRelationshipDone: boolean;
    readonly identifyRestrictedSubjectDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ08Quest extends HackHubQuest<Q08QuestData> {
    override Name = "entity_resolution.q08";
    override Title = "YOUR NAME";
    override Description =
        "The player finds their own CRI record and discovers a low-confidence link to Rizky's subject.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q07"];
    override Rewards = { money: 0, xp: 0 };
    override Dialog = Q08_DIALOG;
    override Objectives = Q08_OBJECTIVES;

    override CreateData(): Q08QuestData {
        return {
            locatePlayerRecordDone: false,
            inspectPlayerClassificationDone: false,
            inspectPlayerRelationshipDone: false,
            identifyRestrictedSubjectDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see docs/source-current.md.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q08.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q08_REWARDS:
        //   gameRuntime.reward.claim(... findRecord, 20)
        //   gameRuntime.reward.claim(... classificationAnalysis, 15)
        //   gameRuntime.reward.claim(... manualReviewId, 15)
        //   gameRuntime.reward.claim(... traceRelationship, 15)
        //   gameRuntime.reward.claim(... identifySubject88172, 10)
        //   gameRuntime.reward.claim(... correlatePlayerRizky, 10)
        //   gameRuntime.reward.claim(... entityResolutionInvestigation, 15) — if identifyRestrictedSubject done
        //   gameRuntime.reward.claim(... lowMatchConfidence, 10)            — if identifyRestrictedSubject done
        //   gameRuntime.reward.claim(... recognizeEntityResolutionConcern, 10) — if identifyRestrictedSubject done
        //   Bank.transaction(... Q08_REWARDS.money)
        //   gameRuntime.flagStore.set(Q08_FINAL_STATE_FLAG, true)
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
