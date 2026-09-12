# Diretrizes do Projeto NEEI Web Portal

## Ambiente & Execução de Comandos (Windows/PowerShell)
- **Execução do NPM:** No PowerShell do Windows, `npm` pode falhar devido à ExecutionPolicy (`npm.ps1`). Utilize sempre `npm.cmd` para executar comandos de build, testes e instalação de pacotes (ex.: `npm.cmd run build`, `npm.cmd install`).

## Dados Institucionais & Redes Sociais Oficiais
- **Email oficial:** `neei@aaualg.pt` (evitar `geral@neei.pt`).
- **Instagram:** `https://instagram.com/neeiualg`
- **Facebook:** `https://www.facebook.com/NEEIUALG/`
- **Discord:** `https://discord.gg/HzBuRFCAb5`
- **LinkedIn:** `https://www.linkedin.com/company/neeiualg`
- **GitHub:** `https://github.com/neei-aaualg`

## Fluxo de Deploy e Git
- **Deploy via Coolify:** O push para a branch `main` (`origin/main`) aciona automaticamente a re-compilação e deploy no Coolify.
- **Validação prévia:** Execute sempre `npm.cmd run build` com sucesso antes de efetuar merge ou push para a branch `main`.

## Persistência de Dados no Coolify (SQLite)
- **Base de dados:** O SQLite armazena os dados em `/app/data/activities.db`.
- **Volume Persistente Obrigatório:** Os contentores Docker são efémeros por definição; sem volume, cada redeploy apaga a base de dados.
- **Configuração no Coolify:**
  1. No painel da aplicação no Coolify, abrir o separador **Storages** (ou **Persistent Storage**).
  2. Adicionar novo armazenamento persistente com destino (**Destination path**): `/app/data`.
  3. Desta forma, o ficheiro `activities.db` permanece intacto entre builds e redeploys.
## Variáveis de Ambiente & Controlo do Calendário
- **`SHOW_CALENDAR`:** Controla a visibilidade pública do calendário de atividades no portal (`true` por defeito).
  - Se configurada como `false` (ou `0`) nas Environment Variables do Coolify ou `.env`, o calendário e as atividades públicas são ocultados e a página `/eventos` apresenta apenas *"Calendário será anunciado brevemente..."*.
  - O painel de administração (`/admin`) continua 100% funcional para a equipa poder preparar e gerir atividades antes do anúncio oficial.

## Verificação de Portas e Execução Local em Paralelo
- **Porta padrão:** A aplicação utiliza por defeito a porta `3000`.
- **Prevenção de conflitos em paralelo:** Antes de iniciar qualquer servidor local (`npm.cmd run dev`), verificar sempre previamente se a porta 3000 (ou outra pretendida) já está ocupada por outra conversa ou processo a correr em paralelo (ex.: através de `Get-NetTCPConnection`). Se a porta estiver em uso, escolher uma porta livre alternativa (ex.: 3001, 5173, 8080) ou confirmar com o utilizador para evitar colisões entre instâncias.

## Identidade nos Commits Git
- **Autor dos commits:** Todos os commits devem ser sempre assinados com a identidade:
  - `user.name`: `davidjmrodrigues`
  - `user.email`: `diogodavid99@gmail.com`
