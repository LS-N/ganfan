param(
    [switch]$SkipProjectChecks
)

$ErrorActionPreference = "Stop"

function Get-RepoRoot {
    return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
}

function Read-JsonFile {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
}

function Resolve-ProjectOpsRoot {
    param(
        [Parameter(Mandatory = $true)]$Config,
        $LocalConfig
    )

    $candidates = New-Object System.Collections.Generic.List[string]
    if ($LocalConfig -and $LocalConfig.projectOpsRoot) { $candidates.Add([string]$LocalConfig.projectOpsRoot) }
    if ($env:PROJECT_OPS_ROOT) { $candidates.Add($env:PROJECT_OPS_ROOT) }
    if ($Config.projectOpsRootCandidates) {
        foreach ($candidate in @($Config.projectOpsRootCandidates)) { $candidates.Add([string]$candidate) }
    }

    foreach ($candidate in $candidates) {
        if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
        $expanded = [Environment]::ExpandEnvironmentVariables($candidate)
        if (Test-Path -LiteralPath $expanded) {
            return (Resolve-Path -LiteralPath $expanded).Path
        }
    }

    throw "Unable to locate shared project ops. Set project.ops.local.json projectOpsRoot or PROJECT_OPS_ROOT."
}

function Resolve-ToolCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        $LocalConfig
    )

    if ($LocalConfig -and $LocalConfig.toolCommands) {
        $property = $LocalConfig.toolCommands.PSObject.Properties[$Command]
        if ($property -and -not [string]::IsNullOrWhiteSpace([string]$property.Value)) {
            return [string]$property.Value
        }
    }
    return $Command
}

function Invoke-GitVisibleSecretScan {
    param(
        [Parameter(Mandatory = $true)][string]$RepoRoot,
        [Parameter(Mandatory = $true)][string]$ProjectOpsRoot,
        [string[]]$Patterns = @(),
        [string[]]$ExcludePaths = @()
    )

    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("project-ops-scan-" + [System.Guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

    Push-Location $RepoRoot
    try {
        $files = git -c core.quotePath=false ls-files --cached --others --exclude-standard
        if ($LASTEXITCODE -ne 0) { throw "git ls-files failed." }

        foreach ($file in $files) {
            if ([string]::IsNullOrWhiteSpace($file)) { continue }
            if ($file -eq "project.ops.local.json") { continue }
            $excluded = $false
            foreach ($excludePath in $ExcludePaths) {
                if ($file -like $excludePath) {
                    $excluded = $true
                    break
                }
            }
            if ($excluded) { continue }
            $source = Join-Path $RepoRoot $file
            if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { continue }
            $target = Join-Path $tempRoot $file
            $targetDir = Split-Path -Parent $target
            New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
            Copy-Item -LiteralPath $source -Destination $target -Force
        }
    }
    finally {
        Pop-Location
    }

    try {
        & (Join-Path $ProjectOpsRoot "common\secret-scan.ps1") -ProjectRoot $tempRoot -Patterns $Patterns
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    finally {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-ProjectCheck {
    param(
        [Parameter(Mandatory = $true)]$Check,
        [Parameter(Mandatory = $true)][string]$RepoRoot,
        $LocalConfig
    )

    $name = if ($Check.name) { [string]$Check.name } else { [string]$Check.type }
    Write-Host "Running check: $name"

    switch ([string]$Check.type) {
        "command" {
            $workingDirectory = if ($Check.workingDirectory) { Join-Path $RepoRoot ([string]$Check.workingDirectory) } else { $RepoRoot }
            $command = Resolve-ToolCommand -Command ([string]$Check.command) -LocalConfig $LocalConfig
            $commandArgs = @()
            if ($Check.args) { $commandArgs = @($Check.args | ForEach-Object { [string]$_ }) }

            Push-Location $workingDirectory
            try {
                & $command @commandArgs
                if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
            }
            finally {
                Pop-Location
            }
        }
        "path-exists" {
            $path = Join-Path $RepoRoot ([string]$Check.path)
            if (-not (Test-Path -LiteralPath $path)) {
                throw "Required path is missing: $path"
            }
        }
        default {
            throw "Unknown project check type: $($Check.type)"
        }
    }
}

$repoRoot = Get-RepoRoot
$configPath = Join-Path $repoRoot "project.ops.json"
$localConfigPath = Join-Path $repoRoot "project.ops.local.json"
$config = Read-JsonFile -Path $configPath
if (-not $config) { throw "Missing project.ops.json in $repoRoot" }
$localConfig = Read-JsonFile -Path $localConfigPath
$projectOpsRoot = Resolve-ProjectOpsRoot -Config $config -LocalConfig $localConfig

Write-Host "== Project Ops Preflight =="
Write-Host "Project: $($config.name)"
Write-Host "Root: $repoRoot"
Write-Host "Shared ops: $projectOpsRoot"

$defaultBranch = if ($config.defaultBranch) { [string]$config.defaultBranch } else { "main" }
& (Join-Path $projectOpsRoot "common\git-check.ps1") -ProjectRoot $repoRoot -DefaultBranch $defaultBranch

$patterns = @()
if ($config.secretPatterns) { $patterns += @($config.secretPatterns | ForEach-Object { [string]$_ }) }
if ($localConfig -and $localConfig.secretPatterns) { $patterns += @($localConfig.secretPatterns | ForEach-Object { [string]$_ }) }
$excludePaths = @()
if ($config.secretScanExcludePaths) { $excludePaths += @($config.secretScanExcludePaths | ForEach-Object { [string]$_ }) }
Invoke-GitVisibleSecretScan -RepoRoot $repoRoot -ProjectOpsRoot $projectOpsRoot -Patterns $patterns -ExcludePaths $excludePaths

if (-not $SkipProjectChecks) {
    foreach ($check in @($config.checks)) {
        Invoke-ProjectCheck -Check $check -RepoRoot $repoRoot -LocalConfig $localConfig
    }
}

Write-Host "Preflight passed."
