#!/bin/sh
# ==============================================================================
# Atlas Voyage - Script de sauvegarde MySQL (POSIX / Linux / macOS)
# ==============================================================================
set -eu

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-travel_agency_db}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Démarrage de la sauvegarde de ${DB_NAME} sur ${DB_HOST}:${DB_PORT}..."

# Export transactionnel cohérent avec mysqldump
if [ -n "${DB_PASSWORD}" ]; then
  MYSQL_PWD="${DB_PASSWORD}" mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" \
    --single-transaction \
    --routines \
    --triggers \
    --default-character-set=utf8mb4 \
    --hex-blob \
    "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"
else
  mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" \
    --single-transaction \
    --routines \
    --triggers \
    --default-character-set=utf8mb4 \
    --hex-blob \
    "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"
fi

FILE_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Sauvegarde réussie : ${BACKUP_FILE} (${FILE_SIZE})"

# Rotation : suppression des sauvegardes plus anciennes que RETENTION_DAYS
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Rotation : suppression des sauvegardes de plus de ${RETENTION_DAYS} jours..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Sauvegarde et rotation terminées avec succès."

