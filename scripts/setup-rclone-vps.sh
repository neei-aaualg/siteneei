#!/usr/bin/env bash
# ==============================================================================
# NEEI Web Portal - Assistente de Configuração do Rclone + Cloudflare R2
# Configura o armazenamento S3 no Cloudflare R2 e a camada de cifra AES-256
# ==============================================================================

set -euo pipefail

echo "=================================================================="
echo "    NEEI Web Portal - Assistente de Setup de Backup Rclone + R2   "
echo "=================================================================="
echo

# 1. Verifica privilégios de root
if [[ $EUID -ne 0 ]]; then
   echo "[AVISO] Recomenda-se executar este instalador como root (ou com sudo) para configurar o cron e ficheiros protegidos."
   echo
fi

# 2. Verifica instalação do rclone
if ! command -v rclone &> /dev/null; then
  echo "[!] O comando 'rclone' não foi detetado no sistema."
  read -rp "Deseja instalar o rclone automaticamente agora? (s/N): " INSTALL_RCLONE
  if [[ "$INSTALL_RCLONE" =~ ^[sSyY]$ ]]; then
    echo "A descarregar e instalar o rclone oficial..."
    curl https://rclone.org/install.sh | bash
  else
    echo "Instalação cancelada. Por favor instala o rclone manualmente ('sudo apt-get install rclone' ou 'curl https://rclone.org/install.sh | bash') e corre novamente este script."
    exit 1
  fi
fi

echo "✅ Rclone detetado: $(rclone version | head -n 1)"
echo

# 3. Solicitação dos dados da Cloudflare e Criptografia
echo "Por favor insere os dados da tua conta Cloudflare R2:"
echo "(Podes consultar estes dados no painel da Cloudflare -> R2 -> Manage R2 API Tokens)"
echo

read -rp "1. Cloudflare Account ID: " CF_ACCOUNT_ID
read -rp "2. R2 Access Key ID: " CF_ACCESS_KEY_ID
read -rsp "3. R2 Secret Access Key: " CF_SECRET_ACCESS_KEY
echo
read -rp "4. Nome do Bucket R2 [por omissão: siteneei-backups]: " CF_BUCKET_NAME
CF_BUCKET_NAME="${CF_BUCKET_NAME:-siteneei-backups}"

echo
echo "--- Configuração da Encriptação AES-256 (Zero-Knowledge) ---"
echo "A password mestra será utilizada para cifrar todos os ficheiros antes de saírem da VPS."
echo "IMPORTANTE: Guarda esta password num gestor seguro (ex.: Bitwarden/1Password do NEEI)."
echo "Sem ela, os backups na Cloudflare tornam-se IMPOSSÍVEIS de recuperar!"
echo

read -rsp "5. Password Mestra de Cifra: " MASTER_PASS
echo
read -rsp "   Confirma a Password Mestra: " MASTER_PASS_CONFIRM
echo

if [[ "$MASTER_PASS" != "$MASTER_PASS_CONFIRM" ]]; then
  echo "❌ As passwords introduzidas não coincidem! Abortando."
  exit 1
fi

if [[ ${#MASTER_PASS} -lt 12 ]]; then
  echo "❌ A password deve ter pelo menos 12 caracteres para segurança adequada."
  exit 1
fi

echo
read -rp "6. Discord Webhook URL para alertas (opcional, prime Enter para ignorar): " DISCORD_URL

# 4. Ofuscação de passwords para o rclone
OBSCURED_PASS=$(rclone obscure "$MASTER_PASS")

# 5. Criação do rclone.conf
RCLONE_CONF_DIR="${HOME}/.config/rclone"
mkdir -p "$RCLONE_CONF_DIR"
RCLONE_CONF_FILE="${RCLONE_CONF_DIR}/rclone.conf"

echo
echo "A configurar o ficheiro ${RCLONE_CONF_FILE}..."

# Faz backup de conf anterior se existir
if [[ -f "$RCLONE_CONF_FILE" ]]; then
  cp "$RCLONE_CONF_FILE" "${RCLONE_CONF_FILE}.bak.$(date +%s)"
fi

# Adiciona ou atualiza os remotes
cat <<EOF > "$RCLONE_CONF_FILE"
[r2-raw]
type = s3
provider = Cloudflare
access_key_id = ${CF_ACCESS_KEY_ID}
secret_access_key = ${CF_SECRET_ACCESS_KEY}
endpoint = https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com
acl = private

[r2-crypt]
type = crypt
remote = r2-raw:${CF_BUCKET_NAME}
password = ${OBSCURED_PASS}
filename_encryption = standard
directory_name_encryption = true
EOF

chmod 600 "$RCLONE_CONF_FILE"
echo "✅ Configuração do Rclone gerada com permissões seguras (600)."

# Se executado como root, também disponibiliza em /etc/rclone/rclone.conf para o cron do sistema
if [[ $EUID -eq 0 ]]; then
  mkdir -p /etc/rclone
  cp "$RCLONE_CONF_FILE" /etc/rclone/rclone.conf
  chmod 600 /etc/rclone/rclone.conf
fi

# 6. Teste de conectividade
echo
echo "A testar conectividade e encriptação com o Cloudflare R2..."
TEST_FILE="/tmp/neei_rclone_test_$(date +%s).txt"
echo "NEEI Backup Connectivity Test $(date)" > "$TEST_FILE"

if rclone copy "$TEST_FILE" "r2-crypt:__connectivity_test/" && \
   rclone ls "r2-crypt:__connectivity_test/" > /dev/null && \
   rclone delete "r2-crypt:__connectivity_test/" && \
   rclone rmdirs "r2-crypt:__connectivity_test/" --leave-root; then
  rm -f "$TEST_FILE"
  echo "✅ Teste de upload, listagem e remoção cifrada no Cloudflare R2 CONCLUÍDO COM SUCESSO!"
else
  rm -f "$TEST_FILE"
  echo "❌ Falha ao comunicar com o bucket Cloudflare R2. Verifica o Account ID, Keys e nome do Bucket."
  exit 1
fi

# 7. Criação do ficheiro de ambiente /etc/neei-backup.env
ENV_FILE="/etc/neei-backup.env"
if [[ $EUID -ne 0 ]]; then
  ENV_FILE="$(dirname "$0")/../.backup.env"
fi

cat <<EOF > "$ENV_FILE"
# Configuração de Backup NEEI Web Portal
RCLONE_REMOTE="r2-crypt"
RCLONE_BUCKET="${CF_BUCKET_NAME}"
RETENTION_DAYS="30"
CONTAINER_FILTER="siteneei"
DISCORD_WEBHOOK_URL="${DISCORD_URL}"
EOF

chmod 600 "$ENV_FILE"
echo "✅ Ficheiro de variáveis criado em: ${ENV_FILE}"

# 8. Instalação do Cron Job (se for root)
CURRENT_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT_PATH="${CURRENT_SCRIPT_DIR}/backup-rclone.sh"

if [[ $EUID -eq 0 ]]; then
  CRON_FILE="/etc/cron.d/neei-backup"
  cat <<EOF > "$CRON_FILE"
# Backup diário da base de dados do Portal NEEI às 03:30 da madrugada
30 3 * * * root ${BACKUP_SCRIPT_PATH} >> /var/log/neei-backup.log 2>&1
EOF
  chmod 644 "$CRON_FILE"
  echo "✅ Tarefa agendada instalada em: ${CRON_FILE} (executa diariamente às 03:30)"
else
  echo
  echo "ℹ️  Para agendar o backup diário no teu utilizador, adiciona a seguinte linha ao 'crontab -e':"
  echo "30 3 * * * ${BACKUP_SCRIPT_PATH} >> /tmp/neei-backup.log 2>&1"
fi

echo
echo "=================================================================="
echo "🎉 Configuração concluída com sucesso!"
echo "Podes testar o backup manualmente executando:"
echo "   ${BACKUP_SCRIPT_PATH}"
echo "=================================================================="
