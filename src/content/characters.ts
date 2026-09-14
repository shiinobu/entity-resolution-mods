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

export const CANONICAL_CHARACTER_EMAILS = {
    adrianCole: ADRIAN_COLE.email,
} as const;
