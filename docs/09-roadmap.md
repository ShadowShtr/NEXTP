# 09 — Roadmap

Desenvolvimento **linear**, sem pular etapas. Cada fase termina com commit e atualização de docs/CHANGELOG.

> O produto pivotou para **web/PWA** (Next.js + Supabase, deploy Vercel) — ver `docs/13-web-supabase-vercel.md`. O projeto Android original fica arquivado em `android/`. As fases abaixo descrevem o estado da versão web (produto ativo).

- [x] **Fase 1 — Base**: estrutura, Git, GitHub, Vercel, Supabase, schema com RLS.
- [x] **Fase 2 — Design system e ícone**: paleta, componentes clay, navegação com **+** central, ícone adaptativo.
- [x] **Fase 3 — Registos**: registar/editar/apagar gasto, categorias rápidas, totais dia/mês, card de orçamento com progresso.
- [x] **Fase 4 — Guardados (base)**: registar item, garantia, contar ou não como gasto do mês.
- [x] **Fase 4b — Guardados: Wishlist Amazon**: tabs Comprados/Quero comprar, formulário de produto desejado, conversão transacional (RPC) em comprado sem duplicar. Doc `18-amazon-wishlist.md`.
- [x] **Fase 5 — Planeamento**: contas futuras, dívidas, compras desejadas, barras de progresso.
- [x] **Fase 6 — Pagamentos recorrentes**: templates + ocorrências mensais, checklist com bolinhas (SVG master), mês independente, suporte a parcelas (X/Y). Doc `11`.
- [x] **Fase 7 — Resumo e gráficos**: estatísticas, gráfico por categoria, evolução diária, Gastos Invisíveis (limite configurável), Receitas e Saldo, limites por categoria.
- [x] **Fase 8 — Notificações**: preferências guardadas + permissão do browser em Configurações, e **Central de Alertas** dentro da app (contas vencidas/a vencer, garantias, limites de categoria, backup antigo). Push automático em segundo plano continua trabalho futuro (ver `07-notificacoes.md`).
- [x] **Fase 9 — Backup**: exportar/importar JSON em Configurações, com relações entre tabelas preservadas na importação (mapa old_id→new_id).
- [x] **Fase 10 — Refinamento**: tabs de Planeamento por tipo, detalhe/histórico de conta recorrente, comparação mensal, dashboard motivacional, upload de fotos (Supabase Storage), histórico diário/mensal, testes automatizados (Vitest) + CI (GitHub Actions). Falta: ilustrações 3D completas, ampliar cobertura de testes.

## Entregável por etapa
Para cada fase documentar: o que foi feito, arquivos criados/alterados, como testar, o que falta, riscos técnicos, atualização de docs, commit.

## Masterplan detalhado
O trabalho segue as tasks numeradas de `docs/19-claude-task-masterplan.md` (TASK 0–20) e as tasks nomeadas de auditoria (DOC/LOGIN/SUMMARY/UI/WISHLIST/BACKUP/INCOME/HISTORY/BUDGET/STORAGE/NOTIF/QA), todas adaptadas ao stack web.
