import {
    Quest as HackHubQuest,
    RegisterQuest,
} from "@hotbunny/hackhub-content-sdk";

import { Q06_OBJECTIVES } from "../../content/index.js";

interface Q06QuestData {
    readonly inspectDatabaseDone: boolean;
    readonly identifySystemMetadataDone: boolean;
    readonly inspectDataSourcesDone: boolean;
    readonly investigateRizkyDone: boolean;
    readonly checkModelDone: boolean;
    readonly traceRecordDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ06Quest extends HackHubQuest<Q06QuestData> {
    override Name = "entity_resolution.q06";
    override Title = "THE DATABASE";
    override Description =
        "A diagnostic archive first names the Civic Risk Index and introduces Rizky Pratama's HIGH-risk record.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q05"];
    override Rewards = { money: 0, xp: 0 };
    override Objectives = Q06_OBJECTIVES;

    override CreateData(): Q06QuestData {
        return {
            inspectDatabaseDone: false,
            identifySystemMetadataDone: false,
            inspectDataSourcesDone: false,
            investigateRizkyDone: false,
            checkModelDone: false,
            traceRecordDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see docs/source-current.md.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q06.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q06_REWARDS:
        //   gameRuntime.reward.claim(... locateArchive, 20)
        //   gameRuntime.reward.claim(... inspectSchema, 20)
        //   gameRuntime.reward.claim(... criDefinition, 15)
        //   gameRuntime.reward.claim(... dataSources, 15)
        //   gameRuntime.reward.claim(... investigateRizky, 20)
        //   gameRuntime.reward.claim(... confidenceHistoryAnalysis, 10)
        //   gameRuntime.reward.claim(... modelMetadata, 10) — if checkModel done
        //   gameRuntime.reward.claim(... traceHistory, 10) — if traceRecord done
        //   Bank.transaction(... Q06_REWARDS.money)
        //   gameRuntime.flagStore.set(Q06_FINAL_STATE_FLAG, true)
        //   ENTITY_RESOLUTION_FLAGS.criKnown = true
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
