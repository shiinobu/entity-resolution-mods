export interface CanonicalCharacterEmail {
    readonly id: string;
    readonly name: string;
    readonly email: string;
}

export const ADRIAN_COLE: CanonicalCharacterEmail = {
    id: "character.adrian.cole",
    name: "Adrian Cole",
    email: "adrian.cole@phantom-net.void",
};

// SKELETON — introduced Q05. TODO: confirm email once Q05 is implemented.
export const MAYA_HART: CanonicalCharacterEmail = {
    id: "character.maya.hart",
    name: "Maya Hart",
    email: "maya.hart@phantom-net.void",
};

// Introduced Q07. Surname "Ward" confirmed via direct quest-card quotes in
// the design doc's Q10/Q11/Q15/Q16 LOCKED sections ("Daniel Ward"). TODO:
// email placeholder until Q07 is implemented.
export const DANIEL: CanonicalCharacterEmail = {
    id: "character.daniel.ward",
    name: "Daniel Ward",
    email: "daniel.ward@phantom-net.void",
};

// SKELETON — introduced Q14. TODO: confirm email once Q14 is implemented.
export const MARCUS_REED: CanonicalCharacterEmail = {
    id: "character.marcus.reed",
    name: "Marcus Reed",
    email: "marcus.reed@phantom-net.void",
};

// Introduced Q16. Surname "Hale" confirmed via the design doc's Q13/Q16
// LOCKED sections ("Victor Hale's involvement", "Supporting: ... Victor
// Hale"). TODO: email placeholder until Q16 is implemented.
export const VICTOR: CanonicalCharacterEmail = {
    id: "character.victor.hale",
    name: "Victor Hale",
    email: "victor.hale@phantom-net.void",
};

// Confirmed real in Phase 8 (the authoritative source — supersedes an
// earlier Phase 6 "underutilized" note): role is "aggregate/public data ->
// statistical analysis -> Elena -> anomaly evidence"; she works from public
// data only, never restricted data ("Elena Integration", audit status
// RESOLVED). No single quest number is given in the source for her — she's
// an optional, evidence-triggered contact (player reaches her via
// Maya/Daniel references after finding qualifying evidence), most likely
// relevant somewhere in the Q12-Q15 evidence-heavy range, but this is not
// pinned to one quest in the source. TODO: confirm exact quest/trigger and
// email once that quest is implemented.
export const ELENA_BROOKS: CanonicalCharacterEmail = {
    id: "character.elena.brooks",
    name: "Elena Brooks",
    email: "elena.brooks@phantom-net.void",
};

export const CANONICAL_CHARACTER_EMAILS = {
    adrianCole: ADRIAN_COLE.email,
    mayaHart: MAYA_HART.email,
    daniel: DANIEL.email,
    marcusReed: MARCUS_REED.email,
    victor: VICTOR.email,
    elenaBrooks: ELENA_BROOKS.email,
} as const;
