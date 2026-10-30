# ── Base: dependências ────────────────────────────────────────────────────────
FROM node:26.13.0-alpine AS deps
WORKDIR /app

# A imagem do Node 26 não traz o Yarn: instala o Yarn 1 com versão fixa
RUN npm install -g yarn@1.22.22 && npm cache clean --force

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
FROM node:26.13.0-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

# Apenas dependências de produção (Yarn usado só na instalação e removido em seguida)
COPY package.json yarn.lock ./
RUN npm install -g yarn@1.22.22 \
    && yarn install --production --frozen-lockfile \
    && yarn cache clean \
    && npm uninstall -g yarn && npm cache clean --force

# Código compilado
COPY --from=builder /app/dist ./dist

# Migrations SQL — o migrate.js compilado em dist/db/ resolve '../migration'
COPY --from=builder /app/src/migration ./dist/migration

EXPOSE 3002

# Roda migrations e depois sobe o servidor
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]
