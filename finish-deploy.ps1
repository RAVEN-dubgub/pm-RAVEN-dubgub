# finish-deploy.ps1 — Neon migrate + Vercel env vars + production deploy
# Run from repo root: .\finish-deploy.ps1

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

$LiveUrl = "https://pm-raven-dubgub.vercel.app"

function Read-DotEnv {
    param([string]$Path)
    $result = @{}
    if (-not (Test-Path $Path)) { return $result }
    foreach ($line in Get-Content -Path $Path -Encoding UTF8) {
        $trim = $line.Trim()
        if ($trim -eq "" -or $trim.StartsWith("#")) { continue }
        $eq = $trim.IndexOf("=")
        if ($eq -lt 1) { continue }
        $key = $trim.Substring(0, $eq).Trim()
        $val = $trim.Substring($eq + 1).Trim()
        if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
            $val = $val.Substring(1, $val.Length - 2)
        }
        $result[$key] = $val
    }
    return $result
}

function Set-DotEnvValue {
    param([string]$Path, [string]$Key, [string]$Value)
    $lines = @()
    $found = $false
    if (Test-Path $Path) {
        foreach ($line in Get-Content -Path $Path -Encoding UTF8) {
            $trim = $line.Trim()
            if ($trim -match "^\s*$([regex]::Escape($Key))\s*=") {
                $lines += "$Key=`"$Value`""
                $found = $true
            } else {
                $lines += $line
            }
        }
    }
    if (-not $found) {
        if ($lines.Count -gt 0 -and $lines[-1] -ne "") { $lines += "" }
        $lines += "$Key=`"$Value`""
    }
    Set-Content -Path $Path -Value $lines -Encoding UTF8
}

function Test-PlaceholderUrl {
    param([string]$Url)
    if ([string]::IsNullOrWhiteSpace($Url)) { return $true }
    $lower = $Url.ToLowerInvariant()
    return ($lower -match "user:password" -or $lower -match "replace-with" -or $lower -notmatch "^postgresql://")
}

function New-AuthSecret {
    return [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
}

function Test-VercelLoggedIn {
    $null = npx vercel whoami 2>&1
    return ($LASTEXITCODE -eq 0)
}

function Add-VercelEnv {
    param([string]$Name, [string]$Value, [string]$Target)
    Write-Host "  -> $Name ($Target)" -ForegroundColor DarkGray
    npx vercel env add $Name $Target --value $Value --force --yes --sensitive 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to set Vercel env: $Name ($Target)"
    }
}

Write-Host ""
Write-Host "=== pm-raven-dubgub — finish deploy ===" -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $Root ".env"
$dot = Read-DotEnv -Path $envPath

$databaseUrl = $dot["DATABASE_URL"]
if (Test-PlaceholderUrl $databaseUrl) {
    Write-Host "Neon pooled DATABASE_URL not found in .env (or still a placeholder)." -ForegroundColor Yellow
    Write-Host "Paste the pooled connection string (host contains -pooler, ?sslmode=require):" -ForegroundColor Yellow
    $databaseUrl = Read-Host "DATABASE_URL"
    $databaseUrl = $databaseUrl.Trim().Trim('"').Trim("'")
    if (Test-PlaceholderUrl $databaseUrl) {
        throw "Invalid DATABASE_URL. Use Neon pooled URL from console.neon.tech"
    }
    Set-DotEnvValue -Path $envPath -Key "DATABASE_URL" -Value $databaseUrl
    Write-Host "Saved DATABASE_URL to .env" -ForegroundColor Green
} else {
    Write-Host "Using DATABASE_URL from .env" -ForegroundColor Green
}

$authSecret = $dot["AUTH_SECRET"]
if ([string]::IsNullOrWhiteSpace($authSecret) -or $authSecret -match "replace-with") {
    $authSecret = New-AuthSecret
    Set-DotEnvValue -Path $envPath -Key "AUTH_SECRET" -Value $authSecret
    Write-Host "Generated AUTH_SECRET and saved to .env" -ForegroundColor Green
} else {
    Write-Host "Using AUTH_SECRET from .env" -ForegroundColor Green
}

Write-Host ""
Write-Host "Running Prisma migrations (production DB)..." -ForegroundColor Cyan
$env:DATABASE_URL = $databaseUrl
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    throw "prisma migrate deploy failed"
}
Write-Host "Migrations applied." -ForegroundColor Green

$vercelOk = Test-VercelLoggedIn
Write-Host ""
if ($vercelOk) {
    $who = (npx vercel whoami 2>&1 | Select-Object -Last 1).ToString().Trim()
    Write-Host "Vercel CLI logged in as: $who" -ForegroundColor Green
    Write-Host "Setting Vercel environment variables..." -ForegroundColor Cyan
    foreach ($target in @("production", "preview", "development")) {
        Add-VercelEnv -Name "DATABASE_URL" -Value $databaseUrl -Target $target
        Add-VercelEnv -Name "AUTH_SECRET" -Value $authSecret -Target $target
    }
    Write-Host ""
    Write-Host "Deploying to Vercel production..." -ForegroundColor Cyan
    npx vercel --prod --yes
    if ($LASTEXITCODE -ne 0) {
        throw "vercel --prod failed"
    }
    Write-Host "Deploy finished." -ForegroundColor Green
} else {
    Write-Host "Vercel CLI not logged in — skipped env sync and deploy." -ForegroundColor Yellow
    Write-Host "Run: npx vercel login" -ForegroundColor Yellow
    Write-Host "Then set DATABASE_URL and AUTH_SECRET in the Vercel dashboard or re-run this script." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Smoke test checklist ===" -ForegroundColor Cyan
Write-Host "  Live URL: $LiveUrl"
Write-Host "  [ ] Open $LiveUrl"
Write-Host "  [ ] Sign up with a test account"
Write-Host "  [ ] Create a project and add a task"
Write-Host "  [ ] Assign a task to a peer"
Write-Host "  [ ] Open Dashboard — cohort bar and onboarding checklist"
Write-Host ""
Write-Host "Done." -ForegroundColor Green
