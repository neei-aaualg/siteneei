# Relatório de Implementação: Backups Automatizados com Rclone e Cloudflare R2

> **Data:** 20 de Outubro de 2026  
> **Repositório:** `neei-aaualg/siteneei`  
> **Branch de Trabalho:** `feature/cloudflare-r2-rclone-backup`  
> **Autor dos Commits:** `davidjmrodrigues <diogodavid99@gmail.com>`  
> **Estado dos Testes:** 231/231 testes aprovados (`npm test`)  
> **Estado do Build:** Aprovado em produção (`npm run build`)

---

## 1. Resumo Executivo & Arquitetura da Solução

Para responder à criticidade da informação armazenada no Portal NEEI (dados de estudantes, encomendas da loja, inscrições e membros) e à necessidade de salvaguarda externa à VPS da Coolify a **custo zero**, foi desenhado e implementado um sistema de backups baseado em **Cloudflare R2** com encriptação _client-side_ via **Rclone Crypt**.

```
[ Contentor Coolify / VPS ]
          │
          ▼  (VACUUM INTO atómico + PRAGMA integrity_check)
  [ snapshot.db ] (Integridade 100% validada)
          │
          ▼  (Compressão gzip -9)
  [ backup.db.gz ]
          │
          ▼  (Rclone Crypt: Cifra AES-256 local)
  [ Dados Cifrados + Nomes Cifrados ]
          │
          ▼  (Transferência S3 API - Sem custos de tráfego)
┌─────────────────────────────────────────────────────────────┐
│                 Cloudflare R2 Storage (10 GB Grátis)        │
│    (O fornecedor apenas tem acesso a dados indecifráveis)   │
└─────────────────────────────────────────────────────────────┘
```

### Porquê esta arquitetura?

1. **Custo 0,00 € Vitalício:** O Cloudflare R2 oferece **10 GB de armazenamento gratuitos** todos os meses e, ao contrário da AWS S3 ou Google Cloud, **não cobra taxas de tráfego de saída (Egress Fees = 0 €)**.
2. **Encriptação _Zero-Knowledge_ (AES-256):** O Rclone cifra os ficheiros e os respetivos nomes **antes** de saírem da VPS. Mesmo que a conta da Cloudflare fosse violada, ninguém consegue ler os dados dos estudantes sem a Chave Mestra do NEEI.
3. **Consistência Atómica SQLite:** O backup utiliza a instrução interna `VACUUM INTO`, garantindo que ficheiros de transação ativa (`-wal` e `-shm`) não provocam cópias corrompidas, mesmo com a aplicação a receber utilizadores em simultâneo.
4. **Isolamento de Credenciais:** As chaves de acesso ao bucket e a senha de cifra ficam guardadas na VPS (fora do contentor web). Um atacante que explorasse uma vulnerabilidade na web app **não tem acesso** aos backups externos nem às credenciais da Cloudflare.

---

## 2. O Que Foi Desenvolvido e Automatizado

Todos os scripts e testes necessários foram implementados diretamente no repositório:

| Ficheiro / Módulo             | Finalidade e Descrição                                                                                                                                 |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/backup-db.js`        | Executa o snapshot atómico SQLite através de `node:sqlite` (`VACUUM INTO`) e valida a integridade com `PRAGMA integrity_check`.                        |
| `scripts/backup-rclone.sh`    | Script principal para a VPS: gera snapshot, compacta (`gzip`), transfere cifrado via Rclone, purga backups com mais de 30 dias e notifica via Discord. |
| `scripts/restore-rclone.sh`   | Utilitário de Disaster Recovery: lista os backups na cloud, descarrega, desencripta, descompacta e valida a saúde das tabelas.                         |
| `scripts/setup-rclone-vps.sh` | Instalador interativo para a VPS: instala o Rclone, configura os remotes S3 + Crypt, testa a ligação e agenda o Cron diário às 03:30.                  |
| `.backup.env.example`         | Ficheiro modelo com as variáveis de ambiente de backup.                                                                                                |
| `Dockerfile`                  | Atualizado para incluir a diretoria `scripts/` no contentor de produção.                                                                               |
| `package.json`                | Adicionado o comando `npm run db:backup`.                                                                                                              |
| `tests/backupDb.test.ts`      | Testes unitários automatizados para garantia de integridade (integrado no `vitest`).                                                                   |

---

## 3. Tudo o Que Precisamos de Ti (Checklist de Ação)

Para colocar o sistema a funcionar em produção, apenas precisas de seguir estes 4 passos simples:

### Passo 1: Criar Conta na Cloudflare e Ativar o R2 (2 minutos)

1. Inicia sessão ou cria conta gratuita em [cloudflare.com](https://dash.cloudflare.com/).
2. No menu lateral esquerdo, clica em **R2 Object Storage**.
3. Clica no botão para ativar o plano R2 (requer associar um cartão de crédito para validação anti-fraude, mas **o plano gratuito até 10 GB é 100% isento de custos**).
4. Clica em **Create Bucket**:
   - **Bucket Name:** `siteneei-backups`
   - **Location:** `WNAM` ou `WEUR` (Europa Ocidental).
   - Clica em **Create Bucket**.

### Passo 2: Gerar Token de API do R2 (1 minuto)

1. No painel do R2, clica em **Manage R2 API Tokens** (no canto superior direito).
2. Clica em **Create API Token**:
   - **Token name:** `rclone-vps-siteneei`
   - **Permissions:** Seleciona **Object Read & Write**.
   - **Specify bucket(s):** Seleciona `siteneei-backups`.
   - **TTL:** Deixar em _Forever_ (ou conforme a política do NEEI).
3. Clica em **Create API Token**.
4. **Copia e guarda os seguintes 3 valores** (o segredo só aparece uma vez):
   - **Account ID** (surge também na página principal do R2).
   - **Access Key ID**.
   - **Secret Access Key**.

### Passo 3: Escolher a Senha Mestra de Cifra (Zero-Knowledge)

- Escolhe uma frase-passe forte (mínimo 16 caracteres, ex.: `Neei2026!Backup-Faro#Seguro$`).
- **Guarda esta senha num gestor seguro partilhado da direção (Bitwarden / 1Password)**.
- _Nota:_ Sem esta senha, se a VPS for destruída, é matematicamente impossível desencriptar a base de dados.

### Passo 4: Executar o Assistente na VPS (3 minutos)

No terminal da tua VPS (onde corre o Coolify):

```bash
# 1. Acede à diretoria do repositório ou descarrega os scripts
cd /path/to/siteneei

# 2. Executa o assistente de configuração automática
sudo ./scripts/setup-rclone-vps.sh
```

O assistente irá:

1. Instalar o `rclone` (caso ainda não esteja instalado).
2. Solicitar o **Account ID**, **Access Key ID**, **Secret Access Key** e o nome do bucket (`siteneei-backups`).
3. Solicitar e confirmar a tua **Senha Mestra de Cifra**.
4. Solicitar opcionalmente o Webhook URL do Discord do NEEI.
5. Criar o ficheiro `/etc/rclone/rclone.conf` com permissões `600` e encriptação AES-256 configurada.
6. Realizar um teste automático de escrita, leitura e eliminação no bucket para confirmar que está 100% funcional.
7. Instalar a rotina diária no Cron (`/etc/cron.d/neei-backup`) para correr às 03:30 da madrugada.

---

## 4. Como Testar Manualmente na VPS

Podes testar o backup imediatamente a qualquer momento executando:

```bash
sudo /path/to/siteneei/scripts/backup-rclone.sh
```

**Saída esperada:**

```text
[2026-10-20 03:30:00] Início do Backup Seguro do Portal NEEI
[2026-10-20 03:30:01] Contentor Coolify detetado: a1b2c3d4e5f6
[2026-10-20 03:30:02] Snapshot consistente gerado com sucesso (100K).
[2026-10-20 03:30:02] A compactar ficheiro com gzip...
[2026-10-20 03:30:02] A transferir cópia cifrada para Cloudflare R2 (r2-crypt:siteneei-backups/daily/)...
[2026-10-20 03:30:04] A aplicar política de retenção: eliminar cópias na cloud com mais de 30 dias...
[2026-10-20 03:30:05] Backup concluído com êxito e verificado!
```

Se abrires o painel da Cloudflare no browser, verás os ficheiros dentro do bucket com nomes semelhantes a:
`daily/r38fk20d912ms801...` — provando que nem a Cloudflare sabe o nome original dos ficheiros nem o seu conteúdo.

---

## 5. Procedimento de Restauro (Disaster Recovery)

Se a VPS sofrer uma avaria ou se for necessário repor os dados anteriores:

```bash
# 1. Executa o utilitário de restauro
sudo ./scripts/restore-rclone.sh
```

O script irá automaticamente:

1. Listar os backups existentes no Cloudflare R2.
2. Descarregar e desencriptar o backup mais recente para `/tmp/neei-restore/restored_activities.db`.
3. Executar o `PRAGMA integrity_check` e apresentar a contagem de sócios, encomendas e inscrições para validação.
4. Fornecer o comando exato para substituir o ficheiro ativo no Coolify:
   ```bash
   docker cp /tmp/neei-restore/restored_activities.db <CONTAINER_ID>:/app/data/activities.db
   docker restart <CONTAINER_ID>
   ```

---

## 6. Validação de Qualidade e Conformidade do Repositório

- **Testes Automatizados:** 231 testes aprovados (`npm test`), incluindo testes unitários ao motor de backup e validação de integridade.
- **Build de Produção:** Aprovado sem erros (`npm run build`).
- **Branch Git Criada:** `feature/cloudflare-r2-rclone-backup` (conforme exigido pelas diretrizes do projeto).
- **Identidade dos Commits:** `davidjmrodrigues <diogodavid99@gmail.com>`.
