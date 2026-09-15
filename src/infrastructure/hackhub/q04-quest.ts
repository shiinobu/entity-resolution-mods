import {
    Quest as HackHubQuest,
    RegisterQuest,
} from "@hotbunny/hackhub-content-sdk";

import { Q04_OBJECTIVES } from "../../content/index.js";

interface Q04QuestData {
    readonly reviewDecommissionNoticeDone: boolean;
    readonly verifyServerStatusDone: boolean;
    readonly closeAuditDone: boolean;
    readonly decideOnEvidenceDone: boolean;
    readonly checkLastConnectionDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ04Quest extends HackHubQuest<Q04QuestData> {
    override Name = "entity_resolution.q04";
    override Title = "LEAVE IT ALONE";
    override Description =
        "Client confirms edge-03's decommission and asks to close the audit — but the server is still live.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q03"];
    override Rewards = { money: 0, xp: 0 };
    override Objectives = Q04_OBJECTIVES;

    override CreateData(): Q04QuestData {
        return {
            reviewDecommissionNoticeDone: false,
            verifyServerStatusDone: false,
            closeAuditDone: false,
            decideOnEvidenceDone: false,
            checkLastConnectionDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see docs/phase13-quest-structure-standard.md and
        // docs/phase13-q04-q16-design-recovered.md. Network fixtures reuse
        // Q03's edge-03 host (Q04_TARGET_IP); opening mail not yet written.
    }

    override OnObjectivesStart() {
        // TODO: wire Terminal.Command / Terminal.Ls / Terminal.SSH.Connected
        // handlers here once objective logic is designed — see command
        // mapping comments in content/q04.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q04_REWARDS:
        //   gameRuntime.reward.claim(... verifyDecommissionStatus, 20)
        //   gameRuntime.reward.claim(... investigateActiveServer, 20)
        //   gameRuntime.reward.claim(... analyzeLastConnection, 20)   — if checkLastConnection done
        //   gameRuntime.reward.claim(... identifyAuthLogMismatch, 20) — if checkLastConnection done
        //   gameRuntime.reward.claim(... preserveAnomalousEvidence, 20)
        //   Bank.transaction(... Q04_REWARDS.money)
        //   gameRuntime.flagStore.set(Q04_FINAL_STATE_FLAG, true)
    }

    override OnAbandon() {
        // TODO: implement — cleanup network/fixtures mirroring OnComplete.
    }
}
