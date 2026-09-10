# NEEI Web Portal & Quack 🦆

Este repositório contém o código-fonte do portal institucional do **Núcleo de Estudantes de Engenharia Informática (NEEI)** da Universidade do Algarve (UAlg).

A plataforma serve como o ponto central de comunicação para os estudantes, oferecendo recursos académicos, ofertas de emprego e, principalmente, o **Quack** — um tutor de programação inteligente e executor de código.

## 🚀 Funcionalidades Principais

### 1. Quack (Executor de Código Inteligente)
O Quack é uma ferramenta de ensino assistido por IA desenhada para as disciplinas de programação (C e Java) da licenciatura.
*   **Execução Real:** Utiliza a API do [Piston](https://github.com/engineer-man/piston) para compilar e executar código C e Java num ambiente seguro (sandbox).
*   **Tutor IA (Gemini 2.5 Flash):** Se o código falhar ou tiver erros de lógica, a IA analisa o erro e fornece dicas pedagógicas, sem dar a resposta direta.
*   **Exercícios Curriculares:** Contém bibliotecas de exercícios das cadeiras de PI, LP, AED e POO.
*   **Testes Automáticos:** Validação imediata de Inputs/Outputs.

### 2. Portal Institucional
*   **Notícias e Eventos:** Calendário integrado e destaques do mandato.
*   **Recursos:** Repositório de apontamentos, exames e vídeos organizados por ano curricular.
*   **Vagas:** Quadro de ofertas de estágio e emprego para alunos e alumni.
*   **Projetos:** Showcase de projetos desenvolvidos pelos alunos.
*   **Equipa:** Apresentação dinâmica dos órgãos sociais com avatares gerados automaticamente.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** React 19, TypeScript.
*   **Estilos:** Tailwind CSS.
*   **Navegação:** React Router DOM.
*   **Ícones:** Lucide React.
*   **Inteligência Artificial:** Google Gemini API (`@google/genai`).
*   **Execução de Código:** Piston API (Public Instance).
*   **Formulários:** Formspree.

## ⚙️ Instalação e Configuração

### Pré-requisitos
*   Node.js (v18 ou superior)
*   Uma chave de API do Google Gemini (Gratuita no Google AI Studio)

### Passos
1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/neei-portal.git
    cd neei-portal
    ```

2.  **Instalar dependências:**
    ```bash
    npm install
    ```

3.  **Configurar Variáveis de Ambiente:**
    *   Cria um ficheiro `.env` na raiz do projeto (se estiveres a rodar localmente com Vite/Next) ou configura no painel do teu host (Vercel/Netlify).
    *   Adiciona a chave:
        ```env
        API_KEY=tua_chave_do_google_ai_studio
        ```
        *(Nota: No código atual, a chave é injetada via `process.env.API_KEY` durante o build).*

4.  **Correr o projeto:**
    ```bash
    npm start
    # ou
    npm run dev
    ```

## 🔒 Segurança

O projeto implementa várias camadas de segurança, especialmente no módulo Quack:

1.  **Sanitização de Input:** O código enviado para a IA é limpo para prevenir *Prompt Injection*.
2.  **Content Security Policy (CSP):** Configurada no `index.html` para impedir carregamento de scripts maliciosos e restringir conexões apenas a domínios autorizados (emkc.org, generativelanguage.googleapis.com, etc.).
3.  **Hybrid Execution:** O código é primeiro executado num compilador real (Piston). A IA apenas analisa o resultado ou o código estático, nunca executa o código do aluno diretamente, prevenindo alucinações de execução.

## 📂 Estrutura de Pastas

*   `/data`: Contém os ficheiros TypeScript com os exercícios de cada cadeira (PI, AED, LP, POO).
*   `/pages`: Componentes das páginas principais (Home, Quack, Resources, etc.).
*   `/services`: Lógica de conexão com APIs externas (`geminiService.ts`).
*   `/components`: Componentes reutilizáveis (Header, Footer, CodeEditor).

---

Desenvolvido com ❤️ por **Afonso Bitoque (presidente do NEEI no mandato 25/26)**.