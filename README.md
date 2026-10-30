# horto-web

Sistema web para gestão digital de Hortos Botânicos, desenvolvido como projeto de extensão da UFFS (Ciência da Computação, campus Chapecó) em parceria com o Horto Botânico de Chapecó - SC.

Os requisitos funcionais do sistema web, extraídos do documento do projeto de extensão, estão organizados nas [issues do repositório](https://github.com/extencao-hortobotanico/horto-web/issues).

## Stack

| Camada    | Tecnologias |
|-----------|-------------|
| Backend   | Node.js 22, Express 4, TypeScript, pg-promise, Passport JWT, bcryptjs |
| Frontend  | React 19, Vite 6, TypeScript, React Bootstrap 5, React Router 7, axios, Font Awesome |
| Banco     | PostgreSQL 17 |
| Infra     | Docker / Docker Compose, Nginx (frontend em produção) |

## Estrutura

```
horto-web/
├── docker-compose.yml        # ambiente completo (build de produção)
├── docker-compose.dev.yml    # ambiente de desenvolvimento com hot reload
├── .env.example              # variáveis do compose (opcional)
├── backend/
│   ├── Dockerfile            # alvos: dev | prod
│   └── src/
│       ├── config/           # Passport (estratégia JWT)
│       ├── controller/       # recebe a requisição HTTP e monta a resposta
│       ├── db/               # conexão (database.ts) e executor de migrations (migrate.ts)
│       ├── interface/        # tipos/interfaces TypeScript
│       ├── middleware/       # autenticação e autorização por perfil
│       ├── migration/        # scripts SQL versionados (V1_..., V2_...)
│       ├── routes/           # rotas da API
│       ├── service/          # regras de negócio e acesso ao banco
│       ├── utils/            # AppError, helpers HTTP
│       └── index.ts          # ponto de entrada
└── frontend/
    ├── Dockerfile            # alvos: dev | prod (Nginx)
    ├── nginx.conf            # SPA + proxy /api → backend
    └── src/
        ├── components/       # Layout, AppHeader, rotas protegidas, ConfirmModal, SenhaForm
        ├── contexts/         # AuthContext (sessão), ToastContext (mensagens de resultado)
        ├── pages/            # telas
        ├── services/         # chamadas à API (axios)
        ├── styles/           # CSS global e por área
        ├── types/            # tipos compartilhados
        └── utils/            # formatadores
```

## Como rodar

Pré-requisito: [Docker](https://docs.docker.com/get-docker/) com o plugin `docker compose`.

### Desenvolvimento (recomendado)

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Frontend: http://localhost:3001 (Vite, recarrega ao salvar)
- API: http://localhost:3002 (ts-node-dev, reinicia ao salvar)
- Banco: `localhost:5433` (usuário `postgres`, senha `postgres`, banco `horto`)

O código de `backend/` e `frontend/` é montado dentro dos containers. Se alterar algum `package.json`, suba novamente com `--build -V` para reinstalar as dependências.

### Produção / demonstração

```bash
docker compose up -d --build
```

Mesmas portas: o frontend é servido pelo Nginx em http://localhost:3001 e repassa `/api` para o backend.

### Acesso inicial

A primeira migration cria um administrador:

- **Usuário:** `admin`
- **Senha:** `admin123`

Troque a senha após o primeiro acesso (menu do usuário → *Meu perfil*).

### Comandos úteis

```bash
docker compose -f docker-compose.dev.yml logs -f backend                    # logs da API
docker compose -f docker-compose.dev.yml exec db psql -U postgres -d horto  # console do banco
docker compose -f docker-compose.dev.yml down                               # para os containers
docker compose -f docker-compose.dev.yml down -v                            # para e APAGA o banco
```

### Variáveis de ambiente

Todas têm valor padrão para desenvolvimento. Para alterar, copie `.env.example` para `.env` na raiz. Em produção, defina obrigatoriamente um `JWT_SECRET` forte e troque a senha do banco.

### Sem Docker (opcional)

É possível rodar backend e frontend direto na máquina (Node 22 + Yarn 1), mantendo só o banco no Docker:

```bash
docker compose -f docker-compose.dev.yml up -d db
cd backend  && cp .env.example .env && yarn install && yarn migrate && yarn dev
cd frontend && cp .env.example .env && yarn install && yarn dev
```

## Banco de dados e migrations

As migrations ficam em `backend/src/migration/` e são aplicadas automaticamente quando o backend sobe (tabela de controle: `schema_migrations`).

- Nome do arquivo: `V<numero>_<descricao>.sql` (ex.: `V2_estufas.sql`). A ordem segue o número.
- Cada arquivo roda uma única vez, dentro de uma transação.
- **Nunca edite uma migration já aplicada** — crie uma nova.
- Convenção de nomes (herdada do ZipTick): tabelas `<prefixo>_<nome>` e colunas com o mesmo prefixo, ex.: `usua_usuario.usua_nome`. Nos `SELECT`s, use `AS` para devolver nomes simples à API (`usua_nome AS nome`).

## API

Todas as respostas seguem o formato:

```json
{ "success": true, "data": { }, "message": "Texto para exibir ao usuário" }
```

Rotas protegidas exigem o header `Authorization: Bearer <token>`, obtido no login.

### Autenticação

| Método | Rota               | Acesso      | Descrição |
|--------|--------------------|-------------|-----------|
| POST   | `/api/auth/login`  | público     | `{ login, senha }` → `{ usuario, token }` |
| GET    | `/api/auth/me`     | autenticado | dados do usuário logado |
| PUT    | `/api/auth/senha`  | autenticado | `{ senhaAtual, novaSenha }` troca a própria senha |

### Usuários (somente administrador)

| Método | Rota                       | Descrição |
|--------|----------------------------|-----------|
| GET    | `/api/usuarios?ativo=true` | lista (filtro `ativo` opcional) |
| GET    | `/api/usuarios/:id`        | detalhe |
| POST   | `/api/usuarios`            | `{ nome, login, senha, tipo, whatsapp }` |
| PUT    | `/api/usuarios/:id`        | `{ nome, login, tipo, whatsapp }` |
| PUT    | `/api/usuarios/:id/senha`  | `{ novaSenha }` redefine a senha |
| PATCH  | `/api/usuarios/:id/ativo`  | `{ ativo: boolean }` ativa/desativa |

`GET /health` verifica se a API está no ar.

### Perfis de acesso

| Tipo | Perfil         | Permissões |
|------|----------------|------------|
| 1    | Administrador  | cadastra e edita tudo, gerencia usuários, aprova solicitações (RF33) |
| 2    | Usuário comum  | apenas visualiza no sistema web; alterações são solicitadas pelo bot (RF34) |

Usuários não são excluídos, apenas desativados, preservando o histórico (RF36). Um usuário desativado perde o acesso imediatamente, mesmo com token válido.

## Como adicionar um novo módulo

Exemplo: estufas.

**Backend**
1. `src/migration/V2_estufas.sql` com a tabela.
2. `src/interface/estufa.ts` com os tipos.
3. `src/service/estufa.service.ts` com as consultas e validações. Erros de negócio: `throw new AppError('mensagem', status)`.
4. `src/controller/estufa.controller.ts` → `try { ... } catch (error) { responderErro(res, error, 'Erro ao ...') }`. Registre alterações com `LogService.registrar(...)` (histórico de ações, RF44).
5. `src/routes/estufa.router.ts`: leitura com `authenticate` + `authorizeAll`; escrita com `authenticate` + `authorizeAdmin`.
6. Registre o router em `src/index.ts` (`app.use('/api/estufas', estufaRouter)`).

**Frontend**
1. Tipos em `src/types/` e chamadas em `src/services/estufaService.ts` (use a instância `api`).
2. Páginas em `src/pages/` e rotas em `src/App.tsx` (formulários de cadastro dentro de `<AdminRoute>`).
3. Botões de alteração dentro de `<AdminOnly>`.
4. Link no menu: array `NAV_ITEMS` em `src/components/AppHeader.tsx`.
5. Após cada operação, `useToast().sucesso(...)` / `.erro(...)` (RF46). Exclusões passam por `<ConfirmModal>` (RF45).

### Requisitos gerais (Definition of Done)

Todo módulo deve atender aos requisitos gerais do Quadro 8 antes do merge. O checklist está no [template de PR](.github/pull_request_template.md).

| Requisito | Como atender |
|-----------|--------------|
| **RF42** — Validar dados obrigatórios | Validar no service com `throw new AppError('mensagem clara', 400)` e reforçar no banco com `NOT NULL` e `CHECK` (medidas e quantidades nunca negativas). No front, `required`/`min` nos campos. |
| **RF44** — Histórico de ações | `LogService.registrar({ idUsuario, acao, entidade, entidadeId, descricao, ip })` em toda operação que altera dados. |
| **RF45** — Exclusão com confirmação | `<ConfirmModal>` antes de toda exclusão, desativação ou encerramento. |
| **RF46** — Mensagens de resultado | `useToast().sucesso(...)` / `useToast().erro(mensagemErro(err, '...'))` após cada operação. |

RF43 (validação de imagens) vale para todo upload; a infraestrutura é criada na issue de fotos de referência.
