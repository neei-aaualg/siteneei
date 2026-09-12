# --- Stage 1: Build Frontend ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copia ficheiros de dependências
COPY package*.json ./

# Instala todas as dependências necessárias para o build
RUN npm ci

# Copia o código-fonte
COPY . .

# Compila a aplicação Vite (saída para /app/build)
RUN npm run build

# --- Stage 2: Production Runner ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instala apenas dependências de produção
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Cria diretório de dados com permissões para o utilizador node
RUN mkdir -p /app/data && chown -R node:node /app/data

# Copia os ficheiros compilados e o servidor HTTP + backend
COPY --chown=node:node --from=builder /app/build ./build
COPY --chown=node:node server.js ./
COPY --chown=node:node server ./server

# Executa com o utilizador seguro não-root
USER node

EXPOSE 3000

# Healthcheck para o Coolify (usa 127.0.0.1 para evitar problemas com IPv6 no Alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

CMD ["node", "server.js"]
