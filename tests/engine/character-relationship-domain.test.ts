import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
    Character,
    CharacterState,
    Relationship,
    RelationshipState,
} from "../../src/domain/index.js";

import { asId } from "../../src/core/index.js";
import { createDefaultRuntimeState } from "../../src/state/index.js";

describe("Character & Relationship domain", () => {
    it("supports typed character definitions", () => {
        const character: Character = {
            id: asId<"Character">("character-001"),
            name: "Marcus Reed",
            description: "An unknown operator.",
        };

        assert.equal(character.id, "character-001");
        assert.equal(character.name, "Marcus Reed");
    });

    it("supports typed character state", () => {
        const state: CharacterState = {
            discoveredCharacterIds: [
                asId<"Character">("character-001"),
            ],
        };

        assert.deepEqual(
            state.discoveredCharacterIds,
            ["character-001"],
        );
    });

    it("supports typed relationship definitions", () => {
        const relationship: Relationship = {
            id: asId<"Relationship">("relationship-001"),
            sourceCharacterId: asId<"Character">("marcus"),
            targetCharacterId: asId<"Character">("adrian"),
            kind: "target",
            description: "Marcus is targeting Adrian.",
        };

        assert.equal(
            relationship.sourceCharacterId,
            "marcus",
        );

        assert.equal(
            relationship.targetCharacterId,
            "adrian",
        );

        assert.equal(
            relationship.kind,
            "target",
        );
    });

    it("supports typed relationship state", () => {
        const state: RelationshipState = {
            discoveredRelationshipIds: [
                asId<"Relationship">("relationship-001"),
            ],
        };

        assert.deepEqual(
            state.discoveredRelationshipIds,
            ["relationship-001"],
        );
    });

    it("includes character and relationship in canonical domain state", () => {
        const state = createDefaultRuntimeState();

        assert.deepEqual(state.domain.character, {
            discoveredCharacterIds: [],
        });

        assert.deepEqual(state.domain.relationships, {
            discoveredRelationshipIds: [],
        });
    });
});