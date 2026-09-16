import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type {
    Database,
    DatabaseState,
    Terminal,
    TerminalState,
} from "../../src/domain/index.js";

import { asId } from "../../src/core/index.js";
import { createDefaultRuntimeState } from "../../src/state/index.js";

describe("Terminal & Database domain", () => {
    it("supports typed terminal definitions", () => {
        const terminal: Terminal = {
            id: asId<"Terminal">("terminal-001"),
            kind: "workstation",
            name: "Research Workstation",
            description: "A workstation connected to the network.",
        };

        assert.equal(terminal.id, "terminal-001");
        assert.equal(terminal.kind, "workstation");
    });

    it("supports typed terminal state", () => {
        const state: TerminalState = {
            discoveredTerminalIds: [
                asId<"Terminal">("terminal-001"),
            ],
        };

        assert.deepEqual(
            state.discoveredTerminalIds,
            ["terminal-001"],
        );
    });

    it("supports typed database definitions", () => {
        const database: Database = {
            id: asId<"Database">("database-001"),
            kind: "communication",
            name: "Communication Database",
            description: "A database containing communication records.",
        };

        assert.equal(database.id, "database-001");
        assert.equal(database.kind, "communication");
    });

    it("supports typed database state", () => {
        const state: DatabaseState = {
            discoveredDatabaseIds: [
                asId<"Database">("database-001"),
            ],
        };

        assert.deepEqual(
            state.discoveredDatabaseIds,
            ["database-001"],
        );
    });

    it("includes terminal and database in canonical domain state", () => {
        const state = createDefaultRuntimeState();

        assert.deepEqual(state.domain.terminal, {
            discoveredTerminalIds: [],
        });

        assert.deepEqual(state.domain.database, {
            discoveredDatabaseIds: [],
        });
    });
});