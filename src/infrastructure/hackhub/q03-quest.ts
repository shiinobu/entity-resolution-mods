import {
    Bank,
    Files,
    Mail,
    Network,
    Quest as HackHubQuest,
    RegisterQuest,
    Shell,
    type QuestDialogDefinition,
    type QuestDialogSpeech,
} from "@hotbunny/hackhub-content-sdk";

import {
    ENTITY_RESOLUTION_FLAGS,
    Q03_ADRIAN_EMAIL,
    Q03_BACKUP_CHECKED_FLAG,
    Q03_BACKUP_RESTRICTED_FLAG,
    Q03_CLIENT_NAME,
    Q03_COMPLETION_DELAY_MS,
    Q03_COMPLETION_MAIL_CONTENT_PRODUCTION,
    Q03_CRI_POLICY_FOUND_FLAG,
    Q03_FINAL_STATE_FLAG,
    Q03_HACKHUB_POST_PRODUCTION,
    Q03_INCOMING_MAIL_CONTENT,
    Q03_INCOMING_MAIL_SUBJECT,
    Q03_LAST_ACTIVITY_DATE,
    Q03_LOGS_MISSING_FLAG,
    Q03_LOGS_START_DATE,
    Q03_MISSING_LOGS,
    Q03_MISSING_ROTATIONS,
    Q03_NETWORK_PORTS,
    Q03_NMAP_RESULT,
    Q03_OBJECTIVES,
    Q03_OBJECTIVE_IDS,
    Q03_REPORT_BODY,
    Q03_REPORT_SUBJECT,
    Q03_REPORT_TEMPLATE_CONTENT,
    Q03_REPORT_TEMPLATE_ID,
    Q03_REPORT_TEMPLATE_LABEL,
    Q03_REWARDS,
    Q03_ROOT_FILES,
    Q03_ROUTER_IP,
    Q03_SSH_HYDRA_TARGET,
    Q03_SSH_PASSWORD,
    Q03_SSH_USERNAME,
    Q03_TARGET_IP,
    Q03_WEB_HOST,
} from "../../content/index.js";

import { asId } from "../../core/index.js";
import { gameRuntime } from "./runtime.js";
import { monthDayMatches, numberSetsMatch } from "./commands/q03-log-tools.js";

interface Q03QuestData {
    readonly targetIp: string;
    readonly connected: boolean;
    readonly logsChecked: boolean;
    readonly filestatRun: boolean;
    readonly bootlogRun: boolean;
    readonly gapInvestigated: boolean;
    readonly backupChecked: boolean;
    readonly reportSubmitted: boolean;
}

interface TerminalCommandData {
    readonly command: string;
    readonly args: string[];
}

interface TerminalLsData {
    readonly id: string;
    readonly name: string;
}

interface TerminalCatData {
    readonly id: string;
    readonly name: string;
    readonly extension?: string;
}

interface HydraResultData {
    readonly ip: string;
    readonly credentials?: {
        readonly username: string;
        readonly password: string;
    };
}

const includesArgMatching = (args: readonly string[], needle: string): boolean =>
    args.some((arg) => arg.toLowerCase().includes(needle));

// EXPERIMENT 2026-09-15: every direct function property on a `Dialog` entry
// (5 syntactic forms tried, all identical failure — see
// docs/hackhub-dialog-onend-bug-report.md) stalls the transition into that
// entry, with no exception found. This wraps a fully plain (function-free)
// `Dialog` object in a `Proxy` instead, so the SDK never sees a function
// value anywhere inside the data it reads — the side effect fires from
// OUTSIDE the object, triggered by the property READ itself (`Dialog[branch]
// [index]`), not from a value stored inside it. Untested hypothesis: if the
// engine's per-line stall is caused by something like `structuredClone`
// throwing on a function it finds inside the line object (unlike
// `JSON.stringify`, which silently drops functions), a Proxy trap never
// puts a function inside the cloned data, so cloning should succeed.
const withDialogLineReadTap = (
    dialog: QuestDialogDefinition,
    onLineRead: (branch: string, index: number, entry: QuestDialogSpeech) => void,
): QuestDialogDefinition =>
    new Proxy(dialog, {
        get(target, branchProp, receiver): unknown {
            const branchValue = Reflect.get(target, branchProp, receiver);

            if (!Array.isArray(branchValue) || typeof branchProp !== "string") {
                return branchValue;
            }

            return new Proxy(branchValue, {
                get(arr, indexProp, arrReceiver): unknown {
                    const value = Reflect.get(arr, indexProp, arrReceiver);

                    if (typeof indexProp === "string" && /^\d+$/.test(indexProp)) {
                        onLineRead(branchProp, Number(indexProp), value as QuestDialogSpeech);
                    }

                    return value;
                },
            });
        },
    });

// REVISED 2026-09-15 (third pass) after live-test: `Shell.addCommandData`
// fixtures do NOT persist across a HackHub restart — like `nmap`/`hydra`,
// `ssh`'s fixture must be re-registered every game start, which only
// `OnObjectivesStart` guarantees ("called once on claim AND again every
// time the game starts" per the SDK's own Quest base class doc comment).
// `OnStart` runs exactly once, ever, per claim — placing `ssh`'s fixture
// there (as the original probe happened to do, and as an earlier revision
// of this file mirrored) meant it was NEVER re-registered on subsequent
// restarts of an already-claimed quest, so SSH connections failed again
// after every restart despite working right after the initial claim.
// `OnObjectivesStart` is fully synchronous (no await anywhere before this
// runs), so it does not trigger the separate async-context-loss bug
// documented on OnStart below.
const resetQ03ShellFixtures = (): void => {
    Shell.removeCommandData("ssh", { host: Q03_TARGET_IP, key: Q03_SSH_PASSWORD });
    Shell.removeCommandData("hydra", { user: Q03_SSH_USERNAME, target: Q03_SSH_HYDRA_TARGET });
    // Defensive: `Shell.addCommandData`/`removeCommandData` is a registry
    // keyed by exact (command, input) — separate from `Network.*` entirely,
    // and apparently persists independent of which quest originally set it.
    // Q03_TARGET_IP === Q02_TARGET_IP (same host by design), and Q02's own
    // `nmap` fixture for this exact IP was observed live 2026-09-15 to keep
    // reappearing (stale, port 22 CLOSE) no matter how Q03's own Network
    // topology was restructured — clear it explicitly rather than assume
    // Q02 already cleaned up after itself.
    Shell.removeCommandData("nmap", Q03_TARGET_IP);
    Shell.removeCommandData("nmap", "");
};

const registerQ03ShellFixtures = (): void => {
    resetQ03ShellFixtures();

    Shell.addCommandData("nmap", Q03_TARGET_IP, Q03_NMAP_RESULT);
    Shell.addCommandData("nmap", "", Q03_NMAP_RESULT);

    // Confirmed live pattern from the Q03 SSH probe: `host` matches the bare
    // target IP regardless of the `-h user@ip` prefix the player types, and
    // `key` only feeds this port/status gate — actual auth uses the
    // NetworkUser's real `password`, not this value.
    Shell.addCommandData(
        "ssh",
        { host: Q03_TARGET_IP, key: Q03_SSH_PASSWORD },
        { ip: Q03_TARGET_IP, status: "OPEN" },
    );

    // Revised 2026-09-15 after live-test: `john` has its own internal crack
    // simulation and ignores addCommandData entirely ("The password could
    // not be cracked." regardless of fixture data). `hydra` IS part of the
    // typed CommandDataMap. Confirmed live usage:
    // `hydra -T [ip:port] -P [wordlist] -l [username]` — `target` must be
    // the combined `ip:port` string, not a bare IP.
    Shell.addCommandData(
        "hydra",
        { user: Q03_SSH_USERNAME, target: Q03_SSH_HYDRA_TARGET },
        { credentials: { username: Q03_SSH_USERNAME, password: Q03_SSH_PASSWORD } },
    );
};

const sendAdrianMail = (subject: string, content: string): void => {
    Mail.send({
        from: Q03_ADRIAN_EMAIL,
        subject,
        content,
    });
};

@RegisterQuest
export class EntityResolutionQ03Quest extends HackHubQuest<Q03QuestData> {
    override Name = "entity_resolution.q03";
    override Title = "MISSING LOGS";
    override Description =
        `Determine when an old, supposedly decommissioned server on ${Q03_CLIENT_NAME}'s network was last active.`;
    override Group = "storyline" as const;
    override AutoStart = false;
    override AutoComplete = true;
    override QuestsToComplete = ["entity_resolution.q02"];
    override Rewards = {
        money: 0,
        xp: 0,
    };
    // Drives the phone-call Dialog's caller identity (name/avatar) — without
    // this, the native phone UI falls back to a base-game default contact
    // ("Shay Rogers"), confirmed live 2026-09-15 when createDialog worked
    // but showed the wrong caller. No prior Q01/Q02 quest set this because
    // Q03 is the first to use createDialog at all.
    override Employer = {
        firstName: "Adrian",
        lastName: "Cole",
        email: Q03_ADRIAN_EMAIL,
        avatar: "assets/adrian-cole.png",
    };
    override HackhubPost = Q03_HACKHUB_POST_PRODUCTION;

    // Static phone-call Dialog tree — declared once as a class field, never
    // reassigned at runtime. Confirmed live 2026-09-15: assigning
    // `this.Dialog = ...` dynamically inside handleMailSent() never threw,
    // and the assigned object (logged back via `this.Dialog`) matched
    // exactly what was set — yet the phone call UI showed no text/options
    // at all. Strong evidence the SDK reads `Dialog` once at quest
    // registration, before any runtime assignment can take effect.
    //
    // FINAL FINDING (2026-09-15, exhaustively tested — see
    // docs/hackhub-dialog-onend-bug-report.md): `onEnd` (on a speech line)
    // and `onSelect` (on an option) NEVER fire, under any circumstance.
    // Confirmed across every jump mechanism the SDK exposes (mid-call
    // `onEnd`+`createDialog()`, `switchBranch`, `nextIndex`, `onSelect`
    // directly on an option with no jump) and, once isolated down to just
    // the callback itself, across every syntactic FORM a function can take
    // in JS/TS: an arrow referencing `this`, a bare arrow with no `this`
    // access at all, a `function` expression, a pre-bound class method
    // (`.bind(this)`), and a plain named top-level function reference.
    // Every single one produces the identical symptom: the transition INTO
    // whichever dialog entry carries that function property stalls
    // completely — no error, no UI change, nothing in the logs — while
    // every entry with only plain data (string/boolean/number fields, no
    // function) always advances correctly regardless of position in the
    // array or how it's reached. This is not fixable from mod code; a
    // separate community quest-editor tool for this game
    // (github.com/TheZeis/Hackhub-Quest-Editor) independently arrived at
    // the same conclusion — its compiler never emits `onEnd`/`onSelect` at
    // all, only `switchBranch`/`isEnd` on plain data, and it calls
    // `createDialog()` fire-and-forget without waiting for any completion
    // signal.
    //
    // Fixed by building `Dialog` with `switchBranch`/`isEnd` only — zero
    // function properties anywhere in the object — and calling
    // `finishReportFindings()` directly from `handleMailSent()` (see
    // below), decoupled entirely from the dialog's own lifecycle. This is
    // the ONLY configuration confirmed live to work end to end, including
    // the full A/B/C player-choice branching from the original design.
    override Dialog: QuestDialogDefinition = withDialogLineReadTap({
        postReportMain: [
            { speaker: "Adrian", text: "Thanks. I'll forward this to the client.", audio: "", timeout: 3000 },
            { speaker: "Adrian", text: "Actually, hold on.", audio: "", timeout: 3000 },
            {
                speaker: "Adrian",
                text: "Don't include the backup finding in the client report yet.",
                audio: "",
                timeout: 3000,
            },
            { speaker: "player", text: "Why?", audio: "", timeout: 3000 },
            { speaker: "Adrian", text: "Because I don't know what it means.", audio: "", timeout: 3000 },
            { speaker: "player", text: "The logs are missing.", audio: "", timeout: 3000 },
            { speaker: "Adrian", text: "I know.", audio: "", timeout: 3000 },
            {
                speaker: "Adrian",
                text: "Just leave it for now.",
                audio: "",
                options: [
                    {
                        label: "Then why are you asking me to stop?",
                        text: "Then why are you asking me to stop?",
                        switchBranch: "postReportA",
                        audio: "",
                    },
                    {
                        label: "Fine. I'll leave it.",
                        text: "Fine. I'll leave it.",
                        switchBranch: "postReportB",
                        audio: "",
                    },
                    {
                        label: "I think someone removed the logs.",
                        text: "I think someone removed the logs.",
                        switchBranch: "postReportC",
                        audio: "",
                    },
                ],
            },
        ],
        postReportMainWithBackup: [
            { speaker: "Adrian", text: "Thanks. I'll forward this to the client.", audio: "", timeout: 3000 },
            { speaker: "Adrian", text: "Actually, hold on.", audio: "", timeout: 3000 },
            {
                speaker: "Adrian",
                text: "Don't include the backup finding in the client report yet.",
                audio: "",
                timeout: 3000,
            },
            { speaker: "player", text: "Why?", audio: "", timeout: 3000 },
            { speaker: "Adrian", text: "Because I don't know what it means.", audio: "", timeout: 3000 },
            { speaker: "player", text: "The logs are missing.", audio: "", timeout: 3000 },
            { speaker: "Adrian", text: "I know.", audio: "", timeout: 3000 },
            { speaker: "player", text: "And the backup is restricted.", audio: "", timeout: 3000 },
            { speaker: "Adrian", text: "I know that too.", audio: "", timeout: 3000 },
            {
                speaker: "Adrian",
                text: "Just leave it for now.",
                audio: "",
                options: [
                    {
                        label: "Then why are you asking me to stop?",
                        text: "Then why are you asking me to stop?",
                        switchBranch: "postReportA",
                        audio: "",
                    },
                    {
                        label: "Fine. I'll leave it.",
                        text: "Fine. I'll leave it.",
                        switchBranch: "postReportB",
                        audio: "",
                    },
                    {
                        label: "I think someone removed the logs.",
                        text: "I think someone removed the logs.",
                        switchBranch: "postReportC",
                        audio: "",
                    },
                ],
            },
        ],
        postReportA: [
            {
                speaker: "Adrian",
                text: "Because I don't want a routine audit turning into something I can't explain to the client.",
                audio: "",
                isEnd: true,
            },
        ],
        postReportB: [
            {
                speaker: "Adrian",
                text: "Appreciate it.",
                audio: "",
                isEnd: true,
            },
        ],
        postReportC: [
            {
                speaker: "Adrian",
                text: "Don't make that assumption yet.",
                audio: "",
                isEnd: true,
            },
        ],
    }, (branch, index, entry) => {
        console.log(
            `[Q03 DIAG] Proxy line-read tap: branch=${branch} index=${index} isEnd=${String(entry.isEnd ?? false)} text=${JSON.stringify(entry.text)}`,
        );

        // CORRECTED 2026-09-15: this trap does NOT signal "the player just
        // reached this line." Live log timestamps showed every single line
        // across every branch (postReportMain, postReportMainWithBackup,
        // postReportA, postReportB, postReportC — the whole reachable
        // graph, ~23 lines) logged within the same second `createDialog()`
        // was called, long before the player could have seen any of it.
        // `createDialog()` evidently walks and reads the entire branch
        // graph eagerly and synchronously at call-setup time — this trap
        // only reveals that internal traversal, not real playback
        // progress. (Useful evidence for the root-cause theory: the
        // engine likely `structuredClone`s this whole graph up front,
        // which would explain why a function ANYWHERE in it — even an
        // unreached line — corrupts something and stalls display later.)
        // Deliberately NOT wired to `finishReportFindings` — doing so
        // fires it at essentially T+0 instead of near the end, which is
        // worse than the fixed-delay fallback. Kept as a diagnostic aid
        // only; see `handleMailSent`'s fallback-timer call for the actual
        // (still imprecise, but only viable) completion trigger.
    });

    override Objectives = Q03_OBJECTIVES;

    override CreateData(): Q03QuestData {
        return {
            targetIp: Q03_TARGET_IP,
            connected: false,
            logsChecked: false,
            filestatRun: false,
            bootlogRun: false,
            gapInvestigated: false,
            backupChecked: false,
            reportSubmitted: false,
        };
    }

    override OnStart() {
        gameRuntime.quest.start(Q03_MISSING_LOGS);

        // ROOT CAUSE FOUND 2026-09-15 (after extensive live-test isolation —
        // see docs/phase13-q03-source-recovered.md's "Live-Test Findings"):
        // `await`ing ANYTHING (even `Network.destroyNetwork`) before calling
        // `Network.createSubnetNetwork` makes the engine lose track of which
        // mod is calling across the async boundary — the create call then
        // fails with `[ContentSDK] Mod "null" tried to use
        // Network.createSubnetNetwork without "network" permission`, even
        // though the manifest is correct. `OnStart` must stay fully
        // synchronous. Fire-and-forget (no await) is safe here — matches how
        // OnComplete/OnAbandon already call destroyNetwork without awaiting.
        // Defensive cleanup: Q03_TARGET_IP === Q02_TARGET_IP (same host, by
        // design) — Q02's own design uses this IP as a router directly, so
        // this guards against a Q02 network left active. A no-op otherwise.
        //
        // Deliberately NOT also destroying Q03_ROUTER_IP here (tried and
        // reverted 2026-09-15): destroy-then-immediately-create at the SAME
        // address raced the engine's own async teardown of a genuinely
        // present router — SSH failed on the very next fresh claim right
        // after. destroyNetwork returns a Promise for a reason (real,
        // non-instant teardown), and it cannot be awaited here without
        // reintroducing the mod-context-loss bug above. In real gameplay
        // this never matters: OnStart runs exactly once per quest, ever, and
        // any prior network at Q03_ROUTER_IP would already be this same
        // quest's own — never created twice. The only way to orphan a router
        // at Q03_ROUTER_IP is our own dev workflow of rebuilding the replay
        // mod (which mints a new quest Name each time, orphaning the
        // previous claim without running its OnAbandon) — use the debug
        // console's `mods.reset <modId>` between dev rebuilds instead of
        // papering over it here at the cost of a live race.
        Network.destroyNetwork(Q03_TARGET_IP);

        // REVISED 2026-09-15 (second pass) after live-test: neither a bare
        // top-level `type: Device` NOR a top-level `Router` with
        // `users`/`ports` declared directly on it (no child) accepted SSH
        // connections live — both failed with "Connection to the remote
        // server could not be established." `Network.createSubnetNetwork`'s
        // own doc comment says it creates "a full subnet network (Router
        // WITH CHILDREN hierarchy)" — matching the Q03 SSH probe's only
        // proven-working shape (Router wrapping a CHILD Device). The
        // player-facing IP must stay `Q03_TARGET_IP` (identical to the known
        // web host), so the Router gets a separate, never-mentioned wrapper
        // IP (`Q03_ROUTER_IP`) instead, and the real SSH-reachable Device is
        // declared as ITS CHILD at `Q03_TARGET_IP` — invisible restructuring,
        // no change to anything the player sees.
        Network.createSubnetNetwork({
            ip: Q03_ROUTER_IP,
            type: Network.Type.Router,
            ports: [],
            users: [],
            children: [
                {
                    ip: this.Data.targetIp,
                    type: Network.Type.Device,
                    ports: Q03_NETWORK_PORTS,
                    users: [
                        Network.createUser({
                            username: Q03_SSH_USERNAME,
                            password: Q03_SSH_PASSWORD,
                        }),
                    ],
                    rootFiles: Q03_ROOT_FILES,
                },
            ],
        });

        // Same host Q02 already fully investigated — re-registered because
        // Q02 destroyed its own network/domain on completion. Not a new
        // hidden target, so the opening mail states it directly.
        Network.registerDomain(Q03_WEB_HOST, this.Data.targetIp);

        sendAdrianMail(Q03_INCOMING_MAIL_SUBJECT, Q03_INCOMING_MAIL_CONTENT);
    }

    override OnObjectivesStart() {
        registerQ03ShellFixtures();

        Mail.registerTemplate({
            id: Q03_REPORT_TEMPLATE_ID,
            label: Q03_REPORT_TEMPLATE_LABEL,
            title: Q03_REPORT_SUBJECT,
            content: Q03_REPORT_TEMPLATE_CONTENT,
            fields: ["lastActivity", "logsStart", "missingRotations"],
        });

        this.Events.on("Terminal.Command", (data) => {
            this.handleTerminalCommand(data);
        });

        // Dual-listened alongside Terminal.Command as a safety net — whether
        // native Terminal.Ls/Terminal.Cat fire reliably inside an SSH session
        // (or for custom mod commands at all) is unverified until
        // live-tested. Both paths are guarded by the same Data booleans, so
        // whichever fires first wins with no double-fire.
        this.Events.on("Terminal.Ls", (data) => {
            this.handleTerminalLs(data);
        });

        this.Events.on("Terminal.Cat", (data) => {
            this.handleTerminalCat(data);
        });

        this.Events.on("Terminal.SSH.Connected", (ip) => {
            this.handleSshConnected(ip);
        });

        // Diagnostic only — no objective depends on this. The player reads
        // the cracked password from hydra's own terminal output and types it
        // into `ssh` themselves; this just confirms live whether the native
        // event actually reports our declared credentials back.
        this.Events.on("Terminal.Hydra", (data) => {
            this.handleTerminalHydra(data);
        });

        this.Events.on("Mail.Sent", (data) => {
            this.handleMailSent(data.subject, data.content);
        });
    }

    override OnComplete() {
        console.log("[Q03 DIAG] OnComplete entered.");

        gameRuntime.flagStore.set(Q03_FINAL_STATE_FLAG, true);
        gameRuntime.flagStore.set(Q03_LOGS_MISSING_FLAG, true);
        gameRuntime.flagStore.set(Q03_BACKUP_CHECKED_FLAG, this.Data.backupChecked);
        gameRuntime.flagStore.set(Q03_BACKUP_RESTRICTED_FLAG, this.Data.backupChecked);
        gameRuntime.flagStore.set(Q03_CRI_POLICY_FOUND_FLAG, this.Data.backupChecked);
        // Global, campaign-wide flags (see src/content/flags.ts) — first set
        // here, not per Q02's own persistent state, per the naming
        // correction recorded in docs/phase13-q02-source-recovered.md.
        gameRuntime.flagStore.set(ENTITY_RESOLUTION_FLAGS.adrianSuspicious, true);
        gameRuntime.flagStore.set(ENTITY_RESOLUTION_FLAGS.adrianWarnedPlayer, true);

        const completed = gameRuntime.quest.complete(Q03_MISSING_LOGS);
        console.log("[Q03 DIAG] gameRuntime.quest.complete returned:", completed);

        if (!completed) {
            console.log("[Q03 DIAG] THROWING: completion diverged.");
            throw new Error(
                "Q03 HackHub completion diverged from canonical runtime completion.",
            );
        }

        gameRuntime.reward.claim({
            id: asId<"Reward">("entity_resolution.q03.xp.investigate-server-history"),
            kind: "experience",
            amount: Q03_REWARDS.investigateServerHistory,
        });

        gameRuntime.reward.claim({
            id: asId<"Reward">("entity_resolution.q03.xp.check-file-timestamp"),
            kind: "experience",
            amount: Q03_REWARDS.checkFileTimestamp,
        });

        gameRuntime.reward.claim({
            id: asId<"Reward">("entity_resolution.q03.xp.review-boot-history"),
            kind: "experience",
            amount: Q03_REWARDS.reviewBootHistory,
        });

        gameRuntime.reward.claim({
            id: asId<"Reward">("entity_resolution.q03.xp.identify-log-gaps"),
            kind: "experience",
            amount: Q03_REWARDS.identifyLogGaps,
        });

        gameRuntime.reward.claim({
            id: asId<"Reward">("entity_resolution.q03.xp.correlate-missing-records"),
            kind: "experience",
            amount: Q03_REWARDS.correlateMissingRecords,
        });

        if (this.Data.backupChecked) {
            gameRuntime.reward.claim({
                id: asId<"Reward">("entity_resolution.q03.xp.check-backup-archive"),
                kind: "experience",
                amount: Q03_REWARDS.checkBackupArchive,
            });

            gameRuntime.reward.claim({
                id: asId<"Reward">("entity_resolution.q03.xp.identify-cri-policy"),
                kind: "experience",
                amount: Q03_REWARDS.identifyCriPolicy,
            });
        }

        const moneyGranted = gameRuntime.economy.applyMissionReward(
            {
                id: asId<"MissionReward">("entity_resolution.q03.money"),
                questId: "entity_resolution.q03",
                amount: Q03_REWARDS.money,
                rewardIndex: 0,
            },
            Q03_FINAL_STATE_FLAG,
        );

        if (moneyGranted) {
            Bank.transaction({
                amount: Q03_REWARDS.money,
                description: Q03_REPORT_SUBJECT,
                from: {
                    IBAN: "ID00SKYNETLOGISTICS",
                    name: Q03_CLIENT_NAME,
                },
            });
        }

        sendAdrianMail(`Re: ${Q03_REPORT_SUBJECT}`, Q03_COMPLETION_MAIL_CONTENT_PRODUCTION);
        resetQ03ShellFixtures();
        Network.removeDomain(Q03_WEB_HOST);
        // destroyNetwork takes the ROUTER's ip (removes the whole hierarchy
        // including its child at this.Data.targetIp) — not the child's ip.
        Network.destroyNetwork(Q03_ROUTER_IP);
        gameRuntime.persistence.save();
    }

    override OnAbandon() {
        resetQ03ShellFixtures();
        Network.removeDomain(Q03_WEB_HOST);
        // destroyNetwork takes the ROUTER's ip (removes the whole hierarchy
        // including its child at this.Data.targetIp) — not the child's ip.
        Network.destroyNetwork(Q03_ROUTER_IP);
    }

    private handleSshConnected(ip: string): void {
        // Terminal.SSH.Connected's payload is a plain IP string, not an
        // object — the SDK's SSHConnectedEvent interface is @deprecated for
        // exactly this reason. Do not destructure it.
        if (ip !== this.Data.targetIp || this.Data.connected) {
            return;
        }

        this.SetData("connected", true);
        this.completeObjective(Q03_OBJECTIVE_IDS.accessHost);
    }

    private handleTerminalHydra(data: HydraResultData): void {
        if (
            data.ip !== this.Data.targetIp ||
            data.credentials?.username !== Q03_SSH_USERNAME ||
            data.credentials?.password !== Q03_SSH_PASSWORD
        ) {
            return;
        }

        console.log("[entity_resolution.q03] Terminal.Hydra matched Q03's credentials.");
    }

    private handleTerminalLs(data: TerminalLsData): void {
        if (this.Data.gapInvestigated) {
            return;
        }

        // Confirmed live 2026-09-15: `Terminal.Ls` fires ONCE per `ls`
        // invocation, and `data.name` is the LISTED FOLDER's own name, not
        // any child item — both `/var/log/gateway/` and
        // `/var/backups/gateway/` reported `data.name === "gateway"`
        // (with different `data.id`s), so name-based matching (whether
        // `=== "gateway"` or a child-filename-style `startsWith`) cannot
        // tell the two apart on its own. `Files.getById` is ID-based, so —
        // unlike `Files.resolvePath`/`getByPath` — it works correctly from
        // any context, not just from inside a running custom command (see
        // the `Files` namespace doc comment). Walk one level up via
        // `FileInfo.parent` and check the PARENT folder's name instead.
        const listedFolder = Files.getById(data.id);

        if (listedFolder?.name.toLowerCase() !== "gateway" || !listedFolder.parent) {
            return;
        }

        const parentFolder = Files.getById(listedFolder.parent);

        if (parentFolder?.name.toLowerCase() !== "log") {
            return;
        }

        this.SetData("gapInvestigated", true);
        this.completeObjective(Q03_OBJECTIVE_IDS.checkGatewayLogs);
    }

    private handleTerminalCat(data: TerminalCatData): void {
        const fileName = data.extension ? `${data.name}.${data.extension}` : data.name;
        this.handleLogOrBackupRead(fileName);
    }

    private handleLogOrBackupRead(fileName: string): void {
        const normalized = fileName.toLowerCase();

        if (!this.Data.logsChecked && normalized.includes("access.log")) {
            this.SetData("logsChecked", true);
            this.completeObjective(Q03_OBJECTIVE_IDS.checkLogs);
        }

        if (!this.Data.backupChecked && normalized.includes("gateway-2026")) {
            this.SetData("backupChecked", true);
            this.completeObjective(Q03_OBJECTIVE_IDS.checkBackup);
        }
    }

    private handleTerminalCommand(data: TerminalCommandData): void {
        // Deliberately NOT also handling `cat` here. Confirmed live
        // 2026-09-15: `Terminal.Command` fires for the typed command text
        // regardless of whether the read actually succeeded — a player
        // typing `cat gateway-2026-08-27.tar.txt` from the wrong cwd (a
        // real "File not found." on screen) still completed the objective,
        // because the match was against the raw argument string, not
        // against a confirmed successful read. `Terminal.Cat` (handled in
        // handleTerminalCat below) only fires with real file data, so it's
        // the sole source of truth here — matches the same reasoning
        // finding 6 in docs/phase13-q03-source-recovered.md already
        // established for reading remote files inside custom commands.
        // `ls` is handled the same way — solely via handleTerminalLs
        // (Terminal.Ls), not by matching the raw typed path here.
        if (data.command === "filestat") {
            if (!this.Data.filestatRun && includesArgMatching(data.args, "access.log")) {
                this.SetData("filestatRun", true);
                this.completeObjective(Q03_OBJECTIVE_IDS.checkTimestamp);
            }

            return;
        }

        if (data.command === "bootlog") {
            if (!this.Data.bootlogRun && includesArgMatching(data.args, "--list-boots")) {
                this.SetData("bootlogRun", true);
                this.completeObjective(Q03_OBJECTIVE_IDS.reviewBootHistory);
            }

            return;
        }
    }

    private handleMailSent(subject: string, content: string): void {
        console.log(
            "[Q03 DIAG] Mail.Sent fired. subject=",
            JSON.stringify(subject),
            "content=",
            JSON.stringify(content).slice(0, 500),
            "reportSubmitted=",
            this.Data.reportSubmitted,
            "isFindingsReport=",
            this.isFindingsReport(subject, content),
        );

        if (!this.isFindingsReport(subject, content) || this.Data.reportSubmitted) {
            return;
        }

        this.SetData("reportSubmitted", true);
        gameRuntime.flagStore.set(ENTITY_RESOLUTION_FLAGS.adrianSuspicious, true);

        console.log("[Q03 DIAG] handleMailSent: starting dialog, backupChecked=", this.Data.backupChecked);

        const startBranch = this.Data.backupChecked ? "postReportMainWithBackup" : "postReportMain";

        try {
            this.createDialog(startBranch);
            console.log(`[Q03 DIAG] createDialog('${startBranch}') returned without throwing.`);
        } catch (error) {
            console.log("[Q03 DIAG] CAUGHT ERROR in dialog setup:", String(error));
            console.log("[Q03 DIAG] error stack:", error instanceof Error ? error.stack : "no stack");
        }

        // No reliable "the call actually ended" signal exists (see
        // `Dialog`'s Proxy tap below — it only reveals `createDialog()`'s
        // own eager upfront graph read, not real playback progress), so
        // this fixed delay from call-start is the only viable trigger.
        this.finishReportFindings();
    }

    private finishReportFindings(): void {
        console.log("[Q03 DIAG] finishReportFindings: scheduling completeObjective.");

        setTimeout(() => {
            console.log("[Q03 DIAG] finishReportFindings: calling completeObjective(reportFindings) now.");
            this.completeObjective(Q03_OBJECTIVE_IDS.reportFindings);
        }, Q03_COMPLETION_DELAY_MS);
    }

    private isFindingsReport(subject: string, content: string): boolean {
        if (this.isTemplateFindingsReport(subject, content)) {
            return true;
        }

        const normalizedSubject = subject.trim().toLowerCase();
        const normalizedContent = content.trim();

        const subjectMatches =
            normalizedSubject === Q03_REPORT_SUBJECT.toLowerCase() ||
            normalizedSubject === `re: ${Q03_REPORT_SUBJECT}`.toLowerCase();

        return subjectMatches && normalizedContent === Q03_REPORT_BODY;
    }

    private isTemplateFindingsReport(subject: string, content: string): boolean {
        if (subject !== Q03_REPORT_TEMPLATE_ID) {
            return false;
        }

        let fields: unknown;

        try {
            fields = JSON.parse(content);
        } catch {
            return false;
        }

        if (!fields || typeof fields !== "object") {
            return false;
        }

        const { lastActivity, logsStart, missingRotations } = fields as Record<string, unknown>;

        // Neither date nor the rotation list has one natural free-text
        // format ("Sep 8" vs "sep 08" vs "September 08"; "5, 6" vs "5,6" vs
        // "5 and 6" vs "6, 5") — compare normalized forms instead of the raw
        // string. See q03-log-tools.ts's monthDayMatches/numberSetsMatch.
        return (
            typeof lastActivity === "string" &&
            monthDayMatches(lastActivity, Q03_LAST_ACTIVITY_DATE) &&
            typeof logsStart === "string" &&
            monthDayMatches(logsStart, Q03_LOGS_START_DATE) &&
            typeof missingRotations === "string" &&
            numberSetsMatch(missingRotations, Q03_MISSING_ROTATIONS)
        );
    }
}
