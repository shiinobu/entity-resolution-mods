// SKELETON — see docs/source-current.md. Mail, dialogue,
// HackhubPost, network fixtures NOT YET WRITTEN.

import { asId } from "../core/index.js";
import { flagEquals } from "../domain/shared/index.js";
import type { Quest } from "../domain/quest/index.js";

// Sourced directly (not invented): the design doc's fuller narrative draft
// ("# 15. Staging Discovery") states "staging.nusantarapay.id ... resolves
// to another ARKA-managed host ... 203.0.113.87" — consistent with the more
// authoritative Phase 8 "Technical Interaction" section, which names the
// same host (staging.nusantarapay.id -> Operations Classification Console
// -> restricted classification endpoints) without repeating the IP.
//
// Contradiction noted, NOT used: an earlier/discarded draft pass in the same
// file names a DIFFERENT host, `portal.nusantarapay.id` -> `198.51.100.27`
// (443/tcp HTTPS), framed as the client's own public portal (a separate,
// non-technical "review the client" beat). The Phase 8 spec — the same
// source tier already used for this quest's objective list — only ever
// names `staging.nusantarapay.id`, so that's what's implemented here; the
// public-portal host is left out rather than silently merged in.
export const Q05_TARGET_IP = "203.0.113.87";
export const Q05_WEB_HOST = "staging.nusantarapay.id";

// No explicit port is stated for this host in the source. Inferred
// HTTPS-only (443) from context ("login page", "not publicly linked",
// private staging environment) — consistent with this project's port-80-
// absent-closes convention (docs/implementation-rules.md §6).
// Revisit if a later pass finds an explicit port.
export const Q05_NETWORK_PORTS = [
    { external: 443, internal: 443, active: true, service: "https" },
];

export interface Q05NmapPort {
    readonly port: number;
    readonly status: "OPEN" | "CLOSE";
    readonly service: string;
}

export const Q05_NMAP_RESULT: Q05NmapPort[] = [{ port: 443, status: "OPEN", service: "https" }];

export const Q05_OBJECTIVE_IDS = {
    reviewScope: "q05.objective.01",
    inspectApiSurface: "q05.objective.02",
    identifyClassificationEndpoints: "q05.objective.03",
    inspectStagingEnvironment: "q05.objective.04",
    enumerateApi: "q05.objective.04b", // optional
} as const;

export const Q05_OBJECTIVES = [
    { name: Q05_OBJECTIVE_IDS.reviewScope, description: "Review assessment scope" },
    {
        name: Q05_OBJECTIVE_IDS.inspectApiSurface,
        description: "Inspect the external API surface", // tool: dirhunter (native)
        unlocksAfter: [Q05_OBJECTIVE_IDS.reviewScope],
    },
    {
        name: Q05_OBJECTIVE_IDS.identifyClassificationEndpoints,
        description: "Identify classification-related endpoints", // tool: dirhunter (native)
        unlocksAfter: [Q05_OBJECTIVE_IDS.inspectApiSurface],
    },
    {
        name: Q05_OBJECTIVE_IDS.inspectStagingEnvironment,
        description: "Inspect the staging Operations Classification Console", // tool: lynx (native)
        unlocksAfter: [Q05_OBJECTIVE_IDS.identifyClassificationEndpoints],
    },
    {
        name: Q05_OBJECTIVE_IDS.enumerateApi,
        description: "Enumerate the full set of restricted classification endpoints", // tool: dirhunter (native)
        unlocksAfter: [Q05_OBJECTIVE_IDS.inspectStagingEnvironment],
    },
];

export const Q05_REPLAY_OBJECTIVES = Q05_OBJECTIVES.map(
    ({ unlocksAfter: _unlocksAfter, ...objective }) => objective,
);

// XP breakdown per the design doc, best-effort mapped to objectives (source
// gives 7 XP items against 5 objectives — not objective-keyed).
export const Q05_REWARDS = {
    auditReview: 20, // reviewScope
    mayaPublicReportCorrelation: 10, // reviewScope (narrative, no dedicated objective)
    arkaPatternRecognition: 15, // inspectApiSurface
    classificationApiIdentification: 20, // identifyClassificationEndpoints
    internalEndpointDiscovery: 15, // identifyClassificationEndpoints
    recognizePatternWithoutClaimingProof: 10, // inspectStagingEnvironment
    apiEnumeration: 10, // enumerateApi
    money: 400,
} as const;

export const Q05_FINAL_STATE_FLAG = "entity_resolution.q05.completed";
export const Q05_ARKA_INFRASTRUCTURE_FOUND_FLAG = "entity_resolution.q05.arka_infrastructure_found";
export const Q05_CLASSIFICATION_API_FOUND_FLAG = "entity_resolution.q05.classification_api_found";
export const Q05_API_ENUMERATED_FLAG = "entity_resolution.q05.api_enumerated";
export const Q05_MAYA_CONTACTED_FLAG = "entity_resolution.q05.maya_contacted";
export const Q05_MAYA_REPLIED_FLAG = "entity_resolution.q05.maya_replied";

// Campaign-wide flags: TODO (new, not yet in flags.ts) — adrian_knows_pattern.

// Mail content — sourced from the design doc's Q05 detail section ("Opening"
// / "Contract" / consistency-audit "Final version" Maya mail / "Q05 Ending").
// An earlier draft's contract target ("portal.nusantarapay.id") is adapted
// to the already-locked Q05_WEB_HOST per the contradiction noted above this
// file's network constants.

export const Q05_INCOMING_MAIL_SUBJECT = "New job";
export const Q05_INCOMING_MAIL_CONTENT = [
    "Got another job for you.",
    "",
    "Different client.",
    "",
    "Similar infrastructure.",
    "",
    "Same provider. ARKA.",
    "",
    "— Adrian",
].join("\n");

export const Q05_CONTRACT_SUBJECT = "Security Assessment — Nusantara Pay";
export const Q05_CONTRACT_CONTENT = [
    "External infrastructure assessment.",
    "",
    `Target: ${Q05_WEB_HOST}`,
    "",
    "Allowed:",
    "- Service discovery",
    "- Basic vulnerability scanning",
    "- Web application enumeration",
    "",
    "Not allowed:",
    "- Credential attacks",
    "- Data extraction",
    "- Privilege escalation",
].join("\n");

// Maya's first contact — sourced verbatim from the source's marked "Final
// version" (a consistency-audit revision that explicitly shortened an
// earlier, more expository draft — this is the one to use).
export const Q05_MAYA_CONTACT_SUBJECT = "Question about Nusantara Pay";
export const Q05_MAYA_CONTACT_CONTENT = [
    "Hi.",
    "",
    "I'm looking into several cases involving unexpected financial reviews.",
    "",
    "Your name came up as someone who worked on a security assessment involving Nusantara Pay.",
    "",
    "I don't need client data.",
    "",
    "I just want to know whether you noticed anything unusual.",
    "",
    "— Maya Hart",
].join("\n");

// Player reply option (source gives the prompt text, framed as optional —
// the player may also ignore Maya's mail entirely and she may follow up in
// Q06 depending on story state).
export const Q05_MAYA_REPLY_CONTENT = "What exactly are you investigating?";

// No report-template/dual-path pattern found for Q05 in this pass — the
// source references "after the player sends a report to Adrian" (§10 "Q05
// Ending") but never gives the report's own literal body text. TODO: report
// body content not yet sourced.

// CORRECTION (relay-extraction pass): Adrian's post-report reaction is
// explicitly labeled "Relay" in the source (design doc's story bible: Relay
// is a distinct **private messaging system**, "should feel more immediate
// and personal than Email" — separate from the phone-call `Dialog` mechanic
// Q03 uses, which maps to the story's separate "Phone" system). No native
// Relay SDK primitive exists, so per this project's Q01 precedent (Relay ->
// Mail substitution, see docs/implementation-rules.md §0),
// this is Mail-adjacent content, not Dialog territory.
// Sourced verbatim, consistent across two draft passes (source lines
// ~10517 and ~11042, the second a minor reinforcement of the same text).
// TODO: exact delivery mechanism (one Mail.send per line vs. a single
// transcript-style mail) not yet decided — content captured either way.
export const Q05_RELAY_POST_REPORT_CONTENT = [
    "Adrian: Don't access it.",
    "",
    "Player: I wasn't planning to.",
    "",
    "Adrian: Good.",
    "",
    "Adrian: I'll handle this one.",
].join("\n");

// No HackhubPost teaser text found in the source for Q05 — TODO.

// Pulse (public social-feed system) — sourced from Phase 6 "Pulse —
// Integrated" §Q05. No native `Pulse` SDK primitive exists (checked
// node_modules/@hotbunny/hackhub-content-sdk/index.d.ts); the closest real
// mapping is `Twotter` (a public feed — unlike `Kisscord`, which is private
// 1:1 chat), same adapter-pattern precedent as Q01's "Relay" -> `Mail`
// substitution (see docs/implementation-rules.md §0). Optional
// evidence only — no CRI reveal, just shows the problem
// isn't a single isolated case.
export const Q05_PULSE_POST_CONTENT = [
    "several users mention unexpected financial reviews",
    "no one knows why",
].join("\n");

export const Q05_SECOND_CLIENT: Quest = {
    id: asId<"Quest">("entity_resolution.q05"),
    // Chapter 2 title ("THE LIST") not yet naming-adapted — see design doc.
    chapterId: "chapter-02-the-list",
    title: "SECOND CLIENT",
    description:
        "A new client engagement surfaces a restricted classification API and introduces Maya.",
    objectives: [
        {
            id: "q05.runtime.completion",
            description: "Q05 canonical completion boundary.",
            condition: flagEquals(Q05_FINAL_STATE_FLAG, true),
        },
    ],
};
