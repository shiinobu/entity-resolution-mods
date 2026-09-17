<#
Builds the ENTITY RESOLUTION mod (npm run build -> dist/) and copies the
build output into the local HackHub mods folder so a game restart picks
up the new code. Run from anywhere; paths resolve relative to this file.
#>

param(
    [string]$ModsPath = "C:\Program Files (x86)\Steam\steamapps\common\Hackhub\mods\entity-resolution-dev"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$DistPath = Join-Path $ProjectRoot "dist"
$RequiredItems = @("mod.js", "manifest.json", "entity-resolution.html", "assets")

Write-Host "[1/3] Building mod..." -ForegroundColor Cyan
Push-Location $ProjectRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

Write-Host "[2/3] Verifying build output in $DistPath..." -ForegroundColor Cyan
foreach ($item in $RequiredItems) {
    $itemPath = Join-Path $DistPath $item
    if (-not (Test-Path $itemPath)) {
        throw "Missing expected build output: $itemPath"
    }
}

Write-Host "[3/3] Installing to $ModsPath..." -ForegroundColor Cyan
if (-not (Test-Path $ModsPath)) {
    New-Item -ItemType Directory -Force -Path $ModsPath | Out-Null
}

foreach ($item in $RequiredItems) {
    $source = Join-Path $DistPath $item
    Copy-Item -Path $source -Destination $ModsPath -Recurse -Force
}

Write-Host ""
Write-Host "Done. Mod installed at: $ModsPath" -ForegroundColor Green
Write-Host "Restart HackHub (or run 'mods.reset entity-resolution' in the F1 debug console) to load the new build." -ForegroundColor Yellow
