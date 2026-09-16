import test from "node:test";
import assert from "node:assert/strict";

import {
    EndingService,
} from "../../src/application/ending-service.js";

import {
    GameRuntime,
} from "../../src/application/index.js";

import {
    ConditionEvaluator,
    flagEquals,
} from "../../src/domain/index.js";

import {
    createDefaultRuntimeState,
    DomainStateAccess,
    FlagStore,
    StateStore,
} from "../../src/state/index.js";

const createEndingService = () => {
    const stateStore =
        new StateStore(
            createDefaultRuntimeState(),
        );

    const domainState =
        new DomainStateAccess(
            stateStore,
        );

    const flagStore =
        new FlagStore(
            stateStore,
        );

    const conditionEvaluator =
        new ConditionEvaluator(
            flagStore,
        );

    const endingService =
        new EndingService(
            domainState,
            conditionEvaluator,
        );

    return {
        stateStore,
        domainState,
        flagStore,
        endingService,
    };
};

test(
    "EndingService resolves a matching ending",
    () => {
        const {
            endingService,
            flagStore,
        } = createEndingService();

        flagStore.set(
            "ending.signal",
            true,
        );

        const endingId =
            endingService.resolve([
                {
                    id: "ending.entity-resolution",
                    condition: flagEquals(
                        "ending.signal",
                        true,
                    ),
                },
            ]);

        assert.equal(
            endingId,
            "ending.entity-resolution",
        );

        assert.equal(
            endingService.isResolved(),
            true,
        );

        assert.equal(
            endingService.getEndingId(),
            "ending.entity-resolution",
        );
    },
);

test(
    "EndingService does not resolve when no condition matches",
    () => {
        const {
            endingService,
        } = createEndingService();

        const endingId =
            endingService.resolve([
                {
                    id: "ending.entity-resolution",
                    condition: flagEquals(
                        "ending.signal",
                        true,
                    ),
                },
            ]);

        assert.equal(
            endingId,
            null,
        );

        assert.equal(
            endingService.isResolved(),
            false,
        );
    },
);

test(
    "EndingService persists the resolved ending in canonical state",
    () => {
        const {
            stateStore,
            endingService,
            flagStore,
        } = createEndingService();

        flagStore.set(
            "ending.signal",
            true,
        );

        endingService.resolve([
            {
                id: "ending.entity-resolution",
                condition: flagEquals(
                    "ending.signal",
                    true,
                ),
            },
        ]);

        assert.deepEqual(
            stateStore
                .getState()
                .domain
                .ending,
            {
                endingId: "ending.entity-resolution",
                resolved: true,
            },
        );
    },
);

test(
    "EndingService does not replace an already resolved ending",
    () => {
        const {
            endingService,
            flagStore,
        } = createEndingService();

        flagStore.set(
            "ending.first",
            true,
        );

        const first =
            endingService.resolve([
                {
                    id: "ending.first",
                    condition: flagEquals(
                        "ending.first",
                        true,
                    ),
                },
            ]);

        flagStore.set(
            "ending.second",
            true,
        );

        const second =
            endingService.resolve([
                {
                    id: "ending.second",
                    condition: flagEquals(
                        "ending.second",
                        true,
                    ),
                },
            ]);

        assert.equal(
            first,
            "ending.first",
        );

        assert.equal(
            second,
            "ending.first",
        );
    },
);

test(
    "GameRuntime owns a functional EndingService",
    () => {
        const runtime =
            new GameRuntime();

        runtime.flagStore.set(
            "ending.signal",
            true,
        );

        const endingId =
            runtime.ending.resolve([
                {
                    id: "ending.runtime",
                    condition: flagEquals(
                        "ending.signal",
                        true,
                    ),
                },
            ]);

        assert.equal(
            endingId,
            "ending.runtime",
        );

        assert.deepEqual(
            runtime.stateStore
                .getState()
                .domain
                .ending,
            {
                endingId: "ending.runtime",
                resolved: true,
            },
        );
    },
);