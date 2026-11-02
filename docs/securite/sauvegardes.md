# Stratégie de Sauvegarde, Restauration et PRA — Atlas Voyage

## 1. Objectifs de Continuité d'Activité

La stratégie de sauvegarde et de reprise après sinistre d'Atlas Voyage s'articule autour de deux indicateurs majeurs :

- **RPO (Recovery Point Objective) : 24 heures** (1 heure avec réplication binaire active des binlogs MySQL).
- **RTO (Recovery Time Objective) : 1 heure** pour rétablir une instance pleinement opérationnelle sur un environnement de secours.

## 2. Politique de Sauvegarde

### 2.1 Fréquence des Sauvegardes
- **Sauvegarde complète quotidienne :** Exécutée automatiquement chaque nuit à **02:00 UTC** à l'aide de `mysqldump` en mode transactionnel sans verrouillage bloquant (`--single-transaction`).
- **Sauvegarde incrémentale (production) :** Archivage continu des journaux binaires MySQL (`binlog`) permettant un *Point-In-Time Recovery* (PITR) à la minute près.

### 2.2 Rétention et Cycle de Vie
- **Rétention locale :** 7 jours sur l'hôte applicatif / serveur de base de données.
- **Rétention déportée (Cloud / S3 Chiffré) :** 30 jours pour les sauvegardes quotidiennes, 12 mois pour les sauvegardes mensuelles d'archive comptable.
- **Chiffrement au repos :** Chiffrement AES-256 côté serveur sur le compartiment de stockage déporté (`aws:kms` ou équivalent).

### 2.3 Options d'intégrité `mysqldump`
Les paramètres requis pour garantir un instantané consistant :
```bash
mysqldump -h $DB_HOST -P $DB_PORT -u $DB_USER \
  --single-transaction \
  --routines \
  --triggers \
  --default-character-set=utf8mb4 \
  --hex-blob \
  travel_agency_db | gzip -9 > backup.sql.gz
```

## 3. Procédure de Sauvegarde

### Sous Linux / Serveur POSIX :
```bash
chmod +x scripts/backup/backup_mysql.sh
DB_USER=app_user DB_PASSWORD=SecretPassword! ./scripts/backup/backup_mysql.sh
```

### Sous Windows (PowerShell) :
```powershell
.\scripts\backup\backup_mysql.ps1 -DbUser "root" -DbPassword "SecretPassword!"
```

## 4. Procédure de Restauration

### Restauration en environnement de crise :
1. Arrêter l'application backend pour éviter les conflits d'écriture :
   ```bash
   systemctl stop atlas-voyage
   ```
2. Exécuter la restauration de la dernière archive valide :
   ```powershell
   .\scripts\backup\restore_mysql.ps1 -ArchiveFile ".\backups\travel_agency_db_20261101_020000.sql.zip" -DbUser "root" -DbPassword "SecretPassword!"
   ```
3. Exécuter les migrations Flyway pour s'assurer de l'alignement du schéma :
   ```bash
   mvn flyway:migrate
   ```
4. Redémarrer l'application et valider le endpoint de santé :
   ```bash
   curl -f http://localhost:8080/actuator/health
   ```

## 5. Test Automatisé de Restauration (Drill de Récupération)

Pour prévenir le risque de sauvegardes corrompues et silencieusement inexploitables, un test de restauration automatisé est déclenché de manière hebdomadaire :
```powershell
.\scripts\backup\test_restore_mysql.ps1 -ArchiveFile ".\backups\travel_agency_db_latest.sql.zip" -DbUser "root"
```
Ce test :
1. Crée une base temporaire dédiée `travel_agency_restore_test_<timestamp>`.
2. Restaure intégralement la sauvegarde.
3. Vérifie la consistance des tables vitales (`users`, `offers`, `cities`, `bookings`).
4. Supprime la base temporaire et valide l'intégrité de la chaîne de sauvegarde.

## 6. Plan de Reprise d'Activité (PRA)

En cas de perte totale de l'infrastructure primaire (datacenter indisponible) :
1. **Provisionnement :** Déploiement d'une nouvelle instance MySQL sur le site secondaire à partir des scripts d'infrastructure `mysql_app_user.sql` et des configurations sécurisées.
2. **Restauration :** Rapatriement de la dernière archive chiffrée depuis le stockage déporté et injection via `restore_mysql`.
3. **Application :** Démarrage des conteneurs applicatifs avec le profil `prod` pointant sur la nouvelle base.
4. **Bascule DNS :** Mise à jour des enregistrements DNS publics (TTL réduit à 300s en amont).

