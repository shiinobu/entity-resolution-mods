import { buildMod } from "@hotbunny/hackhub-content-sdk/build";
import {
    cp,
    mkdir,
    readFile,
    rm,
    stat,
    writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const replayStatePath = resolve(projectRoot, ".dev-q01-replay-run");
const generatedIdPath = resolve(
    projectRoot,
    "dev/replay-id.generated.ts",
);
const replayOutputDir = resolve(projectRoot, "dist-replay");
const replayManifestPath = resolve(
    replayOutputDir,
    "manifest.json",
);
const replayModPath = resolve(replayOutputDir, "mod.js");
const replayAppPath = resolve(replayOutputDir, "entity-resolution.html");
const sourceManifestPath = resolve(projectRoot, "manifest.json");
const sourceAssetsDir = resolve(projectRoot, "public/assets");
const sourceDssAppPath = resolve(projectRoot, "src/entity-resolution.html");
const replayAssetsDir = resolve(replayOutputDir, "assets");
const replayAvatarPath = resolve(replayAssetsDir, "adrian-cole.png");
const replayDssIconPath = resolve(replayAssetsDir, "dss.svg");

// One-time development reinstall namespace. This forces HackHub to load the
// replay as a clean mod installation while the DSS application identity stays
// stable as AppName = "dss" and the quest remains uniquely replayed.
const replayModId = "entity-resolution-dev-refresh";

const previousRun = Number.parseInt(
    await readFile(replayStatePath, "utf8").catch(() => "0"),
    10,
);
const replayRun = Number.isFinite(previousRun) ? previousRun + 1 : 1;
const replayId = `r${replayRun}-${Date.now().toString(36)}`;

await mkdir(dirname(generatedIdPath), { recursive: true });
await writeFile(
    generatedIdPath,
    `export const DEV_Q01_REPLAY_ID = ${JSON.stringify(replayId)};\n`,
    "utf8",
);
await writeFile(replayStatePath, `${replayRun}\n`, "utf8");

await rm(replayOutputDir, { recursive: true, force: true });

await buildMod({
    entryPoint: "dev/q01-replay-entry.ts",
    outfile: replayModPath,
});

const replayBundle = await readFile(replayModPath, "utf8");
const requiredBundleMarkers = [
    "EntityResolutionApp",
    "dss",
    "ReconCommand",
    "Q01_RECON_PROFILE",
    "portal.skynet-logistics.idx",
    "security.skynet-logistics.idx",
    "www.skynet-logistics.idx",
    "EntityResolutionQ03ReplayQuest",
    "Q03FilestatCommand",
    "Q03BootlogCommand",
    "Q03ZgrepCommand",
];

for (const marker of requiredBundleMarkers) {
    if (!replayBundle.includes(marker)) {
        throw new Error(
            `Q01 replay bundle is stale or incomplete: missing runtime marker ${marker}`,
        );
    }
}

const sourceDssApp = await readFile(sourceDssAppPath, "utf8");
const requiredDssHtmlMarkers = [
    "OPERATIONS WORKSPACE",
    "Terminal+",
    "Wireshark+",
    "Run Recon",
];

for (const marker of requiredDssHtmlMarkers) {
    if (!sourceDssApp.includes(marker)) {
        throw new Error(
            `Q01 replay DSS HTML is stale or incomplete: missing UI marker ${marker}`,
        );
    }
}

const sourceManifest = JSON.parse(
    await readFile(sourceManifestPath, "utf8"),
) as Record<string, unknown>;

const manifest: Record<string, unknown> = {
    ...sourceManifest,
    id: replayModId,
    name: "DSS (Development Refresh)",
    version: `0.1.0-dev.${replayId}`,
    description:
        `Development build for repeating Q01 live tests (${replayId}).`,
};

await writeFile(
    replayManifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
);

await mkdir(replayAssetsDir, { recursive: true });
await cp(sourceAssetsDir, replayAssetsDir, {
    recursive: true,
    force: true,
});
// Keep a readable source copy in the replay package for inspection. The
// runtime App HTML is embedded from the synchronized root-level import above.
await cp(sourceDssAppPath, replayAppPath, { force: true });

const requiredFiles = [
    replayModPath,
    replayManifestPath,
    replayAppPath,
    replayAvatarPath,
    replayDssIconPath,
];

for (const requiredFile of requiredFiles) {
    const fileInfo = await stat(requiredFile).catch(() => null);

    if (!fileInfo?.isFile()) {
        throw new Error(
            `Q01 replay package is incomplete: missing ${requiredFile}`,
        );
    }
}

console.log(`Q01 replay build created: ${replayId}`);
console.log(`Output: ${replayOutputDir}`);
console.log(`Replay mod id: ${replayModId}`);
console.log("Verified bundle markers:");
for (const marker of requiredBundleMarkers) {
    console.log(`  - ${marker}`);
}
console.log("Verified DSS HTML markers:");
for (const marker of requiredDssHtmlMarkers) {
    console.log(`  - ${marker}`);
}
console.log("Package contents:");
console.log("  - mod.js");
console.log("  - manifest.json");
console.log("  - entity-resolution.html");
console.log("  - assets/adrian-cole.png");
console.log("  - assets/dss.svg");
console.log(
    `Install the complete dist-replay contents into HackHub/mods/${replayModId} and restart HackHub.`,
);
