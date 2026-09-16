import assert from "node:assert/strict";
import test from "node:test";

import {
    all,
    any,
    flagEquals,
    flagExists,
    never,
    not,
    ConditionEvaluator,
} from "../../src/domain/shared/index.js";

import {
    createDefaultRuntimeState,
    FlagStore,
    StateStore,
} from "../../src/state/index.js";

const createEvaluator = () => {
    const stateStore = new StateStore(
        createDefaultRuntimeState(),
    );

    const flagStore = new FlagStore(stateStore);
    const evaluator = new ConditionEvaluator(flagStore);

    return {
        stateStore,
        flagStore,
        evaluator,
    };
};

test("ConditionEvaluator evaluates always and never", () => {
    const { evaluator } = createEvaluator();

    assert.equal(evaluator.evaluate({ kind: "always" }), true);
    assert.equal(evaluator.evaluate(never()), false);
});

test("ConditionEvaluator evaluates flag equality", () => {
    const { evaluator, flagStore } = createEvaluator();

    flagStore.set("mission.status", "active");

    assert.equal(
        evaluator.evaluate(
            flagEquals("mission.status", "active"),
        ),
        true,
    );

    assert.equal(
        evaluator.evaluate(
            flagEquals("mission.status", "completed"),
        ),
        false,
    );
});

test("ConditionEvaluator evaluates flag existence", () => {
    const { evaluator, flagStore } = createEvaluator();

    assert.equal(
        evaluator.evaluate(
            flagExists("mission.status"),
        ),
        false,
    );

    flagStore.set("mission.status", "active");

    assert.equal(
        evaluator.evaluate(
            flagExists("mission.status"),
        ),
        true,
    );
});

test("ConditionEvaluator evaluates all conditions", () => {
    const { evaluator, flagStore } = createEvaluator();

    flagStore.set("mission.started", true);
    flagStore.set("player.rank", 3);

    assert.equal(
        evaluator.evaluate(
            all(
                flagEquals("mission.started", true),
                flagEquals("player.rank", 3),
            ),
        ),
        true,
    );

    assert.equal(
        evaluator.evaluate(
            all(
                flagEquals("mission.started", true),
                flagEquals("player.rank", 4),
            ),
        ),
        false,
    );
});

test("ConditionEvaluator evaluates any conditions", () => {
    const { evaluator, flagStore } = createEvaluator();

    flagStore.set("route.alpha", false);
    flagStore.set("route.beta", true);

    assert.equal(
        evaluator.evaluate(
            any(
                flagEquals("route.alpha", true),
                flagEquals("route.beta", true),
            ),
        ),
        true,
    );

    assert.equal(
        evaluator.evaluate(
            any(
                flagEquals("route.alpha", true),
                flagEquals("route.gamma", true),
            ),
        ),
        false,
    );
});

test("ConditionEvaluator evaluates not conditions", () => {
    const { evaluator, flagStore } = createEvaluator();

    flagStore.set("door.locked", true);

    assert.equal(
        evaluator.evaluate(
            not(flagEquals("door.locked", true)),
        ),
        false,
    );

    assert.equal(
        evaluator.evaluate(
            not(flagEquals("door.locked", false)),
        ),
        true,
    );
});

test("ConditionEvaluator evaluates nested condition trees", () => {
    const { evaluator, flagStore } = createEvaluator();

    flagStore.set("mission.active", true);
    flagStore.set("player.rank", 5);
    flagStore.set("access.granted", false);

    const condition = all(
        flagEquals("mission.active", true),
        any(
            flagEquals("player.rank", 5),
            flagEquals("player.rank", 6),
        ),
        not(
            flagEquals("access.granted", true),
        ),
    );

    assert.equal(
        evaluator.evaluate(condition),
        true,
    );
});