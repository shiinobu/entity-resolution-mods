import "./infrastructure/hackhub/apps/entity-resolution.js";
import "./infrastructure/hackhub/commands/recon.js";
import "./infrastructure/hackhub/commands/q01-subfinder.js";
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

import { Q01_RECON_PROFILE } from "./content/q01.js";
import { opsRuntime } from "./application/ops/runtime.js";
import { gameRuntime } from "./infrastructure/hackhub/runtime.js";
import { registerDssCommandBridge } from "./infrastructure/hackhub/dss-command-runtime.js";
import { resolveNativeSubdomains } from "./infrastructure/hackhub/native-subfinder-bridge.js";

opsRuntime.recon.registerProfile(Q01_RECON_PROFILE);
opsRuntime.recon.setNativeSubdomainResolver(resolveNativeSubdomains);

@RegisterModPackage
export default class EntityResolutionMod extends Bootstrap {
    override OnModPackageLoaded() {
        registerDssCommandBridge();
        gameRuntime.persistence.load();
        console.log("ENTITY RESOLUTION mod loaded!");
    }

    override OnModPackageUnloaded() {
        gameRuntime.persistence.save();
        console.log("ENTITY RESOLUTION mod unloaded.");
    }
}
