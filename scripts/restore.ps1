# Restore the database from a dump produced by backup.ps1 / backup.sh.
# THIS OVERWRITES THE CURRENT DATA. Run with PowerShell 7+ (pwsh):
#   pwsh -File scripts\restore.ps1 backups\uniquepm-YYYYMMDD-HHmmss.sql

param([Parameter(Mandatory = $true)][string]$File)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path $File)) { throw "No such file: $File" }

Get-Content .env | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
  $name, $value = $_ -split '=', 2
  Set-Item -Path "env:$($name.Trim())" -Value $value.Trim()
}

Write-Host "Restoring '$File' into database '$($env:POSTGRES_DB)'. This overwrites current data."
if ((Read-Host "Type 'yes' to continue") -ne 'yes') { Write-Host 'Aborted.'; exit 1 }

Get-Content $File -Raw | docker compose exec -T db psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB
Write-Host 'Restore complete. Restart the API if it was running: docker compose restart api'
