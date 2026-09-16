import "./infrastructure/hackhub/commands/q03-filestat.js";
import "./infrastructure/hackhub/commands/q03-bootlog.js";
import "./infrastructure/hackhub/commands/q03-zgrep.js";
import "./infrastructure/hackhub/websites/q01-skynet-portal.js";
import "./infrastructure/hackhub/websites/q02-gateway-portal.js";
import "./infrastructure/hackhub/websites/q02-edge-portal.js";
import "./infrastructure/hackhub/websites/q02-cri-gateway-portal.js";
import "./infrastructure/hackhub/q01-quest.js";
import "./infrastructure/hackhub/q02-quest.js";
import "./infrastructure/hackhub/q03-quest.js";

import {
    Bootstrap,
    RegisterModPackage,
} from "@hotbunny/hackhub-content-sdk";

import { gameRuntime } from "./infrastructure/hackhub/runtime.js";

@RegisterModPackage
export default class EntityResolutionMod extends Bootstrap {
    override OnModPackageLoaded() {
        gameRuntime.persistence.load();
        console.log("ENTITY RESOLUTION mod loaded!");
    }

    override OnModPackageUnloaded() {
        gameRuntime.persistence.save();
        console.log("ENTITY RESOLUTION mod unloaded.");
    }
}
