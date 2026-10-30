# ── Base: dependências ────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ── Dev: hot reload (usado pelo docker-compose.dev.yml) ───────────────────────
FROM deps AS dev
COPY . .
EXPOSE 3002
CMD ["sh", "-c", "yarn migrate && yarn dev"]

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN yarn build

# ── Runtime (alvo padrão) ─────────────────────────────────────────────────────
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

# Apenas dependências de produção
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Código compilado
COPY --from=builder /app/dist ./dist

# Migrations SQL — o migrate.js compilado em dist/db/ resolve '../migration'
COPY --from=builder /app/src/migration ./dist/migration

EXPOSE 3002

# Roda migrations e depois sobe o servidor
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]
