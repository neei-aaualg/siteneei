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
