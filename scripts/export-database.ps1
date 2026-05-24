# Exporta la base de datos PostgreSQL de Arenas360
# Uso: .\scripts\export-database.ps1
# Opcional: .\scripts\export-database.ps1 -FullOnly

param(
    [switch]$FullOnly,
    [string]$Host = "127.0.0.1",
    [int]$Port = 5432,
    [string]$User = "postgres",
    [string]$Database = "ArenasApp",
    [string]$Password = "arenas360",
    [string]$OutputDir = "$PSScriptRoot\..\database"
)

$pgDump = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
if (-not (Test-Path $pgDump)) {
    Write-Error "No se encontró pg_dump en $pgDump. Instala PostgreSQL o ajusta la ruta."
    exit 1
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$env:PGPASSWORD = $Password

if (-not $FullOnly) {
    $schemaFile = Join-Path $OutputDir "arenasapp_schema.sql"
    & $pgDump -h $Host -p $Port -U $User -d $Database --schema-only --no-owner --no-privileges -f $schemaFile
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "Esquema exportado: $schemaFile"
}

$fullFile = Join-Path $OutputDir "arenasapp_full.sql"
& $pgDump -h $Host -p $Port -U $User -d $Database --no-owner --no-privileges -f $fullFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Copia completa exportada: $fullFile"
