# ── Base: dependências ────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

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
FROM nginx:1.27-alpine AS prod

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
