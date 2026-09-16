import {
    Quest as HackHubQuest,
    RegisterQuest,
    type QuestDialogDefinition,
} from "@hotbunny/hackhub-content-sdk";

import { Q11_OBJECTIVES } from "../../content/index.js";

// Direct quotes from the design doc's Q11 LOCKED FINAL v1.0 "Revised Core
// Dialogue" + "Ending" scenes (Daniel's confession, questioned directly —
// matches the checkTheChange optional objective). The source also has a
// separate short "Maya + Daniel" confrontation scene not included here (see
// docs/source-current.md source doc line ~21731) — left
// for a future deeper pass. switchBranch/isEnd only — never onEnd/onSelect,
// see q03-quest.ts's Dialog field comment (permanently non-functional in
// this HackHub build, docs/bugs.md (entry 1)).
const Q11_DIALOG: QuestDialogDefinition = {
    main: [
        { speaker: "player", text: "When did this change?", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "It wasn't one change. Several small ones.", audio: "", timeout: 3000 },
        { speaker: "player", text: "And you worked on some of them.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Yes.", audio: "", timeout: 3000 },
        {
            speaker: "player",
            text: "Did you know fewer cases were being sent for review?",
            audio: "",
            timeout: 3000,
        },
        { speaker: "Daniel", text: "I knew.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Why didn't you stop it?", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "I thought it was temporary.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Was it?", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "No. Nobody told me it was permanent.", audio: "", timeout: 3000 },
        {
            speaker: "player",
            text: "If the review became optional, someone approved that.",
            audio: "",
            timeout: 3000,
        },
        { speaker: "Daniel", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Who?", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "I don't know.", audio: "", timeout: 3000 },
        { speaker: "player", text: "You were there.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "For some of it. Not all of it.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "That's what I got wrong.", audio: "", isEnd: true },
    ],
};

interface Q11QuestData {
    readonly inspectHistoricalArchitectureDone: boolean;
    readonly compareResolversDone: boolean;
    readonly identifyReviewExceptionDone: boolean;
    readonly inspectDanielsChangeDone: boolean;
    readonly checkTheChangeDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ11Quest extends HackHubQuest<Q11QuestData> {
    override Name = "entity_resolution.q11";
    override Title = "DANIEL";
    override Description =
        "Compares the legacy and current resolver pipelines and identifies Daniel's engineering change as a contributing technical cause.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q10"];
    override Rewards = { money: 0, xp: 0 };
    override Dialog = Q11_DIALOG;
    override Objectives = Q11_OBJECTIVES;

    override CreateData(): Q11QuestData {
        return {
            inspectHistoricalArchitectureDone: false,
            compareResolversDone: false,
            identifyReviewExceptionDone: false,
            inspectDanielsChangeDone: false,
            checkTheChangeDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see docs/source-current.md.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q11.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q11_REWARDS:
        //   gameRuntime.reward.claim(... locateArchive, 15)
        //   gameRuntime.reward.claim(... reconstructLegacyPipeline, 20)
        //   gameRuntime.reward.claim(... reconstructCurrentPipeline, 20)
        //   gameRuntime.reward.claim(... conditionalReview, 15)
        //   gameRuntime.reward.claim(... automaticAcceptance, 15)
        //   gameRuntime.reward.claim(... reviewException, 10)
        //   gameRuntime.reward.claim(... danielsComponentChange, 10)
        //   gameRuntime.reward.claim(... correctlyIdentifyReducedReviewCoverage, 10)
        //   gameRuntime.reward.claim(... checkChange, 5) — if checkTheChange done
        //   Bank.transaction(... Q11_REWARDS.money)
        //   gameRuntime.flagStore.set(Q11_FINAL_STATE_FLAG, true)
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
