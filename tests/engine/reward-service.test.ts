import test from "node:test";
import assert from "node:assert/strict";

import {
    RewardService,
} from "../../src/application/reward-service.js";

import {
    asId,
} from "../../src/core/index.js";

import {
    createDefaultRuntimeState,
    DomainStateAccess,
    StateStore,
} from "../../src/state/index.js";

import {
    GameRuntime,
} from "../../src/application/index.js";

test(
    "RewardService grants experience",
    () => {
        const stateStore =
            new StateStore(
                createDefaultRuntimeState(),
            );

        const domainState =
            new DomainStateAccess(
                stateStore,
            );

        const rewardService =
            new RewardService(
                domainState,
            );

        const reward = {
            id: asId<"Reward">(
                "reward.test.exp",
            ),
            kind: "experience" as const,
            amount: 100,
        };

        const claimed =
            rewardService.claim(
                reward,
            );

        assert.equal(
            claimed,
            true,
        );

        assert.equal(
            domainState
                .get()
                .progression
                .experience,
            100,
        );
    },
);

test(
    "RewardService does not claim the same reward twice",
    () => {
        const stateStore =
            new StateStore(
                createDefaultRuntimeState(),
            );

        const domainState =
            new DomainStateAccess(
                stateStore,
            );

        const rewardService =
            new RewardService(
                domainState,
            );

        const reward = {
            id: asId<"Reward">(
                "reward.test.exp",
            ),
            kind: "experience" as const,
            amount: 100,
        };

        assert.equal(
            rewardService.claim(
                reward,
            ),
            true,
        );

        assert.equal(
            rewardService.claim(
                reward,
            ),
            false,
        );

        assert.equal(
            domainState
                .get()
                .progression
                .experience,
            100,
        );
    },
);

test(
    "RewardService records claimed rewards",
    () => {
        const stateStore =
            new StateStore(
                createDefaultRuntimeState(),
            );

        const domainState =
            new DomainStateAccess(
                stateStore,
            );

        const rewardService =
            new RewardService(
                domainState,
            );

        const reward = {
            id: asId<"Reward">(
                "reward.test.exp",
            ),
            kind: "experience" as const,
            amount: 50,
        };

        rewardService.claim(
            reward,
        );

        assert.equal(
            rewardService.hasClaimed(
                reward.id,
            ),
            true,
        );
    },
);

test(
    "RewardService writes through canonical StateStore",
    () => {
        const stateStore =
            new StateStore(
                createDefaultRuntimeState(),
            );

        const domainState =
            new DomainStateAccess(
                stateStore,
            );

        const rewardService =
            new RewardService(
                domainState,
            );

        rewardService.claim({
            id: asId<"Reward">(
                "reward.test.exp",
            ),
            kind: "experience",
            amount: 250,
        });

        assert.equal(
            stateStore
                .getState()
                .domain
                .progression
                .experience,
            250,
        );
    },
);

test(
    "GameRuntime owns a functional RewardService",
    () => {
        const runtime =
            new GameRuntime();

        const reward = {
            id: asId<"Reward">(
                "reward.runtime.exp",
            ),
            kind: "experience" as const,
            amount: 200,
        };

        assert.equal(
            runtime.reward.claim(
                reward,
            ),
            true,
        );

        assert.equal(
            runtime.stateStore
                .getState()
                .domain
                .progression
                .experience,
            200,
        );
    },
);