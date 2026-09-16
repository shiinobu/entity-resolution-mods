import {
    Quest as HackHubQuest,
    RegisterQuest,
} from "@hotbunny/hackhub-content-sdk";

import { Q05_OBJECTIVES } from "../../content/index.js";

interface Q05QuestData {
    readonly reviewScopeDone: boolean;
    readonly inspectApiSurfaceDone: boolean;
    readonly identifyClassificationEndpointsDone: boolean;
    readonly inspectStagingEnvironmentDone: boolean;
    readonly enumerateApiDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ05Quest extends HackHubQuest<Q05QuestData> {
    override Name = "entity_resolution.q05";
    override Title = "SECOND CLIENT";
    override Description =
        "A new client engagement surfaces a restricted classification API and introduces Maya.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q04"];
    override Rewards = { money: 0, xp: 0 };
    override Objectives = Q05_OBJECTIVES;

    override CreateData(): Q05QuestData {
        return {
            reviewScopeDone: false,
            inspectApiSurfaceDone: false,
            identifyClassificationEndpointsDone: false,
            inspectStagingEnvironmentDone: false,
            enumerateApiDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see docs/source-current.md.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q05.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q05_REWARDS:
        //   gameRuntime.reward.claim(... auditReview, 20)
        //   gameRuntime.reward.claim(... mayaPublicReportCorrelation, 10)
        //   gameRuntime.reward.claim(... arkaPatternRecognition, 15)
        //   gameRuntime.reward.claim(... classificationApiIdentification, 20)
        //   gameRuntime.reward.claim(... internalEndpointDiscovery, 15)
        //   gameRuntime.reward.claim(... recognizePatternWithoutClaimingProof, 10)
        //   gameRuntime.reward.claim(... apiEnumeration, 10) — if enumerateApi done
        //   Bank.transaction(... Q05_REWARDS.money)
        //   gameRuntime.flagStore.set(Q05_FINAL_STATE_FLAG, true)
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
