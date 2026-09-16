import test from "node:test";
import assert from "node:assert/strict";

import type {
    Investigation,
    InvestigationLead,
    InvestigationState,
} from "../../src/domain/index.js";

import type {
    DomainState,
} from "../../src/state/index.js";

import {
    createDefaultRuntimeState,
} from "../../src/state/index.js";

import {
    asId,
} from "../../src/core/index.js";

test("Investigation supports typed leads", () => {
    const investigationId = asId<"Investigation">("investigation.test");

    const lead: InvestigationLead = {
        id: "lead.test",
        investigationId,
        title: "Test Lead",
        description: "A test investigation lead.",
    };

    const investigation: Investigation = {
        id: investigationId,
        chapterId: "chapter.test",
        title: "Test Investigation",
        description: "A test investigation.",
        leadIds: [lead.id],
    };

    assert.equal(investigation.id, investigationId);
    assert.deepEqual(investigation.leadIds, [lead.id]);
});

test("default runtime state contains an empty InvestigationState", () => {
    const state = createDefaultRuntimeState();

    assert.deepEqual(
        state.domain.investigation,
        {
            activeInvestigationId: null,
            discoveredLeadIds: [],
            completedInvestigationIds: [],
        },
    );
});

test("InvestigationState is part of canonical DomainState", () => {
    const state = createDefaultRuntimeState();
    const investigation: InvestigationState = state.domain.investigation;

    const domain: DomainState = {
        ...state.domain,
        investigation,
    };

    assert.equal(
        domain.investigation,
        investigation,
    );
});
