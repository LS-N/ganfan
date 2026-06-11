param(
    [string]$Message = "",
    [string[]]$Pathspec = @(),
    [switch]$NoPush
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$config = Get-Content -LiteralPath (Join-Path $repoRoot "project.ops.json") -Raw | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = if ($config.defaultCommitMessage) { [string]$config.defaultCommitMessage } else { "chore: update project operations workflow" }
}
if (-not $Pathspec -or $Pathspec.Count -eq 0) {
    $Pathspec = @($config.defaultCommitPathspecs | ForEach-Object { [string]$_ })
}
if (-not $Pathspec -or $Pathspec.Count -eq 0) {
    throw "No pathspecs configured. Pass -Pathspec explicitly."
}

& (Join-Path $PSScriptRoot "preflight.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location $repoRoot
try {
    $alreadyStaged = @(git diff --cached --name-only)
    if ($alreadyStaged.Count -gt 0) {
        throw "There are already staged files. Unstage them before using this safe commit wrapper."
    }

    git add -- @Pathspec
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $stagedForPathspec = @(git diff --cached --name-only -- @Pathspec)
    if (-not $stagedForPathspec -or $stagedForPathspec.Count -eq 0) {
        Write-Host "Nothing staged for configured pathspecs."
        exit 0
    }

    $allStaged = @(git diff --cached --name-only)
    $outside = @($allStaged | Where-Object { $stagedForPathspec -notcontains $_ })
    if ($outside.Count -gt 0) {
        throw "Refusing to commit files outside configured pathspecs: $($outside -join ', ')"
    }

    Write-Host "Files staged for commit:"
    $allStaged | ForEach-Object { Write-Host "  $_" }
    git diff --cached --stat

    git commit -m $Message
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    if (-not $NoPush) {
        git push
        if ($LASTEXITCODE -ne 0) {
            $branch = (git branch --show-current).Trim()
            git push -u origin $branch
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        }
    }
}
finally {
    Pop-Location
}
