import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
    HackAttempt,
    HackingState,
} from "../../src/domain/index.js";

import { asId } from "../../src/core/index.js";
import { createDefaultRuntimeState } from "../../src/state/index.js";

describe("Hacking domain", () => {
    it("supports a terminal hack attempt", () => {
        const attempt: HackAttempt = {
            id: asId<"HackAttempt">("hack-001"),
            target: {
                kind: "terminal",
                id: asId<"Terminal">("terminal-001"),
            },
            status: "success",
        };

        assert.equal(attempt.id, "hack-001");
        assert.equal(attempt.target.kind, "terminal");
        assert.equal(attempt.target.id, "terminal-001");
        assert.equal(attempt.status, "success");
    });

    it("supports a database hack attempt", () => {
        const attempt: HackAttempt = {
            id: asId<"HackAttempt">("hack-002"),
            target: {
                kind: "database",
                id: asId<"Database">("database-001"),
            },
            status: "failure",
        };

        assert.equal(attempt.target.kind, "database");
        assert.equal(attempt.target.id, "database-001");
        assert.equal(attempt.status, "failure");
    });

    it("supports typed hacking state", () => {
        const state: HackingState = {
            activeAttemptId: asId<"HackAttempt">("hack-001"),
            completedAttemptIds: [],
        };

        assert.equal(
            state.activeAttemptId,
            "hack-001",
        );
    });

    it("supports completed hacking attempts", () => {
        const state: HackingState = {
            activeAttemptId: null,
            completedAttemptIds: [
                asId<"HackAttempt">("hack-001"),
            ],
        };

        assert.deepEqual(
            state.completedAttemptIds,
            ["hack-001"],
        );
    });

    it("includes hacking in canonical domain state", () => {
        const state = createDefaultRuntimeState();

        assert.deepEqual(state.domain.hacking, {
            activeAttemptId: null,
            completedAttemptIds: [],
        });
    });
});