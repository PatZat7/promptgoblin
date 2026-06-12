<#
=============================================================================
 doppler-import-from-env.ps1 - ONE-TIME migration of existing local secrets
 into Doppler, using the canonical key list from .env.master.template.
-----------------------------------------------------------------------------
 You already have working values scattered across:
   pipeline/.env, .env (root), web/.env.local, functions/.env, email-templates/.env
 This collects them (precedence in that order; first hit wins), maps them to the
 canonical key names in .env.master.template, and writes a reviewable .env.master.
 With -Upload it then pushes that file into the CURRENT Doppler config.

 Safety: - prints key NAMES + which file each came from, NEVER a value.
         - default is assemble-and-review ONLY; nothing is uploaded.
         - backs up an existing .env.master to .env.master.bak first.
         - does not touch production.

 Usage:  pwsh scripts/doppler-import-from-env.ps1           # assemble + review
         pwsh scripts/doppler-import-from-env.ps1 -Upload   # ...and push to Doppler
=============================================================================
#>
[CmdletBinding()]
param(
  [switch]$Upload
)
$ErrorActionPreference = 'Stop'

$Root     = Split-Path -Parent $PSScriptRoot
$Template = Join-Path $Root '.env.master.template'
$Master   = Join-Path $Root '.env.master'

if (-not (Test-Path $Template)) { Write-Host "ERROR: $Template not found."; exit 1 }

# Source files in precedence order (first file that has a key wins).
$Sources = @(
  'pipeline\.env',
  '.env',
  'web\.env.local',
  'functions\.env',
  'email-templates\.env'
) | ForEach-Object { Join-Path $Root $_ }

# Canonical key -> alias names to also accept from a source file.
# (The only real remap: web stores the Supabase URL as NEXT_PUBLIC_SUPABASE_URL.)
$Aliases = @{
  'SUPABASE_URL' = @('NEXT_PUBLIC_SUPABASE_URL')
}

# Parse one .env file into an ordered name->value map (values kept in memory only).
function Read-EnvFile([string]$path) {
  $map = [ordered]@{}
  if (-not (Test-Path $path)) { return $map }
  foreach ($line in (Get-Content -LiteralPath $path)) {
    $t = $line.Trim()
    if ($t -eq '' -or $t.StartsWith('#')) { continue }
    $t = $t -replace '^export\s+', ''
    $idx = $t.IndexOf('=')
    if ($idx -lt 1) { continue }
    $k = $t.Substring(0, $idx).Trim()
    $v = $t.Substring($idx + 1)
    if (-not $map.Contains($k)) { $map[$k] = $v }
  }
  return $map
}

# Build per-source maps once.
$srcMaps = @{}
foreach ($s in $Sources) { $srcMaps[$s] = (Read-EnvFile $s) }

# Canonical key list = every KEY= line in the template.
$canonKeys = New-Object System.Collections.Generic.List[string]
foreach ($line in (Get-Content -LiteralPath $Template)) {
  $t = $line.Trim()
  if ($t -eq '' -or $t.StartsWith('#')) { continue }
  $idx = $t.IndexOf('=')
  if ($idx -lt 1) { continue }
  $canonKeys.Add($t.Substring(0, $idx).Trim())
}

# Resolve each canonical key against the sources (+ aliases), by precedence.
$resolved = [ordered]@{}
$report   = New-Object System.Collections.Generic.List[object]
foreach ($key in $canonKeys) {
  $names = @($key) + @($Aliases[$key])
  $foundVal = $null; $foundFrom = $null; $foundAs = $null
  foreach ($s in $Sources) {
    $m = $srcMaps[$s]
    foreach ($n in $names) {
      if ($n -and $m.Contains($n)) { $foundVal = $m[$n]; $foundFrom = (Split-Path -Leaf (Split-Path -Parent $s)) + '/' + (Split-Path -Leaf $s); $foundAs = $n; break }
    }
    if ($null -ne $foundVal) { break }
  }
  if ($null -ne $foundVal -and $foundVal -ne 'REPLACE_ME' -and $foundVal -ne '') {
    $resolved[$key] = $foundVal
    $asNote = if ($foundAs -ne $key) { " (as $foundAs)" } else { '' }
    $report.Add([pscustomobject]@{ Key = $key; Status = "filled <- $foundFrom$asNote" })
  } else {
    $resolved[$key] = 'REPLACE_ME'
    $report.Add([pscustomobject]@{ Key = $key; Status = 'NOT FOUND - left REPLACE_ME' })
  }
}

# Write .env.master (UTF-8, no BOM). Back up any existing one.
if (Test-Path $Master) { Copy-Item -LiteralPath $Master -Destination "$Master.bak" -Force; Write-Host "Backed up existing .env.master -> .env.master.bak" }
$stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$out = New-Object System.Collections.Generic.List[string]
$out.Add('# ASSEMBLED by scripts/doppler-import-from-env.ps1 from existing local .env files.')
$out.Add('# Review, then upload to Doppler (this script with -Upload, or: doppler secrets upload .env.master).')
$out.Add("# Assembled: $stamp  -- NEVER commit this file.")
$out.Add('')
foreach ($key in $resolved.Keys) { $out.Add(("{0}={1}" -f $key, $resolved[$key])) }
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($Master, (($out -join "`n") + "`n"), $utf8NoBom)

Write-Host ''
Write-Host "Assembled .env.master ($($resolved.Count) keys). Source map (NAMES only):"
$report | ForEach-Object { Write-Host ("  {0,-40} {1}" -f $_.Key, $_.Status) }
$missing = @($report | Where-Object { $_.Status -like 'NOT FOUND*' }).Count
if ($missing -gt 0) { Write-Host "`n$missing key(s) NOT FOUND - fill them in .env.master before relying on them." }

if (-not $Upload) {
  Write-Host "`nReview .env.master, then re-run with -Upload (or:  doppler secrets upload .env.master)."
  exit 0
}

if (-not (Get-Command doppler -ErrorAction SilentlyContinue)) {
  Write-Host "`nERROR: -Upload requested but Doppler CLI not found. Install: winget install Doppler.doppler"
  exit 1
}
# Upload ONLY real values - never push REPLACE_ME placeholders into Doppler.
$real = @(Get-Content -LiteralPath $Master | Where-Object {
  $t = $_.Trim()
  if ($t -eq '' -or $t.StartsWith('#')) { return $false }
  $i = $t.IndexOf('='); if ($i -lt 1) { return $false }
  return ($t.Substring($i + 1).Trim() -ne 'REPLACE_ME')
})
$tmp = Join-Path $Root '.env.master.upload.tmp'   # gitignored (.env.*); deleted after upload
[System.IO.File]::WriteAllText($tmp, (($real -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "`nUploading $($real.Count) real keys to the current Doppler config (placeholders excluded)..."
& doppler secrets upload $tmp | Out-Null   # suppress Doppler's value-echoing table
$code = $LASTEXITCODE
Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
if ($code -ne 0) { Write-Host "ERROR: upload failed. Confirm 'doppler whoami' and 'doppler configure' (prompt-goblin/dev)."; exit 1 }
Write-Host "Done. Verify with:  doppler secrets --only-names"
