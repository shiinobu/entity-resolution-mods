import {
    Quest as HackHubQuest,
    RegisterQuest,
} from "@hotbunny/hackhub-content-sdk";

import { Q07_OBJECTIVES } from "../../content/index.js";

interface Q07QuestData {
    readonly inspectRelationshipDataDone: boolean;
    readonly identifyAssociationWeightingDone: boolean;
    readonly compareSubjectsDone: boolean;
    readonly mapNetworkDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ07Quest extends HackHubQuest<Q07QuestData> {
    override Name = "entity_resolution.q07";
    override Title = "CONNECTIONS";
    override Description =
        "Establishes the association-weighting mechanism CRI uses to compute risk. Introduces Daniel.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q06"];
    override Rewards = { money: 0, xp: 0 };
    override Objectives = Q07_OBJECTIVES;

    override CreateData(): Q07QuestData {
        return {
            inspectRelationshipDataDone: false,
            identifyAssociationWeightingDone: false,
            compareSubjectsDone: false,
            mapNetworkDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see docs/phase13-q04-q16-design-recovered.md.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q07.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q07_REWARDS:
        //   gameRuntime.reward.claim(... relationshipModel, 20)
        //   gameRuntime.reward.claim(... understandMechanism, 20)
        //   gameRuntime.reward.claim(... associationWeightId, 15)
        //   gameRuntime.reward.claim(... riskContribution, 15)
        //   gameRuntime.reward.claim(... networkAnalysis, 20)
        //   gameRuntime.reward.claim(... correctInterpretation, 10)
        //   gameRuntime.reward.claim(... mapGraph, 15)          — if mapNetwork done
        //   gameRuntime.reward.claim(... restrictedSubject, 5)  — if mapNetwork done
        //   Bank.transaction(... Q07_REWARDS.money)
        //   gameRuntime.flagStore.set(Q07_FINAL_STATE_FLAG, true)
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
