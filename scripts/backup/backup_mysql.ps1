<#
.SYNOPSIS
    Atlas Voyage - Script de sauvegarde MySQL (PowerShell / Windows)
.DESCRIPTION
    Exécute un dump cohérent de la base de données avec mysqldump, compresse en .gz / .zip,
    et applique une rotation des archives selon la politique de rétention (7 jours par défaut).
#>
param(
    [string]$DbHost = $(if ($env:DB_HOST) { $env:DB_HOST } else { "127.0.0.1" }),
    [string]$DbPort = $(if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }),
    [string]$DbName = $(if ($env:DB_NAME) { $env:DB_NAME } else { "travel_agency_db" }),
    [string]$DbUser = $(if ($env:DB_USER) { $env:DB_USER } else { "root" }),
    [string]$DbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" }),
    [string]$BackupDir = $(if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { "$PSScriptRoot\..\..\backups" }),
    [int]$RetentionDays = 7
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$sqlFile = Join-Path $BackupDir "${DbName}_${timestamp}.sql"
$zipFile = Join-Path $BackupDir "${DbName}_${timestamp}.sql.zip"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Démarrage de la sauvegarde de $DbName sur $DbHost:$DbPort..."

$dumpArgs = @(
    "-h", $DbHost,
    "-P", $DbPort,
    "-u", $DbUser,
    "--single-transaction",
    "--routines",
    "--triggers",
    "--default-character-set=utf8mb4",
    "--hex-blob",
    "--result-file=$sqlFile",
    $DbName
)

if ($DbPassword -ne "") {
    $env:MYSQL_PWD = $DbPassword
}

try {
    & mysqldump.exe @dumpArgs
    if ($LASTEXITCODE -ne 0) {
        throw "mysqldump a échoué avec le code de sortie $LASTEXITCODE"
    }

    # Compression au format ZIP standard
    Compress-Archive -Path $sqlFile -DestinationPath $zipFile -Force
    Remove-Item -Path $sqlFile -Force

    $fileInfo = Get-Item $zipFile
    $sizeKb = [math]::Round($fileInfo.Length / 1KB, 2)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Sauvegarde compressée avec succès : $zipFile ($sizeKb Ko)"

    # Rotation des sauvegardes
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Rotation : nettoyage des archives de plus de $RetentionDays jours..."
    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "${DbName}_*.zip" | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
        Write-Host "Suppression ancienne archive : $($_.Name)"
        Remove-Item -Path $_.FullName -Force
    }

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Procédure de sauvegarde terminée avec succès."
} finally {
    if ($env:MYSQL_PWD) {
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    }
}

