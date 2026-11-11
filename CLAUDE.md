# horto-web — instruções para assistentes de IA

Sistema web (Express + PostgreSQL / React + Vite) do Horto Botânico de Chapecó. Os requisitos estão nas issues do GitHub (`gh issue view <n> --comments`): leia também os comentários, que trazem modelagem e decisões técnicas.

## Antes de implementar uma feature

1. Leia o [README](README.md), principalmente **Como adicionar um novo módulo**, **Padrões obrigatórios** e **Requisitos gerais (Definition of Done)**. Esses padrões vieram de revisões de código: segui-los evita retrabalho.
2. Use o módulo de **estufas** como referência de implementação (`backend/src/**/estufa*`, `frontend/src/pages/Estufa*.tsx`).
3. Trabalhe numa branch `feat/<issue>-<descricao>` a partir da `main`.

## Regras que não podem ser esquecidas

- **Reutilize os helpers** em vez de reescrever lógica:
  - backend: `utils/validacao.ts` (`validarDecimal`, `validarTexto`, `multiplicarDecimal`), `utils/db-errors.ts` (`PG_ERRO`, `codigoErroPg`), `utils/http.ts` (`parseId`, `responderErro`, `clientIp`), `AppError`;
  - frontend: `components/CampoDecimal.tsx`, `utils/decimal.ts`, `utils/formatadores.ts`, `AdminOnly`, `AdminRoute`, `ConfirmModal`, `useToast`, `mensagemErro`.
- Números nunca com `Number(valor)` direto no backend nem `type="number"` no frontend.
- Contas com decimais exibidas na tela devem bater com o arredondamento do `NUMERIC` do banco.
- Toda alteração de dados: validação no service + `NOT NULL`/`CHECK` no banco (RF42), `LogService.registrar` (RF44), `ConfirmModal` em exclusões (RF45), toast de resultado (RF46).
- Exclusão com verificação de vínculos: transação + `FOR UPDATE`; com histórico, desativar em vez de apagar.
- Escrita apenas para administrador (`authorizeAdmin` / `AdminRoute` / `AdminOnly`); leitura para todos os autenticados.
- Nunca edite uma migration já mesclada na `main`; crie uma nova.
- Ao encontrar um problema novo e recorrente numa revisão, registre o padrão em **Padrões obrigatórios** no README e no checklist do template de PR.

## Verificação

Não há Node na máquina host; use os containers de dev:

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps -T backend yarn typecheck
docker compose -f docker-compose.dev.yml run --rm --no-deps -T frontend yarn build
```

Teste a API com `curl` em `localhost:3002` (login `admin` / `admin123` no banco de dev) e remova os dados de teste ao final.

## Commits

Mensagens em português no formato `tipo: descrição` (`feat`, `fix`, `docs`, `chore`, `refactor`). Não adicionar `Co-Authored-By` nem qualquer atribuição a assistentes de IA.
