import {
    Bootstrap,
    RegisterModPackage,
} from "@hotbunny/hackhub-content-sdk";

import "./q01-replay-quest.js";
import "./q02-replay-quest.js";
import "../src/infrastructure/hackhub/apps/entity-resolution.js";
import "../src/infrastructure/hackhub/commands/recon.js";
import "../src/infrastructure/hackhub/commands/q01-subfinder.js";
import "../src/infrastructure/hackhub/websites/q01-skynet-portal.js";
import "../src/infrastructure/hackhub/websites/q02-gateway-portal.js";
import "../src/infrastructure/hackhub/websites/q02-edge-portal.js";

import { Q01_RECON_PROFILE } from "../src/content/q01.js";
import { opsRuntime } from "../src/application/ops/runtime.js";
import { registerDssCommandBridge } from "../src/infrastructure/hackhub/dss-command-runtime.js";
import { resolveNativeSubdomains } from "../src/infrastructure/hackhub/native-subfinder-bridge.js";

opsRuntime.recon.registerProfile(Q01_RECON_PROFILE);
opsRuntime.recon.setNativeSubdomainResolver(resolveNativeSubdomains);

@RegisterModPackage
export default class EntityResolutionReplayMod extends Bootstrap {
    override OnModPackageLoaded() {
        registerDssCommandBridge();
        console.log("ENTITY RESOLUTION Q01 replay build loaded.");
    }

    override OnModPackageUnloaded() {
        console.log("ENTITY RESOLUTION Q01 replay build unloaded.");
    }
}
