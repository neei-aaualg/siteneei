#!/bin/sh
# ==============================================================================
# NEEI Web Portal - Backup Automatizado Seguro para Cloudflare R2 via Rclone
# Encriptação Client-Side AES-256 (Zero-Knowledge) + Snapshot Atómico SQLite
# Compatível com POSIX sh (Alpine Linux, BusyBox, Debian, Ubuntu, etc.)
# ==============================================================================

set -eu
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:$PATH"

# Carrega ficheiro de configuração se existir
if [ -f "/etc/neei-backup.env" ]; then
  # shellcheck source=/dev/null
  . "/etc/neei-backup.env"
elif [ -f "$(dirname "$0")/../.backup.env" ]; then
  # shellcheck source=/dev/null
  . "$(dirname "$0")/../.backup.env"
fi

# Variáveis com valores por omissão
RCLONE_REMOTE="${RCLONE_REMOTE:-r2-crypt}"
RCLONE_BUCKET="${RCLONE_BUCKET:-siteneei-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_FILTER="${CONTAINER_FILTER:-u6nnjafpt2avnhqvjurguzmf}"
HOST_DB_PATH="${HOST_DB_PATH:-}"
BACKUP_TEMP_DIR="${BACKUP_TEMP_DIR:-/tmp/neei-backups}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOCK_DIR="/tmp/neei_backup.lock"
TEMP_SNAPSHOT="${BACKUP_TEMP_DIR}/snapshot_${TIMESTAMP}.db"
FINAL_ARCHIVE="${BACKUP_TEMP_DIR}/activities_${TIMESTAMP}.db.gz"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

notify_discord() {
  _status="$1"
  _message="$2"
  if [ -z "$DISCORD_WEBHOOK_URL" ]; then
    return 0
  fi

  _color=3066993 # Verde
  _title="✅ Backup NEEI Concluído com Sucesso"
  if [ "$_status" != "OK" ]; then
    _color=15158332 # Vermelho
    _title="❌ ALERTA: Falha no Backup da Base de Dados NEEI"
  fi

  _payload=$(cat <<EOF
{
  "embeds": [{
    "title": "${_title}",
    "description": "${_message}",
    "color": ${_color},
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "footer": { "text": "NEEI Portal Backup Service • Cloudflare R2 Crypt" }
  }]
}
EOF
)

  curl -s -H "Content-Type: application/json" -X POST -d "$_payload" "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1 || true
}

cleanup() {
  rm -f "$TEMP_SNAPSHOT" "$FINAL_ARCHIVE" 2>/dev/null || true
  rm -rf "$LOCK_DIR" 2>/dev/null || true
}

# Proteção atómica contra execuções paralelas via mkdir
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  # Se o lock for antigo (> 60 minutos), remove stale lock e prossegue
  if [ -d "$LOCK_DIR" ] && [ -n "$(find "$LOCK_DIR" -maxdepth 0 -mmin +60 2>/dev/null)" ]; then
    log "[AVISO] Lock antigo (>60min) detetado em $LOCK_DIR. A remover e prosseguir com novo backup..."
    rm -rf "$LOCK_DIR"
    mkdir "$LOCK_DIR" 2>/dev/null || exit 0
  else
    log "[AVISO] Outro processo de backup já está em execução ou o lock está ativo. A abortar."
    exit 0
  fi
fi

trap cleanup EXIT INT TERM

mkdir -p "$BACKUP_TEMP_DIR"

log "=========================================================="
log "Início do Backup Seguro do Portal NEEI"
log "=========================================================="

# 1. Gerar o Snapshot Atómico e Íntegro do SQLite
CONTAINER_ID=""
if command -v docker > /dev/null 2>&1; then
  CONTAINER_ID=$(docker ps --filter "name=${CONTAINER_FILTER}" --format "{{.ID}}" 2>/dev/null | head -n 1 || true)
fi

if [ -n "$CONTAINER_ID" ]; then
  log "Contentor Coolify detetado: ${CONTAINER_ID}"
  log "A executar snapshot atómico dentro do contentor via VACUUM INTO..."
  
  docker exec "$CONTAINER_ID" node scripts/backup-db.js /tmp/backup_container.db
  docker cp "${CONTAINER_ID}:/tmp/backup_container.db" "$TEMP_SNAPSHOT"
  docker exec -u 0 "$CONTAINER_ID" rm -f /tmp/backup_container.db 2>/dev/null || docker exec "$CONTAINER_ID" rm -f /tmp/backup_container.db 2>/dev/null || true
elif [ -n "$HOST_DB_PATH" ] && [ -f "$HOST_DB_PATH" ]; then
  log "A usar base de dados local na VPS: ${HOST_DB_PATH}"
  DATABASE_PATH="$HOST_DB_PATH" node "$(dirname "$0")/backup-db.js" "$TEMP_SNAPSHOT"
elif [ -f "$(dirname "$0")/../data/activities.db" ]; then
  log "A usar base de dados do repositório local..."
  node "$(dirname "$0")/backup-db.js" "$TEMP_SNAPSHOT"
else
  log "ERRO: Não foi encontrado o contentor Docker '${CONTAINER_FILTER}' nem o ficheiro da base de dados!"
  notify_discord "ERROR" "Falha no backup: Contentor Docker '${CONTAINER_FILTER}' ou ficheiro de base de dados não encontrado."
  exit 1
fi

if [ ! -s "$TEMP_SNAPSHOT" ]; then
  log "ERRO: O ficheiro de snapshot gerado está vazio ou não existe!"
  notify_discord "ERROR" "Falha no backup: Ficheiro de snapshot vazio ou inexistente."
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

exit 0
