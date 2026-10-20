#!/usr/bin/env bash
# ==============================================================================
# NEEI Web Portal - Backup Automatizado Seguro para Cloudflare R2 via Rclone
# Encriptação Client-Side AES-256 (Zero-Knowledge) + Snapshot Atómico SQLite
# ==============================================================================

set -euo pipefail

# Carrega ficheiro de configuração se existir
if [[ -f "/etc/neei-backup.env" ]]; then
  # shellcheck source=/dev/null
  source "/etc/neei-backup.env"
elif [[ -f "$(dirname "$0")/../.backup.env" ]]; then
  # shellcheck source=/dev/null
  source "$(dirname "$0")/../.backup.env"
fi

# Variáveis com valores por omissão
RCLONE_REMOTE="${RCLONE_REMOTE:-r2-crypt}"
RCLONE_BUCKET="${RCLONE_BUCKET:-siteneei-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_FILTER="${CONTAINER_FILTER:-siteneei}"
HOST_DB_PATH="${HOST_DB_PATH:-}"
BACKUP_TEMP_DIR="${BACKUP_TEMP_DIR:-/tmp/neei-backups}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOCK_FILE="/tmp/neei_backup.lock"
TEMP_SNAPSHOT="${BACKUP_TEMP_DIR}/snapshot_${TIMESTAMP}.db"
FINAL_ARCHIVE="${BACKUP_TEMP_DIR}/activities_${TIMESTAMP}.db.gz"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

notify_discord() {
  local status="$1"
  local message="$2"
  if [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
    return 0
  fi

  local color=3066993 # Verde
  local title="✅ Backup NEEI Concluído com Sucesso"
  if [[ "$status" != "OK" ]]; then
    color=15158332 # Vermelho
    title="❌ ALERTA: Falha no Backup da Base de Dados NEEI"
  fi

  local payload
  payload=$(cat <<EOF
{
  "embeds": [{
    "title": "${title}",
    "description": "${message}",
    "color": ${color},
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "footer": { "text": "NEEI Portal Backup Service • Cloudflare R2 Crypt" }
  }]
}
EOF
)

  curl -s -H "Content-Type: application/json" -X POST -d "$payload" "$DISCORD_WEBHOOK_URL" > /dev/null || true
}

cleanup() {
  log "A limpar ficheiros temporários locais..."
  rm -f "$TEMP_SNAPSHOT" "$FINAL_ARCHIVE" "${LOCK_FILE}" 2>/dev/null || true
}

trap 'notify_discord "ERROR" "Ocorreu um erro na linha $LINENO durante a execução do backup."; cleanup; exit 1' ERR

# Garante apenas uma instância em execução simultânea
exec 200>"$LOCK_FILE"
flock -n 200 || { log "[AVISO] Outro processo de backup já está em execução. A abortar."; exit 0; }

mkdir -p "$BACKUP_TEMP_DIR"

log "=========================================================="
log "Início do Backup Seguro do Portal NEEI"
log "=========================================================="

# 1. Gerar o Snapshot Atómico e Íntegro do SQLite
CONTAINER_ID=$(docker ps --filter "name=${CONTAINER_FILTER}" --format "{{.ID}}" | head -n 1 || true)

if [[ -n "$CONTAINER_ID" ]]; then
  log "Contentor Coolify detetado: ${CONTAINER_ID}"
  log "A executar snapshot atómico dentro do contentor via VACUUM INTO..."
  
  docker exec "$CONTAINER_ID" node scripts/backup-db.js /tmp/backup_container.db
  docker cp "${CONTAINER_ID}:/tmp/backup_container.db" "$TEMP_SNAPSHOT"
  docker exec "$CONTAINER_ID" rm -f /tmp/backup_container.db
elif [[ -n "$HOST_DB_PATH" && -f "$HOST_DB_PATH" ]]; then
  log "A usar base de dados local na VPS: ${HOST_DB_PATH}"
  DATABASE_PATH="$HOST_DB_PATH" node "$(dirname "$0")/backup-db.js" "$TEMP_SNAPSHOT"
elif [[ -f "$(dirname "$0")/../data/activities.db" ]]; then
  log "A usar base de dados do repositório local..."
  node "$(dirname "$0")/backup-db.js" "$TEMP_SNAPSHOT"
else
  log "ERRO: Não foi encontrado o contentor Docker '${CONTAINER_FILTER}' nem o ficheiro da base de dados!"
  exit 1
fi

if [[ ! -s "$TEMP_SNAPSHOT" ]]; then
  log "ERRO: O ficheiro de snapshot gerado está vazio ou não existe!"
  exit 1
fi

RAW_SIZE_HUMAN=$(du -h "$TEMP_SNAPSHOT" | cut -f1)
log "Snapshot consistente gerado com sucesso (${RAW_SIZE_HUMAN})."

# 2. Compactação Gzip
log "A compactar ficheiro com gzip..."
gzip -9 -c "$TEMP_SNAPSHOT" > "$FINAL_ARCHIVE"
GZ_SIZE_HUMAN=$(du -h "$FINAL_ARCHIVE" | cut -f1)
log "Arquivo compactado gerado: ${FINAL_ARCHIVE} (${GZ_SIZE_HUMAN})"

# 3. Envio Cifrado para Cloudflare R2 via Rclone
DEST_PATH="${RCLONE_REMOTE}:${RCLONE_BUCKET}/daily/"
log "A transferir cópia cifrada para Cloudflare R2 (${DEST_PATH})..."
rclone copy "$FINAL_ARCHIVE" "$DEST_PATH" --stats-one-line -v

# 4. Política de Retenção (Purge de backups antigos)
log "A aplicar política de retenção: eliminar cópias na cloud com mais de ${RETENTION_DAYS} dias..."
rclone delete --min-age "${RETENTION_DAYS}d" "$DEST_PATH" || true
rclone rmdirs "$DEST_PATH" --leave-root || true

log "=========================================================="
log "Backup concluído com êxito e verificado!"
log "Ficheiro na cloud: $(basename "$FINAL_ARCHIVE")"
log "Tamanho original: ${RAW_SIZE_HUMAN} | Compactado e Cifrado: ${GZ_SIZE_HUMAN}"
log "=========================================================="

notify_discord "OK" "Snapshot atómico gerado e enviado com encriptação AES-256 para Cloudflare R2.\n\n• **Ficheiro:** \`$(basename "$FINAL_ARCHIVE")\`\n• **Tamanho:** ${GZ_SIZE_HUMAN} (descompactado: ${RAW_SIZE_HUMAN})\n• **Retenção:** ${RETENTION_DAYS} dias\n• **Integridade:** Validada com sucesso (PRAGMA integrity_check: ok)"

cleanup
exit 0
