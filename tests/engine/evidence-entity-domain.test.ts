import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
    Entity,
    EntityState,
    Evidence,
    EvidenceState,
} from "../../src/domain/index.js";

import { asId } from "../../src/core/index.js";
import { createDefaultRuntimeState } from "../../src/state/index.js";

describe("Evidence & Entity domain", () => {
    it("supports typed evidence definitions", () => {
        const evidence: Evidence = {
            id: asId<"Evidence">("evidence-001"),
            kind: "log",
            title: "Access Log",
            description: "A suspicious access log.",
        };

        assert.equal(evidence.id, "evidence-001");
        assert.equal(evidence.kind, "log");
    });

    it("supports typed evidence state", () => {
        const state: EvidenceState = {
            discoveredEvidenceIds: [
                asId<"Evidence">("evidence-001"),
            ],
        };

        assert.deepEqual(
            state.discoveredEvidenceIds,
            ["evidence-001"],
        );
    });

    it("supports typed entity definitions", () => {
        const entity: Entity = {
            id: asId<"Entity">("entity-001"),
            kind: "person",
            name: "Marcus Reed",
            description: "An unknown operator.",
        };

        assert.equal(entity.id, "entity-001");
        assert.equal(entity.kind, "person");
    });

    it("supports typed entity state", () => {
        const state: EntityState = {
            discoveredEntityIds: [
                asId<"Entity">("entity-001"),
            ],
        };

        assert.deepEqual(
            state.discoveredEntityIds,
            ["entity-001"],
        );
    });

    it("includes evidence and entity in canonical domain state", () => {
        const state = createDefaultRuntimeState();

        assert.deepEqual(state.domain.evidence, {
            discoveredEvidenceIds: [],
        });

        assert.deepEqual(state.domain.entity, {
            discoveredEntityIds: [],
        });
    });
});