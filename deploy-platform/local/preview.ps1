param(
  [string]$Site = "ubercorp",
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$repo = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$manifest = Join-Path $repo "deploy-platform\sites\$Site.json"
if (!(Test-Path $manifest)) { throw "Unknown site '$Site'. Missing manifest: $manifest" }
$config = Get-Content $manifest -Raw | ConvertFrom-Json
$source = Join-Path $repo $config.source_dir
if (!(Test-Path $source)) { throw "Site source not found: $source" }

Write-Host "Local preview: $Site" -ForegroundColor Cyan
Write-Host "Source: $source"
Write-Host "URL: http://127.0.0.1:$Port/"

$php = Get-Command php -ErrorAction SilentlyContinue
if ($php) {
  Write-Host "Using PHP built-in server (PHP support enabled)." -ForegroundColor Green
  Push-Location $source
  try { & $php.Source -S "127.0.0.1:$Port" } finally { Pop-Location }
  exit $LASTEXITCODE
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (!$python) { $python = Get-Command py -ErrorAction SilentlyContinue }
if ($python) {
  Write-Warning "PHP was not found. Starting a static preview; PHP/API pages will not execute."
  Push-Location $source
  try {
    if ($python.Name -eq 'py.exe' -or $python.Name -eq 'py') { & $python.Source -3 -m http.server $Port --bind 127.0.0.1 }
    else { & $python.Source -m http.server $Port --bind 127.0.0.1 }
  } finally { Pop-Location }
  exit $LASTEXITCODE
}

throw "Neither PHP nor Python was found. Install PHP for full local parity, or Python for static preview."
