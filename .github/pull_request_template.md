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
- [ ] Testado localmente com `docker compose -f docker-compose.dev.yml up --build`
