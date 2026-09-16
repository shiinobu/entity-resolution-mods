import test from "node:test";
import assert from "node:assert/strict";

import {
    createDefaultRuntimeState,
    FlagStore,
    StateStore,
    DomainStateAccess,
} from "../../src/state/index.js";

import {
    asId,
} from "../../src/core/index.js";

test("StateStore owns the canonical runtime state", () => {
    const initialState = createDefaultRuntimeState();
    const stateStore = new StateStore(initialState);

    assert.deepEqual(
        stateStore.getState().flags,
        {},
    );

    assert.deepEqual(
        stateStore.getState().domain.quests,
        {
            activeQuestId: null,
            completedQuestIds: [],
            failedQuestIds: [],
        },
    );

    assert.deepEqual(
        stateStore.getState().domain.evidence,
        {
            discoveredEvidenceIds: [],
        },
    );

    assert.deepEqual(
        stateStore.getState().domain.ending,
        {
            endingId: null,
            resolved: false,
        },
    );
});

test("FlagStore reads and writes through StateStore", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const flagStore = new FlagStore(stateStore);

    flagStore.set("mission_started", true);

    assert.equal(
        flagStore.get<boolean>("mission_started"),
        true,
    );

    assert.equal(
        stateStore.getState().flags.mission_started,
        true,
    );
});

test("FlagStore does not lose existing flags when setting another flag", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const flagStore = new FlagStore(stateStore);

    flagStore.set("mission_started", true);
    flagStore.set("evidence_found", 3);

    assert.deepEqual(
        stateStore.getState().flags,
        {
            mission_started: true,
            evidence_found: 3,
        },
    );
});

test("FlagStore can delete a flag", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const flagStore = new FlagStore(stateStore);

    flagStore.set("mission_started", true);

    assert.equal(
        flagStore.has("mission_started"),
        true,
    );

    flagStore.delete("mission_started");

    assert.equal(
        flagStore.has("mission_started"),
        false,
    );
});

test("FlagStore clear removes all flags", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const flagStore = new FlagStore(stateStore);

    flagStore.set("mission_started", true);
    flagStore.set("evidence_found", 3);

    flagStore.clear();

    assert.deepEqual(
        stateStore.getState().flags,
        {},
    );
});

test("StateStore updateState replaces state atomically", () => {
    const stateStore = new StateStore(createDefaultRuntimeState());

    const previousState = stateStore.getState();

    stateStore.updateState((current) => ({
        ...current,
        flags: {
            ...current.flags,
            testFlag: true,
        },
    }));

    assert.deepEqual(previousState, createDefaultRuntimeState());

    assert.deepEqual(stateStore.getState().flags, {
        testFlag: true,
    });
});

test("default runtime states are independent", () => {
    const first = createDefaultRuntimeState();
    const second = createDefaultRuntimeState();

    assert.notEqual(first, second);
    assert.notEqual(first.flags, second.flags);
    assert.notEqual(first.domain, second.domain);
    assert.notEqual(first.domain.quests, second.domain.quests);
    assert.notEqual(first.domain.evidence, second.domain.evidence);
});

test("DomainStateAccess reads canonical domain state", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const domainAccess = new DomainStateAccess(stateStore);

    assert.strictEqual(
        domainAccess.get(),
        stateStore.getState().domain,
    );
});

test("DomainStateAccess updates through StateStore", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const domainAccess = new DomainStateAccess(stateStore);

    domainAccess.update((current) => ({
        ...current,
        quests: {
            activeQuestId: asId<"Quest">("quest.test"),
            completedQuestIds: [],
            failedQuestIds: [],
        },
    }));

    assert.deepEqual(
        stateStore.getState().domain.quests,
        {
            activeQuestId: asId<"Quest">("quest.test"),
            completedQuestIds: [],
            failedQuestIds: [],
        },
    );
});

test("DomainStateAccess can replace the canonical domain state", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const domainAccess = new DomainStateAccess(stateStore);

    const replacement = {
        ...stateStore.getState().domain,
        ending: {
            endingId: "ending.test",
            resolved: true,
        },
    };

    domainAccess.replace(replacement);

    assert.strictEqual(
        stateStore.getState().domain,
        replacement,
    );
});
