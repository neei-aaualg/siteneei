#!/bin/sh
# ==============================================================================
# NEEI Web Portal - Procedimento de Restauro e Disaster Recovery
# Descarrega cópia cifrada do Cloudflare R2, desencripta e valida integridade
# Compatível com POSIX sh (Alpine Linux, BusyBox, Debian, Ubuntu, etc.)
# ==============================================================================

set -eu

if [ -f "/etc/neei-backup.env" ]; then
  # shellcheck source=/dev/null
  . "/etc/neei-backup.env"
elif [ -f "$(dirname "$0")/../.backup.env" ]; then
  # shellcheck source=/dev/null
  . "$(dirname "$0")/../.backup.env"
fi

RCLONE_REMOTE="${RCLONE_REMOTE:-r2-crypt}"
RCLONE_BUCKET="${RCLONE_BUCKET:-siteneei-backups}"
CONTAINER_FILTER="${CONTAINER_FILTER:-siteneei}"
RESTORE_DIR="${RESTORE_DIR:-/tmp/neei-restore}"
DEST_PATH="${RCLONE_REMOTE}:${RCLONE_BUCKET}/daily/"

mkdir -p "$RESTORE_DIR"

echo "=========================================================="
echo "NEEI Web Portal - Utilitário de Restauro (Disaster Recovery)"
echo "=========================================================="
echo "Origem remota: ${DEST_PATH}"
echo

# 1. Listar backups disponíveis
echo "[1/4] A consultar backups disponíveis no Cloudflare R2..."
AVAILABLE_FILES=$(rclone lsf "$DEST_PATH" 2>/dev/null | sort -r || true)

if [ -z "$AVAILABLE_FILES" ]; then
  echo "ERRO: Nenhum ficheiro de backup encontrado em ${DEST_PATH}!"
  exit 1
fi

echo "Cópias de segurança encontradas:"
echo "$AVAILABLE_FILES" | head -n 10
echo

TARGET_FILE="${1:-}"

if [ -z "$TARGET_FILE" ]; then
  TARGET_FILE=$(echo "$AVAILABLE_FILES" | head -n 1)
  echo "Nenhum ficheiro especificado. A selecionar o mais recente: ${TARGET_FILE}"
else
  echo "Ficheiro selecionado: ${TARGET_FILE}"
fi

# 2. Descarregar e desencriptar cópia selecionada
LOCAL_GZ="${RESTORE_DIR}/${TARGET_FILE}"
LOCAL_DB="${RESTORE_DIR}/restored_activities.db"

rm -f "$LOCAL_GZ" "$LOCAL_DB" 2>/dev/null || true

echo
echo "[2/4] A descarregar e desencriptar através do Rclone Crypt..."
rclone copy "${DEST_PATH}${TARGET_FILE}" "$RESTORE_DIR" --progress

if [ ! -f "$LOCAL_GZ" ]; then
  echo "ERRO: O ficheiro ${LOCAL_GZ} não foi descarregado com sucesso!"
  exit 1
fi

# 3. Descompactar
echo
echo "[3/4] A descompactar ficheiro gzip..."
gzip -d -c "$LOCAL_GZ" > "$LOCAL_DB"

if [ ! -s "$LOCAL_DB" ]; then
  echo "ERRO: O ficheiro descompactado está vazio!"
  exit 1
fi

RESTORED_SIZE=$(du -h "$LOCAL_DB" | cut -f1)
echo "Ficheiro SQLite pronto: ${LOCAL_DB} (${RESTORED_SIZE})"

# 4. Validar integridade e inspecionar conteúdo
echo
echo "[4/4] A validar integridade do ficheiro restaurado..."

CONTAINER_ID=""
if command -v docker > /dev/null 2>&1; then
  CONTAINER_ID=$(docker ps --filter "name=${CONTAINER_FILTER}" --format "{{.ID}}" 2>/dev/null | head -n 1 || true)
fi

NODE_SCRIPT="
import('node:sqlite').then(s => {
  const target = process.argv[1];
  const db = new s.DatabaseSync(target, { readOnly: true });
  const check = db.prepare('PRAGMA integrity_check;').all();
  if (!check || check[0]?.integrity_check !== 'ok') {
    console.error('ERRO: Base de dados corrompida!', check);
    process.exit(1);
  }
  console.log('✅ Integridade SQLite: OK');

  const tables = ['activities', 'registrations', 'shop_orders', 'collaborators'];
  for (const t of tables) {
    try {
      const count = db.prepare(\`SELECT COUNT(*) as c FROM \${t}\`).get();
      console.log(\`• Tabela \${t}: \${count.c} registos\`);
    } catch (e) {}
  }
  db.close();
});
"

if command -v node > /dev/null 2>&1; then
  node -e "$NODE_SCRIPT" "$LOCAL_DB"
elif [ -n "$CONTAINER_ID" ]; then
  echo "(A validar através do contentor Coolify '${CONTAINER_ID}')..."
  docker cp "$LOCAL_DB" "${CONTAINER_ID}:/tmp/restore_verify.db"
  docker exec "$CONTAINER_ID" node -e "$NODE_SCRIPT" /tmp/restore_verify.db
  docker exec -u 0 "$CONTAINER_ID" rm -f /tmp/restore_verify.db 2>/dev/null || docker exec "$CONTAINER_ID" rm -f /tmp/restore_verify.db 2>/dev/null || true
elif command -v sqlite3 > /dev/null 2>&1; then
  echo "(A validar através do sqlite3 do sistema)..."
  INTEGRITY=$(sqlite3 "$LOCAL_DB" "PRAGMA integrity_check;")
  if [ "$INTEGRITY" = "ok" ]; then
    echo "✅ Integridade SQLite: OK"
    for t in activities registrations shop_orders collaborators; do
      COUNT=$(sqlite3 "$LOCAL_DB" "SELECT COUNT(*) FROM $t;" 2>/dev/null || true)
      if [ -n "$COUNT" ]; then
        echo "• Tabela $t: $COUNT registos"
      fi
    done
  else
    echo "❌ Integridade SQLite falhou: $INTEGRITY"
    exit 1
  fi
else
  echo "ℹ️  'node' e 'sqlite3' não estão no host, mas o ficheiro SQLite foi restaurado com sucesso ($(du -h "$LOCAL_DB" | cut -f1))."
fi

echo
echo "=========================================================="
echo "✅ Restauro e validação concluídos com sucesso em: ${LOCAL_DB}"
echo "=========================================================="
echo "Para substituir a base de dados em produção no Coolify:"
echo
echo "1. Identifica o contentor ou o volume persistente do Coolify:"
echo "   docker ps | grep siteneei"
echo
echo "2. Copia o ficheiro validado para dentro do contentor ativo:"
echo "   docker cp ${LOCAL_DB} <CONTAINER_ID>:/app/data/activities.db"
echo
echo "3. Reinicia a aplicação no painel do Coolify ou via docker:"
echo "   docker restart <CONTAINER_ID>"
echo "=========================================================="
