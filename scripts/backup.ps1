# Nightly backup for a Windows host. Dumps the whole uniquepm database to a
# timestamped .sql file in .\backups, then prunes dumps past the retention window.
#
# Run with PowerShell 7+ (pwsh) so the .sql file is written without a BOM:
#   pwsh -File scripts\backup.ps1
# Requires the stack running (docker compose up) and a filled-in .env.

$ErrorActionPreference = 'Stop'
$RetentionDays = 14

Set-Location (Split-Path $PSScriptRoot -Parent)
New-Item -ItemType Directory -Force -Path backups | Out-Null

# Load POSTGRES_USER / POSTGRES_DB from .env
Get-Content .env | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
  $name, $value = $_ -split '=', 2
  Set-Item -Path "env:$($name.Trim())" -Value $value.Trim()
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$file = "backups/uniquepm-$stamp.sql"

docker compose exec -T db pg_dump -U $env:POSTGRES_USER -d $env:POSTGRES_DB --clean --if-exists |
  Set-Content -Path $file -Encoding utf8

Write-Host "Backup written: $file"

Get-ChildItem backups -Filter 'uniquepm-*.sql' |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) } |
  Remove-Item
