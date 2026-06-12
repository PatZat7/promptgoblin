<#
=============================================================================
 verify-envs.ps1 - prove the Doppler round-trip preserved every working key.
-----------------------------------------------------------------------------
 The only risk the new (Doppler) setup introduces is that
   Doppler -> .env.master -> sync-envs
 produces a DIFFERENT or MISSING value vs the current working .env files.
 This catches that, value-blind (SHA-256 hashes only - no secret is ever read
 aloud, printed, or written in clear).

 Workflow:
   1. BEFORE any Doppler change (files still known-good):
        pwsh scripts/verify-envs.ps1 -Snapshot
      -> writes .env.verify-baseline.json (hashes + lengths only; gitignored)
   2. Do the Doppler setup + import + pull + sync.
   3. Confirm nothing changed:
        pwsh scripts/verify-envs.ps1            (compare mode, default)
      -> per file: OK / CHANGED / MISSING / NEW / EMPTY. Exit 1 on any regression.

   Optional, any time (uses your real keys against free read-only endpoints):
        pwsh scripts/verify-envs.ps1 -Live      (or add -Live to compare)

 Touches no production and writes no secret values anywhere.
=============================================================================
#>
[CmdletBinding()]
param(
  [switch]$Snapshot,
  [switch]$Live
)
$ErrorActionPreference = 'Stop'

$Root     = Split-Path -Parent $PSScriptRoot
$Baseline = Join-Path $Root '.env.verify-baseline.json'
$Template = Join-Path $Root '.env.master.template'

# Files that the sync regenerates (the ones that can change).
$Targets = @('.env', 'web\.env.local', 'pipeline\.env')

$sha = [System.Security.Cryptography.SHA256]::Create()
function Get-ValHash([string]$s) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($s)
  -join ($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) | ForEach-Object { $_.Substring(0, 16) }
}

# Strip ONE layer of surrounding matching quotes + outer whitespace, so we
# compare the FUNCTIONAL value (what dotenv/python-dotenv hand the app) rather
# than the raw bytes. Doppler normalizes quotes on upload/download, so without
# this every quoted key would falsely read as CHANGED after the round-trip.
function Get-NormValue([string]$v) {
  $v = $v.Trim()
  if ($v.Length -ge 2) {
    $a = $v[0]; $b = $v[$v.Length - 1]
    if (($a -eq '"' -and $b -eq '"') -or ($a -eq "'" -and $b -eq "'")) {
      $v = $v.Substring(1, $v.Length - 2)
    }
  }
  return $v
}

# Parse an env file -> ordered key -> value (in memory only).
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
    $map[$k] = $v
  }
  return $map
}

# ---- Build the current fingerprint (hash + length + empty flag per key) ----
function Get-Fingerprint {
  $fp = [ordered]@{}
  foreach ($rel in $Targets) {
    $path = Join-Path $Root $rel
    $rel2 = $rel -replace '\\', '/'
    $entry = [ordered]@{}
    foreach ($kv in (Read-EnvFile $path).GetEnumerator()) {
      $v = Get-NormValue ([string]$kv.Value)
      $entry[$kv.Key] = @{ h = (Get-ValHash $v); len = $v.Length; empty = [string]::IsNullOrWhiteSpace($v) }
    }
    $fp[$rel2] = @{ exists = (Test-Path $path); keys = $entry }
  }
  return $fp
}

# ============================ SNAPSHOT MODE ================================
if ($Snapshot) {
  $fp = Get-Fingerprint
  $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  $obj = @{ created = $stamp; files = $fp }
  ($obj | ConvertTo-Json -Depth 8) | Set-Content -LiteralPath $Baseline -Encoding ascii
  Write-Host "Baseline written: .env.verify-baseline.json  (hashes only, gitignored)"
  foreach ($rel in $fp.Keys) {
    $n = @($fp[$rel].keys.Keys).Count
    $empty = @($fp[$rel].keys.GetEnumerator() | Where-Object { $_.Value.empty }).Count
    $msg = "  {0,-20} {1} keys" -f $rel, $n
    if ($empty -gt 0) { $msg += "  (WARNING: $empty empty)" }
    Write-Host $msg
  }

  # Coverage: any canonical template key present in NO target file?
  if (Test-Path $Template) {
    $canon = @()
    foreach ($line in (Get-Content -LiteralPath $Template)) {
      $t = $line.Trim()
      if ($t -eq '' -or $t.StartsWith('#')) { continue }
      $i = $t.IndexOf('='); if ($i -gt 0) { $canon += $t.Substring(0, $i).Trim() }
    }
    $present = @{}
    foreach ($rel in $fp.Keys) { foreach ($k in $fp[$rel].keys.Keys) { $present[$k] = $true } }
    $alias = @{ 'SUPABASE_URL' = 'NEXT_PUBLIC_SUPABASE_URL' }
    $missing = @()
    foreach ($k in ($canon | Select-Object -Unique)) {
      if ($present.ContainsKey($k)) { continue }
      if ($alias.ContainsKey($k) -and $present.ContainsKey($alias[$k])) { continue }
      $missing += $k
    }
    if ($missing.Count -gt 0) {
      Write-Host ''
      Write-Host "NOTE: $($missing.Count) template key(s) not found in any local .env (may be DO-prod-only or unused):"
      Write-Host ('  ' + ($missing -join ', '))
    } else {
      Write-Host ''
      Write-Host "Coverage: every template key is present in at least one local .env file."
    }
  }
  if (-not $Live) { exit 0 }
}

# ============================ COMPARE MODE ================================
if (-not $Snapshot) {
  if (-not (Test-Path $Baseline)) {
    Write-Host "ERROR: no baseline found (.env.verify-baseline.json)."
    Write-Host "       Run BEFORE the Doppler change:  pwsh scripts/verify-envs.ps1 -Snapshot"
    exit 1
  }
  $base = Get-Content -LiteralPath $Baseline -Raw | ConvertFrom-Json
  $now  = Get-Fingerprint
  $regressions = 0

  foreach ($rel in $Targets) {
    $rel2 = $rel -replace '\\', '/'
    Write-Host ("== {0} ==" -f $rel2)
    $bKeys = @{}
    if ($base.files.$rel2) { foreach ($p in $base.files.$rel2.keys.PSObject.Properties) { $bKeys[$p.Name] = $p.Value } }
    $nKeys = $now[$rel2].keys

    # baseline keys: still present? same hash? non-empty?
    foreach ($k in ($bKeys.Keys | Sort-Object)) {
      if (-not $nKeys.Contains($k)) {
        Write-Host ("  MISSING  {0}  (was present before, gone now)" -f $k); $regressions++
      } elseif ($nKeys[$k].empty -and -not $bKeys[$k].empty) {
        Write-Host ("  EMPTY    {0}  (had a value before, blank now)" -f $k); $regressions++
      } elseif ($nKeys[$k].h -ne $bKeys[$k].h) {
        Write-Host ("  CHANGED  {0}  (value differs from baseline)" -f $k); $regressions++
      } else {
        Write-Host ("  OK       {0}" -f $k)
      }
    }
    # keys that appeared that weren't in baseline (informational, not a regression)
    foreach ($k in ($nKeys.Keys | Sort-Object)) {
      if (-not $bKeys.ContainsKey($k)) { Write-Host ("  NEW      {0}  (not in baseline - informational)" -f $k) }
    }
    Write-Host ''
  }

  if ($regressions -gt 0) {
    Write-Host ("RESULT: $regressions regression(s) - the new setup did NOT reproduce the working keys. Do NOT rely on it yet.")
    if (-not $Live) { exit 1 }
  } else {
    Write-Host "RESULT: all baseline keys reproduced identically. The Doppler round-trip is safe."
  }
}

# ============================ LIVE MODE (optional) ========================
if ($Live) {
  Write-Host ''
  Write-Host '== Live key checks (free read-only endpoints; uses your real keys) =='
  # Merge all target files into one lookup (values in memory only).
  $V = @{}
  foreach ($rel in $Targets) { foreach ($kv in (Read-EnvFile (Join-Path $Root $rel)).GetEnumerator()) { if (-not $V.ContainsKey($kv.Key)) { $V[$kv.Key] = (Get-NormValue ([string]$kv.Value)) } } }
  # Also pull keys that live only in functions/ + email-templates/ (not sync targets).
  foreach ($rel in @('functions\.env','email-templates\.env')) { foreach ($kv in (Read-EnvFile (Join-Path $Root $rel)).GetEnumerator()) { if (-not $V.ContainsKey($kv.Key)) { $V[$kv.Key] = (Get-NormValue ([string]$kv.Value)) } } }
  function Has([string]$k) { return ($V.ContainsKey($k) -and -not [string]::IsNullOrWhiteSpace($V[$k])) }

  function Probe([string]$label, [string]$url, [hashtable]$headers) {
    try {
      $r = Invoke-WebRequest -Uri $url -Headers $headers -Method GET -UseBasicParsing -TimeoutSec 20
      $c = [int]$r.StatusCode
      Write-Host ("  OK       {0,-12} (HTTP {1})" -f $label, $c)
    } catch {
      $c = $null
      if ($_.Exception.Response) { try { $c = [int]$_.Exception.Response.StatusCode } catch {} }
      if ($c) { Write-Host ("  FAIL     {0,-12} (HTTP {1})" -f $label, $c) }
      else    { Write-Host ("  ERROR    {0,-12} ({1})" -f $label, $_.Exception.Message) }
    }
  }
  function Skip([string]$label, [string]$why) { Write-Host ("  SKIP     {0,-12} ({1})" -f $label, $why) }

  if (Has 'ANTHROPIC_API_KEY') { Probe 'anthropic' 'https://api.anthropic.com/v1/models' @{ 'x-api-key' = $V['ANTHROPIC_API_KEY']; 'anthropic-version' = '2023-06-01' } } else { Skip 'anthropic' 'no key' }
  if (Has 'OPENAI_API_KEY')    { Probe 'openai'    'https://api.openai.com/v1/models'    @{ Authorization = "Bearer $($V['OPENAI_API_KEY'])" } } else { Skip 'openai' 'no key' }
  $stripeKey = if (Has 'STRIPE_SECRET_KEY') { $V['STRIPE_SECRET_KEY'] } elseif (Has 'STRIPE_LIVE_SECRET_KEY') { $V['STRIPE_LIVE_SECRET_KEY'] } else { $null }
  if ($stripeKey) { Probe 'stripe' 'https://api.stripe.com/v1/balance' @{ Authorization = "Bearer $stripeKey" } } else { Skip 'stripe' 'no key' }
  if (Has 'RESEND_API_KEY') {
    $rk = $V['RESEND_API_KEY']
    try {
      $r = Invoke-WebRequest -Uri 'https://api.resend.com/domains' -Headers @{ Authorization = "Bearer $rk" } -Method GET -UseBasicParsing -TimeoutSec 20
      Write-Host ("  OK       {0,-12} (HTTP {1})" -f 'resend', [int]$r.StatusCode)
    } catch {
      $c = $null; if ($_.Exception.Response) { try { $c = [int]$_.Exception.Response.StatusCode } catch {} }
      if ($c -eq 401 -and $rk.StartsWith('re_')) { Write-Host ("  PRESENT  {0,-12} (re_ key; /domains 401 = likely send-scoped, sending not verified here)" -f 'resend') }
      elseif ($c) { Write-Host ("  FAIL     {0,-12} (HTTP {1})" -f 'resend', $c) }
      else { Write-Host ("  ERROR    {0,-12} ({1})" -f 'resend', $_.Exception.Message) }
    }
  } else { Skip 'resend' 'no key' }
  if (Has 'GEMINI_API_KEY')    { Probe 'gemini'    "https://generativelanguage.googleapis.com/v1beta/models?key=$($V['GEMINI_API_KEY'])" @{} } else { Skip 'gemini' 'no key' }
  if (Has 'SCRAPFLY_KEY')      { Probe 'scrapfly'  "https://api.scrapfly.io/account?key=$($V['SCRAPFLY_KEY'])" @{} }
  elseif (Has 'SCRAPFLY')      { Probe 'scrapfly'  "https://api.scrapfly.io/account?key=$($V['SCRAPFLY'])" @{} } else { Skip 'scrapfly' 'no key' }
  if (Has 'CLERK_SECRET_KEY')  { Probe 'clerk'     'https://api.clerk.com/v1/users?limit=1' @{ Authorization = "Bearer $($V['CLERK_SECRET_KEY'])" } } else { Skip 'clerk' 'no key' }
  $sbUrl    = if (Has 'NEXT_PUBLIC_SUPABASE_URL') { $V['NEXT_PUBLIC_SUPABASE_URL'] } elseif (Has 'SUPABASE_URL') { $V['SUPABASE_URL'] } else { $null }
  $sbSecret = if (Has 'SUPABASE_SERVICE_ROLE_KEY') { $V['SUPABASE_SERVICE_ROLE_KEY'] } else { $null }
  if ($sbUrl -and $sbSecret) {
    if ($sbSecret.StartsWith('sb_')) { Skip 'supabase' 'new sb_ key format - validate via app or Supabase MCP, not this probe' }
    else { Probe 'supabase' ("{0}/rest/v1/" -f $sbUrl.TrimEnd('/')) @{ apikey = $sbSecret; Authorization = "Bearer $sbSecret" } }
  } else { Skip 'supabase' 'need URL + service-role key' }
  if ((Has 'POSTHOG_PERSONAL_API_KEY') -and (Has 'POSTHOG_HOST') -and (Has 'POSTHOG_PROJECT_ID')) { Probe 'posthog' ("{0}/api/projects/{1}/" -f $V['POSTHOG_HOST'].TrimEnd('/'), $V['POSTHOG_PROJECT_ID']) @{ Authorization = "Bearer $($V['POSTHOG_PERSONAL_API_KEY'])" } } else { Skip 'posthog' 'need host + project + personal key' }
  if (Has 'PERPLEXITY_API_KEY')  { Skip 'perplexity' 'present (no free read-only probe)' } else { Skip 'perplexity' 'no key' }
  if (Has 'LANGSMITH_API_KEY')   { Skip 'langsmith'  'present (no safe free probe)' } else { Skip 'langsmith' 'no key' }
  Write-Host ''
  Write-Host 'Live check done. OK = key valid; FAIL (HTTP 401/403) = bad/expired key; SKIP = not probed.'
}
