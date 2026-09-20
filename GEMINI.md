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

## Variáveis de Ambiente & Controlo do Calendário e Loja

- **`SHOW_CALENDAR`:** Controla a visibilidade pública do calendário de atividades no portal (`true` por defeito).
  - Se configurada como `false` (ou `0`) nas Environment Variables do Coolify ou `.env`, o calendário e as atividades públicas são ocultados e a página `/eventos` apresenta apenas _"Calendário será anunciado brevemente..."_.
  - O painel de administração (`/admin`) continua 100% funcional para a equipa poder preparar e gerir atividades antes do anúncio oficial.
- **`SWEATS_AVAILABLE`:** Controla a visibilidade pública das sweats/merchandise (`true` por defeito).
  - Se configurada como `false`, o público geral vê a mensagem de anúncio breve e as encomendas públicas ficam bloqueadas.
- **`SHOW_TEST_SHOP`:** Controla a disponibilização da loja de teste para administradores (`true` por defeito).
  - Quando ativa, os administradores autenticados podem aceder à loja em modo preview com preço especial de **0.50€** (mínimo Stripe) para validar pagamentos reais no telemóvel sem limitações de sandbox.
  - Se configurada como `false` (ou `0`), a loja de teste e o preço de 0.50€ ficam totalmente desativados mesmo para administradores.
- **`ADMIN_PASSWORD` (obrigatória):** Senha da equipa NEEI para o painel `/admin`. Sem esta variável o login devolve erro 500 — **não existe senha em branco por omissão**.
- **`GEMINI_API_KEY` (obrigatória):** Chave da Google Gemini usada pelo backend em `/api/analyze` (Tutor Inteligente). Fica apenas no servidor (Coolify) — **nunca** é incluída no bundle do cliente.
- Limites de taxa (`server.js`): `/api/admin/login` >5 pedidos/min, `/api/analyze` >30, `/api/admin/*` >60, restantes `/api/*` >120 (por IP).

## Verificação de Portas e Execução Local em Paralelo

- **Porta padrão:** A aplicação utiliza por defeito a porta `3000`.
- **Prevenção de conflitos em paralelo:** Antes de iniciar qualquer servidor local (`npm.cmd run dev`), verificar sempre previamente se a porta 3000 (ou outra pretendida) já está ocupada por outra conversa ou processo a correr em paralelo (ex.: através de `Get-NetTCPConnection`). Se a porta estiver em uso, escolher uma porta livre alternativa (ex.: 3001, 5173, 8080) ou confirmar com o utilizador para evitar colisões entre instâncias.

## Identidade nos Commits Git

- **Autor dos commits:** Todos os commits devem ser sempre assinados com a identidade:
  - `user.name`: `davidjmrodrigues`
  - `user.email`: `diogodavid99@gmail.com`
