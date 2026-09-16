import {
    Bootstrap,
    RegisterModPackage,
} from "@hotbunny/hackhub-content-sdk";

import "./q01-replay-quest.js";
import "./q02-replay-quest.js";
import "./q03-replay-quest.js";
import "../src/infrastructure/hackhub/commands/q03-filestat.js";
import "../src/infrastructure/hackhub/commands/q03-bootlog.js";
import "../src/infrastructure/hackhub/commands/q03-zgrep.js";
import "../src/infrastructure/hackhub/websites/q01-skynet-portal.js";
import "../src/infrastructure/hackhub/websites/q02-gateway-portal.js";
import "../src/infrastructure/hackhub/websites/q02-edge-portal.js";
import "../src/infrastructure/hackhub/websites/q02-cri-gateway-portal.js";

@RegisterModPackage
export default class EntityResolutionReplayMod extends Bootstrap {
    override OnModPackageLoaded() {
        console.log("ENTITY RESOLUTION Q01 replay build loaded.");
    }

    override OnModPackageUnloaded() {
        console.log("ENTITY RESOLUTION Q01 replay build unloaded.");
    }
}
