import {
    Quest as HackHubQuest,
    RegisterQuest,
    type QuestDialogDefinition,
} from "@hotbunny/hackhub-content-sdk";

import { Q13_OBJECTIVES } from "../../content/index.js";

// Direct quotes from the design doc's Q13 LOCKED source: the "Network
// Origin" scene (Daniel, matches correlateOriginNetwork) and the "Ending"
// scene (matches the quest's closing beat). The source also has separate
// "Adrian Contribution" (via Relay) and "Final Evidence"/"Maya
// Cross-Reference" scenes not included here — see
// docs/phase13-q04-q16-design-recovered.md source doc line ~26800-27130 for
// a future deeper pass. switchBranch/isEnd only — never onEnd/onSelect, see
// q03-quest.ts's Dialog field comment (permanently non-functional in this
// HackHub build, docs/hackhub-dialog-onend-bug-report.md).
const Q13_DIALOG: QuestDialogDefinition = {
    main: [
        { speaker: "Daniel", text: "ARKA network.", audio: "", timeout: 3000 },
        { speaker: "player", text: "So ARKA owns the account.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "No. That's what the record says.", audio: "", timeout: 3000 },
        {
            speaker: "Daniel",
            text: "ARKA runs infrastructure for more than one system. And privileged networks aren't the same thing as individual users.",
            audio: "",
            timeout: 3000,
        },
        { speaker: "player", text: "So we have a location.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "We have a network origin. Not a person.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "So we found the operator.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "We found an account.", audio: "", timeout: 3000 },
        { speaker: "player", text: "That's not the same thing.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "No.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "Then find the person.", audio: "", isEnd: true },
    ],
};

interface Q13QuestData {
    readonly searchOperationalAuditDone: boolean;
    readonly identifyPrivilegedIdentityDone: boolean;
    readonly traceActivityDone: boolean;
    readonly correlateOriginNetworkDone: boolean;
    readonly investigateFirstUseDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ13Quest extends HackHubQuest<Q13QuestData> {
    override Name = "entity_resolution.q13";
    override Title = "THE OPERATOR";
    override Description =
        "Locates the privileged OVERRIDE_OPERATOR account and its activity log, without yet identifying who controls it.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q12"];
    override Rewards = { money: 0, xp: 0 };
    override Dialog = Q13_DIALOG;
    override Objectives = Q13_OBJECTIVES;

    override CreateData(): Q13QuestData {
        return {
            searchOperationalAuditDone: false,
            identifyPrivilegedIdentityDone: false,
            traceActivityDone: false,
            correlateOriginNetworkDone: false,
            investigateFirstUseDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see docs/phase13-q04-q16-design-recovered.md.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q13.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q13_REWARDS:
        //   gameRuntime.reward.claim(... locateAccount, 20)
        //   gameRuntime.reward.claim(... inspectMetadata, 15)
        //   gameRuntime.reward.claim(... confirmPrivilegedIdentity, 15)
        //   gameRuntime.reward.claim(... traceActivity, 20)
        //   gameRuntime.reward.claim(... linkToPolicy, 20)
        //   gameRuntime.reward.claim(... analyzeSessionA77402, 20)
        //   gameRuntime.reward.claim(... correlateOrigin, 15)
        //   gameRuntime.reward.claim(... correctlyMaintainUnknownOperatorStatus, 10)
        //   gameRuntime.reward.claim(... investigateFirstUse, 15) — if investigateFirstUse done
        //   Bank.transaction(... moneyBase + (investigateFirstUse done ? moneyOptional : 0))
        //   gameRuntime.flagStore.set(Q13_FINAL_STATE_FLAG, true)
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
