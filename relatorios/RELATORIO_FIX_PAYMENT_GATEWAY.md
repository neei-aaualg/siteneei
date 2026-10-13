# Relatório de Auditoria e Implementação: Fix Payment Gateway (Issue #4)

> **Data:** 13 de Outubro de 2026  
> **Repositório:** `neei-aaualg/siteneei`  
> **Branch de Trabalho:** `fix-payment-gateway`  
> **Referência:** [GitHub Issue #4: fix/payment-gateway](https://github.com/neei-aaualg/siteneei/issues/4)  
> **Autor dos Commits:** `davidjmrodrigues <diogodavid99@gmail.com>`  
> **Estado dos Testes:** 229/229 testes aprovados (`npm test`)  
> **Estado do Build:** Aprovado em produção (`npm run build`)

---

## 1. Resumo

No âmbito da auditoria de segurança e fiabilidade do módulo de pagamentos e loja do Portal NEEI, foi realizada uma intervenção abrangente cobrindo todas as vulnerabilidades e recomendações apontadas na **Issue #4**. 

A intervenção priorizou as vulnerabilidades de criticidade **ALTO (A1–A4)**, seguida pela implementação e endurecimento dos itens de criticidade **MÉDIO (M1–M10)** e boas práticas de criticidade **BAIXO (B1–B6)**. 

O sistema foi blindado contra:
1. Reutilização fraudulenta de identificadores de pagamento (`PaymentIntent` reuse attack).
2. Adulteração de valores/moedas e criação de encomendas fictícias com montantes incorretos.
3. Liquidação prematura de encomendas em métodos de pagamento assíncronos (Multibanco / SEPA).
4. Injeção de cabeçalho `Host` e redirecionamento aberto (*Open Redirect*).
5. Forjamento de encomendas no webhook de fallback através de `metadata` manipulada.
6. Fugas de tokens de administração através de parâmetros de URL (*query string*).
7. Falhas silenciosas em ambiente de produção (*fail-open*).

---

## 2. Matriz de Conformidade e Aderência

| ID | Classificação | Descrição do Ponto | Estado | Ficheiros Principais |
| :--- | :---: | :--- | :---: | :--- |
| **A1** | **ALTO** | Validação de valor e moeda do `PaymentIntent` vs total da encomenda | **Resolvido** | `server/db.js`, `server/shopApi.js` |
| **A2** | **ALTO** | Verificação de `session.payment_status === 'paid'` no webhook | **Resolvido** | `server/shopApi.js` |
| **A3** | **ALTO** | Host header injection / open redirect no checkout session | **Resolvido** | `server/security.js`, `server/shopApi.js` |
| **A4** | **ALTO** | Fallback do webhook com metadata atacante-controlada | **Resolvido** | `server/shopApi.js` |
| **M1** | **MÉDIO** | Adicionar `idempotencyKey` na criação de PI e Checkout Sessions | **Resolvido** | `server/services/stripeService.js` |
| **M2** | **MÉDIO** | Handlers para `charge.refunded`, `charge.dispute`, `session.expired`, `pi.canceled` | **Resolvido** | `server/shopApi.js`, `server/db.js` |
| **M3** | **MÉDIO** | CSP fraca (`'unsafe-eval'`, `'unsafe-inline'`) | **Resolvido Parcialmente (Justificado)** | `server/security.js` |
| **M4** | **MÉDIO** | Rate-limit em memória e `x-forwarded-for` não validado | **Resolvido (Adaptado)** | `server/security.js` |
| **M5** | **MÉDIO** | Remoção de tokens admin via query string `?token=` | **Resolvido** | `server/auth.js`, `services/shopService.ts` |
| **M6** | **MÉDIO** | Mensagens de erro cruas da Stripe expostas ao cliente | **Resolvido** | `server/services/stripeService.js` |
| **M7** | **MÉDIO** | `customers.search` e eliminação de mutação não autenticada de cliente | **Resolvido** | `server/services/stripeService.js` |
| **M8** | **MÉDIO** | Unificação de base canónica validada (`getCanonicalAppUrl`) | **Resolvido** | `server/security.js`, `server/shopApi.js` |
| **M9** | **MÉDIO** | Pin da versão da API Stripe (`apiVersion: '2026-08-26.dahlia'`) | **Resolvido** | `server/services/stripeService.js` |
| **M10** | **MÉDIO** | Prevenção de Fail-Open em produção (sandbox / simulate-payment) | **Resolvido** | `server/services/stripeService.js`, `server/shopApi.js` |
| **B1** | **BAIXO** | Adição de TTL e limpeza periódica ao `pendingOrdersCache` | **Resolvido** | `server/db.js` |
| **B2** | **BAIXO** | Controlo de stock por tamanho na campanha | **Justificado (Modelo Pré-encomenda)** | Modelo de negócio explicado |
| **B3** | **BAIXO** | Logs de auditoria estruturados (orderId ↔ PI ↔ eventId) | **Resolvido** | `server/db.js`, `server/shopApi.js` |
| **B4** | **BAIXO** | Deduplicação de eventos de webhook (`event.id`) | **Resolvido** | `server/db.js`, `server/shopApi.js` |
| **B5** | **BAIXO** | Testes de segurança e vetores de ataque | **Resolvido (11 novos testes)** | `tests/server/shop.test.js` |
| **B6** | **BAIXO** | Metadados em `payment_intent_data` no Checkout | **Resolvido** | `server/services/stripeService.js` |

---

## 3. Detalhes das Implementações por Prioridade

### 3.1. Vulnerabilidades de Criticidade ALTO

#### A1 — Validação Rigorosa de Valor e Moeda (`amount` / `currency`) vs Total da Encomenda
- **Problema anterior:** Um cliente malicioso com um `PaymentIntent` de teste ou com montante inferior (ex.: 0.50€) poderia submeter confirmações ou provocar acionamento de webhook registando encomendas de valor superior (ex.: sweats a 25.00€).
- **Implementação:**
  - Em `server/db.js`, a função `recordPaidShopOrder` valida explicitamente a conversão do montante recebido da Stripe em cêntimos com o `total_amount` da encomenda na base de dados (`Math.round(order.total_amount * 100)`). Se houver discrepância de valor ou se a moeda não for `'eur'`, a operação é abortada.
  - Implementada a verificação de **reutilização de PaymentIntent** (`getShopOrderByPaymentRef`): se um `paymentIntentId` já se encontrar associado a outra encomenda concluída na base de dados, a transação é rejeitada com erro de conflito.
  - O endpoint `/api/shop/confirm-payment` e o webhook `payment_intent.succeeded` validam o montante antes de atualizar o estado para pago.

#### A2 — Verificação Estrita de Liquidação em `checkout.session.completed`
- **Problema anterior:** Para métodos de pagamento com atraso de liquidação (ex.: Multibanco com referência emitida, Débito Direto SEPA), o webhook `checkout.session.completed` disparava imediatamente após a conclusão do formulário, mesmo que a sessão mantivesse `payment_status: 'unpaid'`. A encomenda ficava incorretamente marcada como paga antes da receção do dinheiro.
- **Implementação:**
  - Em `server/shopApi.js`, o processamento de `checkout.session.completed` verifica obrigatoriamente se `session.payment_status === 'paid'`.
  - Caso o estado seja pendente (`unpaid`), o sistema mantém a encomenda em estado de espera e regista uma nota de auditoria.
  - Foram adicionados os tratamentos para os eventos `checkout.session.async_payment_succeeded` (que efetiva o pagamento aquando da liquidação bancária) e `checkout.session.async_payment_failed` (que cancela a encomenda em caso de expiração do prazo de pagamento).

#### A3 — Prevenção de Host Header Injection e Open Redirect no Checkout
- **Problema anterior:** A montagem dos URLs de retorno (`success_url` e `cancel_url`) em `/api/shop/checkout-session` utilizava cegamente `req.headers.host`, permitindo que um invasor enviasse um cabeçalho `Host: malicious.com` e redirecionasse os compradores para um site malicioso após o checkout.
- **Implementação:**
  - Criada a função canónica `getCanonicalAppUrl(req)` em `server/security.js`.
  - A função prioriza a variável de ambiente `APP_URL`. Se não configurada, valida rigorosamente o hostname do cabeçalho através de expressão regular estrita (`/^[a-zA-Z0-9.-]+(?::[0-9]{1,5})?$/`). Hostnames inválidos ou com caracteres suspeitos são descartados e substituídos pelo domínio padrão seguro (`https://neei.online`).

#### A4 — Blindagem do Fallback do Webhook contra Dados Forjados em `metadata`
- **Problema anterior:** Se o servidor reiniciasse ou a cache em memória perdesse a encomenda pendente, o webhook tentava reconstruir a encomenda utilizando os campos recebidos em `session.metadata` ou `payment_intent.metadata`. Como a metadata pode ser controlada ou injetada em determinados fluxos, havia risco de criação de encomendas com tamanhos ou preços arbitrários.
- **Implementação:**
  - Em `server/shopApi.js`, o fallback foi blindado com validação contra o catálogo oficial da campanha em vigor (`getActiveShopCampaign()`):
    - O tamanho (`size`) é obrigatoriamente validado contra os tamanhos disponíveis na campanha ativa.
    - O preço do item e o total são recalculados e confrontados com os valores de tabela oficiais.
    - O contacto (`studentNumber`, `phone`, `email`) é validado com expressões regulares restritas.
    - Se qualquer dado divergir da campanha oficial, a criação é sumariamente rejeitada com erro 400.

---

### 3.2. Melhorias de Criticidade MÉDIO

#### M1 — Chaves de Idempotência Determinísticas (`idempotencyKey`)
- Em `server/services/stripeService.js`, foi introduzido o envio de `idempotencyKey` derivado de forma determinística (com hash SHA-256 de `orderId` e detalhes do pedido) em:
  - `stripe.paymentIntents.create`
  - `stripe.checkout.sessions.create`
- Impede a cobrança dupla no Stripe em situações de quebra ou retry de rede entre o servidor e a API do Stripe.

#### M2 — Tratamento de Reembolsos, Litígios e Cancelamentos
- Adicionados ouvintes de webhook para:
  - `charge.refunded`: Regista auditoria estruturada com valor reembolsado e atualiza o estado para `canceled` (ou `refunded`).
  - `charge.dispute.created`: Regista nota urgente de litígio na encomenda para acompanhamento manual da direção.
  - `checkout.session.expired` e `payment_intent.canceled`: Marca a encomenda pendente como cancelada libertando o registo.

#### M3 — Endurecimento de Content Security Policy (CSP)
- Removida a diretiva insegura `'unsafe-eval'` de `script-src` em `server/security.js`.
- Mantido `'unsafe-inline'` devido ao carregamento dinâmico do Tailwind via CDN em `index.html` (ver secção 4 para detalhe).

#### M4 — Rate Limiter Fortalecido e Validação de Proxy
- O rate limiter em memória em `server/security.js` foi protegido contra DoS/Memory Exhaustion:
  - Limite superior de 10.000 IPs em simultâneo;
  - Algoritmo de poda de entradas expiradas a cada ciclo de verificação.
- Sanitização de `x-forwarded-for`: só é avaliado se `TRUST_PROXY=true` ou `1`. O IP extraído é rigorosamente validado por regex de IPv4/IPv6, prevenindo injeções de cabeçalhos fictícios.

#### M5 — Eliminação de Autenticação via Query String (`?token=`)
- Em `server/auth.js`, foi removido o fallback de leitura de token em `searchParams` (`?token=`).
- Os pedidos ao painel de administração e API protegida só são aceites via cabeçalho `Authorization: Bearer <token>` ou `X-Admin-Token`.
- Em `services/shopService.ts`, a função `fetchShopCampaign` foi atualizada para deixar de anexar o token à URL.

#### M6 — Sanitização de Mensagens de Erro da Stripe
- Criada a função `sanitizeStripeError(err)` em `server/services/stripeService.js`.
- Mensagens de erro de infraestrutura ou códigos crus são substituídos por mensagens seguras em português (ex.: "O cartão foi recusado", "Número de telemóvel inválido para MB WAY", "Erro temporário no processamento").

#### M7 — Modernização do Cliente Stripe e Fim de Sobrescrita de Dados
- Substituída a chamada deprecada `stripe.customers.list({ email })` por `stripe.customers.search({ query: ... })`.
- Removida a chamada `stripe.customers.update()` efetuada a partir de novos checkouts não autenticados, prevenindo que um utilizador anónimo sobrescreva o nome e contacto de um perfil existente de outro estudante.

#### M8 — Centralização de Base Canónica Validada
- Todos os serviços que requerem a origem do portal utilizam agora a função centralizada `getCanonicalAppUrl(req)`.

#### M9 — Pin da Versão da API Stripe
- Inicialização do cliente Stripe com a versão exata:
  ```javascript
  new Stripe(secretKey, {
    apiVersion: '2026-08-26.dahlia',
  });
  ```

#### M10 — Eliminação de Fail-Open em Produção
- `isStripeSandbox()` força o retorno `false` caso `NODE_ENV === 'production'`.
- O endpoint `/api/shop/simulate-payment` retorna explicitamente `403 Forbidden` quando em produção.
- Sem chave `STRIPE_SECRET_KEY` configurada em ambiente produtivo, o sistema devolve erro 500 informando configuração incompleta em vez de autorizar pagamentos simulados.

---

### 3.3. Boas Práticas e Robustez (BAIXO)

#### B1 — TTL e Limpeza de Encomendas Pendentes
- Em `server/db.js`, o mapa `pendingOrdersCache` ganhou `createdAtMs` e TTL de 2 horas (`PENDING_ORDER_TTL_MS = 2 * 60 * 60 * 1000`).
- Rotina periódica automática (`setInterval`) remove registos pendentes abandonados.

#### B3 & B4 — Deduplicação de Webhooks e Logs de Auditoria
- Criada tabela em memória/cache com TTL de 24 horas para deduplicação de identificadores de evento (`event.id`). Tentativas de replay de webhook já processado recebem resposta imediata `200 OK` com flag `{ received: true, duplicate: true }`.
- Criada a função `appendShopOrderAdminNotes(orderId, note)` para manter histórico auditável de cada transição de pagamento, estorno ou litígio.

#### B5 — Suíte de Testes de Ataque e Segurança
- Adicionados 11 novos cenários de teste automatizados em `tests/server/shop.test.js`:
  - Tentativa de reutilização de PaymentIntent em múltiplas encomendas;
  - Discrepância fraudulenta entre montante pago e montante da encomenda;
  - Rejeição de tokens via query string (`?token=`);
  - Bloqueio de simulação de pagamento em produção (`NODE_ENV=production`);
  - Deduplicação de webhooks idempotentes;
  - Rejeição de metadata forjada no webhook fallback com preços incorretos.

#### B6 — Metadados em `payment_intent_data` no Stripe Checkout
- Adicionado o bloco `payment_intent_data: { metadata: { ... } }` na criação de sessões de checkout, garantindo que os identificadores da encomenda acompanham o pagamento no dashboard do Stripe.

---

## 4. Pontos Não Implementados / Justificações Arquiteturais

| Ponto | Descrição | Motivo / Justificação Técnica |
| :--- | :--- | :--- |
| **M3 (Remoção total de `'unsafe-inline'`)** | Eliminar `'unsafe-inline'` da política CSP | O frontend carrega o Tailwind CSS através do script CDN em tempo de execução no `index.html` (`https://cdn.tailwindcss.com`). A remoção de `'unsafe-inline'` bloquearia a injeção dos estilos gerados pelo CDN. Para eliminar `'unsafe-inline'`, será necessária uma migração futura do Tailwind para compilação estática no pipeline do Vite via PostCSS. |
| **M4 (Rate Limit Distribuído / Redis)** | Implementar rate limiting em Redis ou Memcached | A arquitetura atual do Portal NEEI é auto-contida num único contentor Docker no Coolify, utilizando SQLite persistente (`/app/data/activities.db`). A inclusão de Redis obrigaria ao provisionamento de serviços adicionais externos. O rate limiter foi blindado em memória com podas TTL e teto máximo de memória. |
| **B2 (Stock Rígido por Tamanho)** | Limitar inventário por tamanho na base de dados | As campanhas de vestuário e merchandise do NEEI funcionam sob modelo de **pré-encomenda** (*made-to-order*): a produção em fábrica é encomendada após o fecho da campanha com base nas encomendas totais registadas. Impor quotas artificiais por tamanho iria bloquear vendas legítimas de alunos. |
| **B6 (`automatic_payment_methods`)** | Usar métodos automáticos na Stripe em vez de lista explícita | Mantiveram-se os métodos selecionados manualmente (`card`, `multibanco`, `mbway`) porque os métodos automáticos da Stripe ativam métodos internacionais não desejados ou não compatíveis com a conta bancária do núcleo universitário em Portugal. |

---

## 5. Ficheiros Modificados

1. `server/security.js` — Remoção de `'unsafe-eval'` no CSP, sanitização de IPs, validação de proxy e função canónica de URL `getCanonicalAppUrl`.
2. `server/auth.js` — Remoção da aceitação de token de autenticação via query string `?token=`.
3. `services/shopService.ts` — Limpeza de parâmetros de token na URL e tipagem TypeScript de taxas e itens.
4. `server/services/stripeService.js` — Fixação de `apiVersion`, chaves de idempotência, sanitização de erros, `customers.search`, bloqueio de mutações não autenticadas de cliente e fail-closed em produção.
5. `server/db.js` — Verificação estrita de montante/moeda, proteção contra reutilização de PI, TTL e limpeza de encomendas pendentes, deduplicação de webhooks e histórico de auditoria.
6. `server/shopApi.js` — Validação de `payment_status === 'paid'`, webhooks para reembolsos/litígios/cancelamentos, URLs canónicos sem host injection, blindagem do fallback contra metadata forjada e desativação de `/simulate-payment` em produção.
7. `tests/server/shop.test.js` — Adicionados 11 testes de segurança automatizados e validação de auditoria.
8. `components/CalendarDropdown.tsx` — Correção da ordem dos Hooks React (*Rules of Hooks*).
9. `pages/Shop.tsx` — Resolução de blocos catch vazios para conformidade com ESLint.
10. `vite.config.ts` — Ajuste de tratamento de exceções na configuração do Vite.

---

## 6. Verificação e Validação

- **TypeScript:** `npm run typecheck` executado com sucesso (0 erros).
- **ESLint:** `npm run lint` executado com sucesso (0 erros).
- **Testes Unitários e de Integração:** `npm test` executado com **229 testes aprovados em 22 ficheiros**.
- **Build de Produção:** `npm run build` concluído com sucesso.
