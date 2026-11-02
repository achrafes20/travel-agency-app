<#
.SYNOPSIS
    Atlas Voyage - Script de restauration MySQL (PowerShell / Windows)
.DESCRIPTION
    Décompresse une archive SQL et applique le dump dans la base de données cible.
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$ArchiveFile,
    [string]$DbHost = $(if ($env:DB_HOST) { $env:DB_HOST } else { "127.0.0.1" }),
    [string]$DbPort = $(if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }),
    [string]$DbName = $(if ($env:DB_NAME) { $env:DB_NAME } else { "travel_agency_db" }),
    [string]$DbUser = $(if ($env:DB_USER) { $env:DB_USER } else { "root" }),
    [string]$DbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" })
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $ArchiveFile)) {
    throw "Le fichier d'archive spécifié n'existe pas : $ArchiveFile"
}

$tempExtractDir = Join-Path $env:TEMP ("atlas_restore_" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempExtractDir -Force | Out-Null

try {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Décompression de l'archive $ArchiveFile..."
    Expand-Archive -Path $ArchiveFile -DestinationPath $tempExtractDir -Force

    $sqlFile = Get-ChildItem -Path $tempExtractDir -Filter "*.sql" | Select-Object -First 1
    if (!$sqlFile) {
        throw "Aucun fichier .sql trouvé dans l'archive décompressée"
    }

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restauration dans la base $DbName sur $DbHost:$DbPort..."
    
    if ($DbPassword -ne "") {
        $env:MYSQL_PWD = $DbPassword
    }

    # Création de la base si elle n'existe pas
    $createCmd = "CREATE DATABASE IF NOT EXISTS \`$DbName\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    & mysql.exe -h $DbHost -P $DbPort -u $DbUser -e $createCmd

    # Restauration du dump
    Get-Content -Path $sqlFile.FullName | & mysql.exe -h $DbHost -P $DbPort -u $DbUser --default-character-set=utf8mb4 $DbName

    if ($LASTEXITCODE -ne 0) {
        throw "La commande mysql a retourné un code d'erreur : $LASTEXITCODE"
    }

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restauration de la base de données terminée avec succès."
} finally {
    if (Test-Path $tempExtractDir) {
        Remove-Item -Path $tempExtractDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    if ($env:MYSQL_PWD) {
        Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
    }
}

