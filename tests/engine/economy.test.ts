import assert from "node:assert/strict";
import test from "node:test";

import { asId } from "../../src/core/index.js";
import { DomainError } from "../../src/domain/shared/index.js";
import type { MissionReward } from "../../src/domain/economy/index.js";
import { EconomyService } from "../../src/application/economy-service.js";
import { GameRuntime } from "../../src/application/game-runtime.js";

const missionReward: MissionReward = {
    id: asId<"MissionReward">("mission-reward-1"),
    questId: "Q07",
    amount: 350,
    rewardIndex: 0,
};

test("default runtime starts with zero economy balance and no transactions", () => {
    const runtime = new GameRuntime();

    assert.equal(runtime.economy.getBalance(), 0);
    assert.deepEqual(runtime.economy.getTransactions(), []);
});

test("EconomyService credits balance and logs a transaction", () => {
    const runtime = new GameRuntime();

    runtime.economy.credit(350, "QUEST_REWARD", "Q07", "2026-01-01T00:00:00.000Z");

    assert.equal(runtime.economy.getBalance(), 350);
    assert.equal(runtime.economy.getTransactions().length, 1);
    assert.equal(runtime.economy.getTransactions()[0]?.type, "CREDIT");
    assert.equal(runtime.economy.getTransactions()[0]?.amount, 350);
    assert.equal(runtime.economy.getTransactions()[0]?.source, "QUEST_REWARD");
    assert.equal(runtime.economy.getTransactions()[0]?.reference, "Q07");
    assert.equal(runtime.economy.getTransactions()[0]?.timestamp, "2026-01-01T00:00:00.000Z");
});

test("EconomyService debits balance and prevents a negative balance", () => {
    const runtime = new GameRuntime();

    runtime.economy.credit(500, "BONUS");
    runtime.economy.debit(200, "PURCHASE", "tool-1");

    assert.equal(runtime.economy.getBalance(), 300);
    assert.equal(runtime.economy.getTransactions()[1]?.type, "DEBIT");

    assert.throws(
        () => runtime.economy.debit(301, "PURCHASE"),
        (error: unknown) =>
            error instanceof DomainError &&
            error.code === "PRECONDITION_FAILED",
    );

    assert.equal(runtime.economy.getBalance(), 300);
});

test("EconomyService rejects zero, negative, and fractional amounts", () => {
    const runtime = new GameRuntime();

    for (const amount of [0, -1, 1.5]) {
        assert.throws(
            () => runtime.economy.credit(amount, "BONUS"),
            (error: unknown) =>
                error instanceof DomainError &&
                error.code === "INVALID_STATE",
        );
    }
});

test("EconomyService supports reward and penalty operations", () => {
    const runtime = new GameRuntime();

    runtime.economy.reward({
        amount: 200,
        source: "QUEST_REWARD",
    });
    runtime.economy.penalize({
        amount: 50,
        source: "PENALTY",
    });

    assert.equal(runtime.economy.getBalance(), 150);
    assert.equal(runtime.economy.getTransactions().length, 2);
});

test("mission rewards are idempotent by quest, completion, and reward index", () => {
    const runtime = new GameRuntime();

    assert.equal(
        runtime.economy.applyMissionReward(
            missionReward,
            "completion-1",
            "2026-01-01T00:00:00.000Z",
        ),
        true,
    );
    assert.equal(
        runtime.economy.applyMissionReward(
            missionReward,
            "completion-1",
            "2026-01-01T00:00:01.000Z",
        ),
        false,
    );

    assert.equal(runtime.economy.getBalance(), 350);
    assert.equal(runtime.economy.getTransactions().length, 1);
    assert.equal(
        runtime.economy.hasAppliedMissionReward(missionReward, "completion-1"),
        true,
    );
});

test("mission reward completion IDs remain independent", () => {
    const runtime = new GameRuntime();

    runtime.economy.applyMissionReward(missionReward, "completion-1");
    runtime.economy.applyMissionReward(missionReward, "completion-2");

    assert.equal(runtime.economy.getBalance(), 700);
    assert.equal(runtime.economy.getTransactions().length, 2);
});

test("mission reward uses the canonical StateStore through GameRuntime", () => {
    const runtime = new GameRuntime();

    runtime.economy.applyMissionReward(missionReward, "completion-1");

    assert.equal(runtime.stateStore.getState().domain.economy.balance, 350);
    assert.equal(
        runtime.stateStore.getState().domain.economy.transactions.length,
        1,
    );
});

test("GameRuntime exposes a functional EconomyService", () => {
    const runtime = new GameRuntime();

    assert.ok(runtime.economy instanceof EconomyService);
    runtime.economy.credit(700, "BONUS");

    assert.equal(runtime.economy.getBalance(), 700);
});
