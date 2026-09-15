import {
    Quest as HackHubQuest,
    RegisterQuest,
    type QuestDialogDefinition,
} from "@hotbunny/hackhub-content-sdk";

import { Q14_OBJECTIVES } from "../../content/index.js";

// REBUILT verbatim from `DEAD_SIGNAL_Q14_THE_OWNER_LOCKED_v1.0.docx` (the
// authoritative locked source — see content/q14.ts's header comment).
// `main` chains: objective-01 reaction -> Marcus interview (objectives 05
// +06 merged, no real branch needed, it's linear Q&A) -> the "Authorization
// Chain" reflection -> Ending. `adrianContribution` is a separate,
// source-labeled side conversation ("9. Adrian Contribution") not gated by
// any in-main player choice — TODO: needs its own real trigger point
// (e.g. a separate Adrian contact/call) when Q14 is actually implemented;
// for now it's reachable only via `createDialog("adrianContribution")`
// called explicitly, same TODO status as every other event-wiring gap in
// this skeleton. switchBranch/isEnd only — never onEnd/onSelect, see
// q03-quest.ts's Dialog field comment (permanently non-functional in this
// HackHub build, docs/hackhub-dialog-onend-bug-report.md).
const Q14_DIALOG: QuestDialogDefinition = {
    main: [
        { speaker: "Daniel", text: "It's shared.", audio: "", timeout: 3000 },
        { speaker: "player", text: "So multiple people could use it.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "If they were authorized.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Then the account itself doesn't identify the operator.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Correct.", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "You've been looking at OVERRIDE_OPERATOR.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "Then you've probably seen my name.", audio: "", timeout: 3000 },
        { speaker: "player", text: "M. Reed.", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "That's me.", audio: "", timeout: 3000 },
        { speaker: "player", text: "You approved AR-44192.", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "I approved an access request.", audio: "", timeout: 3000 },
        { speaker: "player", text: "For OVERRIDE_OPERATOR.", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "Correct.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Why?", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "Privileged operational access requires approval.", audio: "", timeout: 3000 },
        { speaker: "player", text: "What was the access for?", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "The request says operational maintenance.", audio: "", timeout: 3000 },
        { speaker: "player", text: "That's all?", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "That's what was submitted.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Did you use this session?", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "No.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Did you know who did?", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "The identity was delegated.", audio: "", timeout: 3000 },
        { speaker: "player", text: "That's not an answer.", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "It's the only answer the authorization record supports.", audio: "", timeout: 3000 },
        { speaker: "player", text: "You approved access.", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "player", text: "But you didn't use it.", audio: "", timeout: 3000 },
        { speaker: "Marcus", text: "Correct.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "That's the boundary.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Marcus authorized the access.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "player", text: "The account performed the action.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "player", text: "We don't know who was behind the account.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Correct.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "Marcus approved it.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "He knew the account existed.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "And someone used it.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Yes.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "So we finally have a person.", audio: "", timeout: 3000 },
        { speaker: "player", text: "We have the person who authorized access.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "Not the person who used it.", audio: "", timeout: 3000 },
        { speaker: "player", text: "No.", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "The primary audit system retains the operator reference.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Can we access it?", audio: "", timeout: 3000 },
        { speaker: "Daniel", text: "Not from the archive.", audio: "", timeout: 3000 },
        { speaker: "Maya", text: "Then that's where we go next.", audio: "", isEnd: true },
    ],
    adrianContribution: [
        { speaker: "player", text: "Do you know OVERRIDE_OPERATOR?", audio: "", timeout: 3000 },
        { speaker: "Adrian", text: "I've seen the identity.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Where?", audio: "", timeout: 3000 },
        { speaker: "Adrian", text: "ARKA deployment documentation.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Who uses it?", audio: "", timeout: 3000 },
        { speaker: "Adrian", text: "I don't know.", audio: "", timeout: 3000 },
        { speaker: "player", text: "You're sure?", audio: "", timeout: 3000 },
        { speaker: "Adrian", text: "I know what you're looking for. And no, I never had access to it.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Did you know it was being used around CRI?", audio: "", timeout: 3000 },
        { speaker: "Adrian", text: "No.", audio: "", timeout: 3000 },
        { speaker: "player", text: "Would you have reported it?", audio: "", timeout: 3000 },
        { speaker: "Adrian", text: "Back then? Probably not.", audio: "", isEnd: true },
    ],
};

interface Q14QuestData {
    readonly findAccessRegistryDone: boolean;
    readonly traceAccessWindowDone: boolean;
    readonly findAuthorizationDone: boolean;
    readonly resolveApproverDone: boolean;
    readonly speakToMarcusDone: boolean;
    readonly askAboutSessionDone: boolean;
    readonly checkAccessJustificationDone: boolean;
}

@RegisterQuest
export class EntityResolutionQ14Quest extends HackHubQuest<Q14QuestData> {
    override Name = "entity_resolution.q14";
    override Title = "THE OWNER";
    override Description =
        "Traces the OVERRIDE_OPERATOR account's delegated-access model to Marcus Reed — its authorized approver, not confirmed operator.";
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q13"];
    override Rewards = { money: 0, xp: 0 };
    override Dialog = Q14_DIALOG;
    override Objectives = Q14_OBJECTIVES;

    override CreateData(): Q14QuestData {
        return {
            findAccessRegistryDone: false,
            traceAccessWindowDone: false,
            findAuthorizationDone: false,
            resolveApproverDone: false,
            speakToMarcusDone: false,
            askAboutSessionDone: false,
            checkAccessJustificationDone: false,
        };
    }

    override OnStart() {
        // TODO: implement — see DEAD_SIGNAL_Q14_THE_OWNER_LOCKED_v1.0.docx
        // (authoritative) via content/q14.ts's header comment.
    }

    override OnObjectivesStart() {
        // TODO: wire event handlers — see command mapping in content/q14.ts.
    }

    override OnComplete() {
        // TODO: implement. Needs, per Q14_REWARDS:
        //   gameRuntime.reward.claim(... findAccessRegistry, 20)
        //   gameRuntime.reward.claim(... traceAccessWindow, 20)
        //   gameRuntime.reward.claim(... findAuthorization, 20)
        //   gameRuntime.reward.claim(... resolveApprover, 20)
        //   gameRuntime.reward.claim(... speakToMarcus, 20)
        //   gameRuntime.reward.claim(... askAboutSession, 20)
        //   gameRuntime.reward.claim(... checkAccessJustification, 20) — if checkAccessJustification done
        //   Bank.transaction(... Q14_REWARDS.money) — flat, no optional split (LOCKED source gives no money split)
        //   gameRuntime.flagStore.set(Q14_FINAL_STATE_FLAG, true)
    }

    override OnAbandon() {
        // TODO: implement.
    }
}
