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

export const MAYA_HART: CanonicalCharacterEmail = {
    id: "character.maya.hart",
    name: "Maya Hart",
    email: "maya.hart@phantom-net.void",
};

export const DANIEL_WARD: CanonicalCharacterEmail = {
    id: "character.daniel.ward",
    name: "Daniel Ward",
    email: "daniel.ward@phantom-net.void",
};

export const MARCUS_REED: CanonicalCharacterEmail = {
    id: "character.marcus.reed",
    name: "Marcus Reed",
    email: "marcus.reed@phantom-net.void",
};

export const VICTOR_HALE: CanonicalCharacterEmail = {
    id: "character.victor.hale",
    name: "Victor Hale",
    email: "victor.hale@phantom-net.void",
};

export const ELENA_BROOKS: CanonicalCharacterEmail = {
    id: "character.elena.brooks",
    name: "Elena Brooks",
    email: "elena.brooks@phantom-net.void",
};

export const UNKNOWN: CanonicalCharacterEmail = {
    id: "character.unknown",
    name: "Unknown",
    email: "unknown@unknown.x",
};

export const CANONICAL_CHARACTER_EMAILS = {
    adrianCole: ADRIAN_COLE.email,
    mayaHart: MAYA_HART.email,
    daniel: DANIEL_WARD.email,
    marcusReed: MARCUS_REED.email,
    victor: VICTOR_HALE.email,
    elenaBrooks: ELENA_BROOKS.email,
    unknown: UNKNOWN.email,
} as const;
