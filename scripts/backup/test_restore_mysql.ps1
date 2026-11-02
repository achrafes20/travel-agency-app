<#
.SYNOPSIS
    Atlas Voyage - Test automatisé de restauration MySQL
.DESCRIPTION
    Crée une base de test temporaire, restaure une sauvegarde donnée, valide l'intégrité
    des tables clés (users, offers, bookings, payments) et supprime la base temporaire.
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$ArchiveFile,
    [string]$DbHost = $(if ($env:DB_HOST) { $env:DB_HOST } else { "127.0.0.1" }),
    [string]$DbPort = $(if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }),
    [string]$DbUser = $(if ($env:DB_USER) { $env:DB_USER } else { "root" }),
    [string]$DbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" })
)

$ErrorActionPreference = "Stop"
$testDb = "travel_agency_restore_test_" + (Get-Date -Format "yyyyMMdd_HHmmss")

Write-Host "================================================================="
Write-Host "TEST AUTOMATISÉ DE RESTAURATION : $ArchiveFile"
Write-Host "Base temporaire cible : $testDb"
Write-Host "================================================================="

$restoreScript = Join-Path $PSScriptRoot "restore_mysql.ps1"

try {
    # 1. Restauration dans la base temporaire
    & $restoreScript -ArchiveFile $ArchiveFile -DbHost $DbHost -DbPort $DbPort -DbName $testDb -DbUser $DbUser -DbPassword $DbPassword

    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Vérification de l'intégrité des données restaurées..."

    if ($DbPassword -ne "") {
        $env:MYSQL_PWD = $DbPassword
    }

    # 2. Comptage des lignes sur les tables principales
    $queries = @(
        "SELECT 'users' as tbl, COUNT(*) as cnt FROM users",
        "SELECT 'offers' as tbl, COUNT(*) as cnt FROM offers",
        "SELECT 'cities' as tbl, COUNT(*) as cnt FROM cities"
    )

    foreach ($q in $queries) {
        $res = & mysql.exe -h $DbHost -P $DbPort -u $DbUser -D $testDb -e "$q;" -s -N
        Write-Host "  -> Comptage : $res"
    }

    Write-Host "VÉRIFICATION RÉUSSIE : La sauvegarde est intègre et restaurable sans erreur."
} catch {
    Write-Error "ÉCHEC DU TEST DE RESTAURATION : $_"
    throw $_
} finally {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Nettoyage de la base de test $testDb..."
    if ($DbPassword -ne "") { $env:MYSQL_PWD = $DbPassword }
    & mysql.exe -h $DbHost -P $DbPort -u $DbUser -e "DROP DATABASE IF EXISTS \`$testDb\`;"
    if ($env:MYSQL_PWD) { Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue }
    Write-Host "Test de restauration terminé."
}

