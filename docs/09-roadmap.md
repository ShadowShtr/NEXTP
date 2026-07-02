# 09 — Roadmap

Desenvolvimento **linear**, sem pular etapas. Cada fase termina com commit e atualização de docs/CHANGELOG.

> O produto pivotou para **web/PWA** (Next.js + Supabase, deploy Vercel) — ver `docs/13-web-supabase-vercel.md`. O projeto Android original fica arquivado em `android/`. As fases abaixo descrevem o estado da versão web (produto ativo).

- [x] **Fase 1 — Base**: estrutura, Git, GitHub, Vercel, Supabase, schema com RLS.
- [x] **Fase 2 — Design system e ícone**: paleta, componentes clay, navegação com **+** central, ícone adaptativo.
- [x] **Fase 3 — Registos**: registar/editar/apagar gasto, categorias rápidas, totais dia/mês, card de orçamento com progresso.
- [x] **Fase 4 — Guardados (base)**: registar item, garantia, contar ou não como gasto do mês.
- [ ] **Fase 4b — Guardados: Wishlist Amazon**: tabs Comprados/Quero comprar, formulário de produto desejado, conversão em comprado sem duplicar. Doc `18-amazon-wishlist.md`. *(em curso)*
- [x] **Fase 5 — Planeamento**: contas futuras, dívidas, compras desejadas, barras de progresso.
- [x] **Fase 6 — Pagamentos recorrentes**: templates + ocorrências mensais, checklist com bolinhas (SVG master), mês independente. Doc `11`.
- [x] **Fase 7 — Resumo e gráficos**: estatísticas, gráfico por categoria, evolução diária, Gastos Invisíveis.
- [x] **Fase 8 — Notificações (base)**: preferências guardadas (lembrete diário, hora, limite de gasto pequeno) + permissão do browser em Configurações. Disparo automático no iPhone precisa de Web Push com servidor — trabalho futuro (ver `07-notificacoes.md`).
- [x] **Fase 9 — Backup**: exportar/importar JSON em Configurações (dados já vivem no Supabase; isto é cópia extra portátil).
- [x] **Fase 10 — Refinamento (parcial)**: tabs de Planeamento por tipo, detalhe/histórico de conta recorrente, comparação mensal e recorrentes pagos x pendentes no Resumo, dashboard motivacional (sequência de dias + conquistas). Faltam: ilustrações 3D completas, testes automatizados.

## Entregável por etapa
Para cada fase documentar: o que foi feito, arquivos criados/alterados, como testar, o que falta, riscos técnicos, atualização de docs, commit.

## Masterplan detalhado
A partir da Fase 4b, o trabalho segue as tasks numeradas de `docs/19-claude-task-masterplan.md` (TASK 0–20), adaptadas ao stack web.
