## Descrição

<!-- O que foi feito e por quê -->

Closes #

## Como testar

<!-- Passos para validar a mudança -->

## Checklist — requisitos gerais (Definition of Done)

- [ ] **RF42** — Campos obrigatórios validados no backend (`AppError`) e no banco (`NOT NULL`/`CHECK`); medidas e quantidades não aceitam valores negativos
- [ ] **RF44** — Toda alteração de dados registrada com `LogService.registrar(...)`
- [ ] **RF45** — Exclusões, desativações e encerramentos pedem confirmação (`ConfirmModal`)
- [ ] **RF46** — Toda operação exibe mensagem de resultado (`useToast`)
- [ ] **Permissões** — Escrita restrita ao administrador (`authorizeAdmin` / `AdminRoute` / `AdminOnly`); leitura liberada a todos os autenticados (RF33/RF34)
- [ ] Migration nova (se houver) com número combinado com o grupo e sem alterar migrations já aplicadas

## Checklist — padrões do projeto (README, seção *Padrões obrigatórios*)

- [ ] Números validados com `validarDecimal` no backend e digitados em `<CampoDecimal>` no frontend (nada de `type="number"` ou `Number(valor)` direto)
- [ ] Valores calculados (áreas, totais) exibidos com a mesma conta e arredondamento do banco; colunas calculadas com `CHECK` no resultado
- [ ] Nomes únicos com índice `LOWER(...)` + erro de unicidade do banco traduzido para 409; listagens por nome com `COLLATE ordem_natural`
- [ ] Exclusões com verificação de vínculos dentro de `db.tx` + `FOR UPDATE`; registros com histórico são desativados, não apagados
- [ ] Formulário de edição não aparece quando o registro não pôde ser carregado
- [ ] Testado localmente com `docker compose -f docker-compose.dev.yml up --build`
