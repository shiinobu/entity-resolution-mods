import assert from "node:assert/strict";
import test from "node:test";

import {
    AccessService,
    GameRuntime,
} from "../../src/application/index.js";

import {
    asId,
} from "../../src/core/index.js";

import {
    createDefaultRuntimeState,
    DomainStateAccess,
    StateStore,
} from "../../src/state/index.js";

test("AccessService grants a capability to an actor", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const service = new AccessService(
        new DomainStateAccess(stateStore),
    );

    const actorId = asId<"Character">(
        "marcus-reed",
    );

    const grantId = asId<"AccessGrant">(
        "grant-override-operator",
    );

    service.grant({
        id: grantId,
        actorId,
        capability: "OVERRIDE_OPERATOR",
    });

    assert.equal(
        service.hasCapability(
            actorId,
            "OVERRIDE_OPERATOR",
        ),
        true,
    );
});

test("AccessService does not grant a capability to another actor", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const service = new AccessService(
        new DomainStateAccess(stateStore),
    );

    const marcusId = asId<"Character">(
        "marcus-reed",
    );

    const otherActorId = asId<"Character">(
        "other-actor",
    );

    service.grant({
        id: asId<"AccessGrant">(
            "grant-override-operator",
        ),
        actorId: marcusId,
        capability: "OVERRIDE_OPERATOR",
    });

    assert.equal(
        service.hasCapability(
            marcusId,
            "OVERRIDE_OPERATOR",
        ),
        true,
    );

    assert.equal(
        service.hasCapability(
            otherActorId,
            "OVERRIDE_OPERATOR",
        ),
        false,
    );
});

test("AccessService can revoke a grant", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const service = new AccessService(
        new DomainStateAccess(stateStore),
    );

    const actorId = asId<"Character">(
        "marcus-reed",
    );

    const grantId = asId<"AccessGrant">(
        "grant-override-operator",
    );

    service.grant({
        id: grantId,
        actorId,
        capability: "OVERRIDE_OPERATOR",
    });

    assert.equal(
        service.hasCapability(
            actorId,
            "OVERRIDE_OPERATOR",
        ),
        true,
    );

    service.revoke(grantId);

    assert.equal(
        service.hasCapability(
            actorId,
            "OVERRIDE_OPERATOR",
        ),
        false,
    );
});

test("AccessService stores grants in canonical StateStore", () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const service = new AccessService(
        new DomainStateAccess(stateStore),
    );

    const actorId = asId<"Character">(
        "marcus-reed",
    );

    const grantId = asId<"AccessGrant">(
        "grant-override-operator",
    );

    service.grant({
        id: grantId,
        actorId,
        capability: "OVERRIDE_OPERATOR",
    });

    const accessState =
        stateStore.getState().domain.access;

    assert.equal(
        accessState.grants[grantId]?.capability,
        "OVERRIDE_OPERATOR",
    );
});

test("GameRuntime owns the AccessService", () => {
    const runtime = new GameRuntime();

    assert.equal(
        runtime.access instanceof AccessService,
        true,
    );
});