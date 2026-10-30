# ── Base: dependências ────────────────────────────────────────────────────────
FROM node:26.13.0-alpine AS deps
WORKDIR /app

# A imagem do Node 26 não traz o Yarn: instala o Yarn 1 com versão fixa
RUN npm install -g yarn@1.22.22 && npm cache clean --force

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ── Dev: Vite com hot reload (usado pelo docker-compose.dev.yml) ──────────────
FROM deps AS dev
COPY . .
EXPOSE 3001
CMD ["yarn", "dev"]

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .

# VITE_API_URL vazio → axios usa URLs relativas → Nginx repassa para o backend
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN yarn build

# ── Serve com Nginx (alvo padrão) ─────────────────────────────────────────────
FROM nginx:1.30.6-alpine AS prod

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
