# Changelog

Todas as mudanças relevantes do NextP. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]

### Fixed
- **Documentação alinhada ao produto real** (DOC-01): README, `docs/13` e `docs/19` referiam Kotlin/Room/OTP de fases anteriores. Reescritos para refletir o stack ativo (Next.js + Supabase + Vercel, login email+password) — Android permanece arquivado em `android/`. `docs/02`, `docs/04`, `docs/09` e `docs/17` atualizados com as funcionalidades desta auditoria.

### Added
- **Motor financeiro central** (FINANCE-13/14/16): `src/lib/finance.ts` centraliza o cálculo de Saldo atual, Saldo previsto (descontando contas pendentes), Dinheiro livre (após reserva) e quanto dá para gastar por dia até ao fim do mês — usado em Registos e Resumo, coberto por testes (`tests/finance.test.ts`). Contas fixas marcadas como pagas contam sempre como gasto do mês, mesmo quando o utilizador não pede para lançar o gasto ligado, para nunca deixar dinheiro "invisível" fora das contas.
- **Previsão do mês** (FINANCE-16): Resumo mostra quanto vais gastar até ao fim do mês ao ritmo atual e o saldo previsto no fecho.
- **Fechamento mensal** (FINANCE-15): botão "Fechar mês" em Resumo guarda uma fotografia (receitas, gastos, saldo, categoria com maior gasto) numa nova tabela `monthly_closings`; histórico de meses fechados consultável, com opção de "Reabrir mês".
- **Carteiras** (FINANCE-12): nova tela em Configurações → Carteiras (Dinheiro, Banco, Cartão, Poupança, MB Way, Outro); gastos e receitas podem ficar ligados a uma carteira e o saldo de cada uma é sempre calculado a partir do saldo inicial + movimentos (nunca guardado numa coluna, para não dessincronizar).
- **Alertas de saldo** (ALERTS-01): Central de Alertas passa a avisar quando o saldo previsto do mês fica negativo e quando já vai a meio do mês sem nenhuma receita lançada.
- **Idempotência** (SAFETY-01): gasto manual, receita, conta recorrente lançada como gasto e item guardado lançado como gasto passam a ter uma `idempotency_key` única — duplo-toque, reenvio de rede ou "marcar pago" repetido nunca duplicam o registo.
- **Menu rápido no botão +** (UX-03): o botão central deixa de ir sempre direto para "novo gasto" — abre um menu com Despesa, Receita, Conta fixa, Item guardado, Quero comprar e Dívida, e leva logo para o sítio certo.
- **Login separado** (LOGIN-01): Entrar / Criar conta / Esqueci a password como fluxos explícitos e independentes (nunca cria conta silenciosamente após erro de login); botão "Entrar com Google" preparado (ativação do provider fica para trabalho futuro).
- **Gastos Invisíveis configurável** (SUMMARY-01): limite deixou de ser fixo em 5€, agora lido/gravado em `user_settings.small_expense_limit`.
- **BudgetSheet** (UI-01): orçamento mensal do card "Este mês" deixou de usar `prompt()` nativo, agora é uma bottom sheet clay com validação e opção de limpar.
- **Ícones oficiais na navegação** (UI-02): emojis da barra inferior substituídos pelos ícones oficiais (`CategoryIcon`/`FeatureIcon`) já usados no resto da app.
- **Conversão da wishlist via RPC** (WISHLIST-02): `convert_wishlist_to_saved_item` no Postgres faz a conversão numa única transação (`select ... for update` + índice único em `saved_items.wishlist_item_id`), eliminando a corrida entre passos que existia na versão client-side anterior.
- **Backup preservando relações** (BACKUP-02): a importação de um backup JSON agora reconstrói um mapa `old_id → new_id` por tabela e remapeia todas as chaves estrangeiras (categoria, recorrente, ocorrência, item da wishlist) na ordem correta — nunca mais perde vínculos entre registos.
- **Receitas e Saldo** (INCOME-01): nova tabela `income_entries` + `IncomeSheet` (CRUD); Resumo mostra total de receitas do mês e Saldo (receitas − gastos).
- **Histórico** (HISTORY-01): novo ecrã `HistoryView` com navegação por mês, gastos agrupados por dia (expandir/colapsar), edição direta de qualquer gasto passado.
- **Limites por categoria** (BUDGET-02): campo `monthly_limit` por categoria (já existia no schema) agora tem UI (`CategoryLimitsSheet`) e barra de progresso no Resumo com aviso aos 80% e alerta ao ultrapassar.
- **Upload de fotos** (STORAGE-01): `PhotoField` permite colar um link **ou** anexar/tirar foto (bucket `attachments` no Supabase Storage, pasta por utilizador) em Guardados e Wishlist — sem scraping, upload sempre iniciado pelo utilizador.
- **Central de Alertas** (NOTIF-02): `computeAlerts` calcula em tempo real contas vencidas/a vencer, garantias a expirar, categorias perto/acima do limite, Gastos Invisíveis altos e backup desatualizado; painel acessível pelo sino no cabeçalho com indicador de alertas pendentes.
- **Testes automatizados + CI** (QA-01): Vitest cobre `format`, `wishlist` e `recurring` (14 testes); `npm run typecheck`; GitHub Actions (`.github/workflows/ci.yml`) corre typecheck → test → build em cada push/PR para `main`.
- **Assets NextP Clay System**: SVG masters de ícones (categorias, features, payment dots, saved, system, app) e backgrounds em `assets/`, servidos em `public/icons/`. Ligados à UI web (`CategoryIcon`, `FeatureIcon`, `PaymentDot`). Masterplan em `docs/19-claude-task-masterplan.md`.
- **Web app (Next.js + Supabase)**: 4 abas funcionais (Registos com edição, Guardados, Planeamento com checklist recorrente, Resumo com gráficos e Gastos Invisíveis), navegação com **+ central**, login email+password, deploy Vercel.
- **Docs de qualidade**: `14-quality-system.md`, `15-security.md`, `16-metricas.md`, `17-test-plan.md`, `18-amazon-wishlist.md` — Definition of Done, regras de segurança financeira, métricas locais sem dados sensíveis, matriz de testes manuais, e especificação da wishlist Amazon.
- **Foto do produto** (Guardados e Quero comprar): campo para colar o link de uma imagem (não há scraping automático da Amazon — regra mantida em `docs/18-amazon-wishlist.md`); a lista mostra a foto em vez do ícone genérico quando definida, com fallback automático se o link falhar.
- **Wishlist Amazon em Guardados**: tabs Comprados/Quero comprar, formulário de produto desejado (link Amazon/externo, prioridade, preço alvo), conversão transacional em comprado sem duplicar.
- **Planeamento**: tabs por tipo (Contas/Dívidas/Compras/Objetivos); detalhe + histórico mensal completo de cada conta recorrente (marcar pago/parcial, lançar como gasto sem duplicar, desmarcar estorna o gasto).
- **Resumo**: comparação com o mês anterior, recorrentes pagos x pendentes do mês, dashboard motivacional (sequência de dias registando gastos + conquistas: primeiro gasto, 7 dias seguidos, mês no azul).
- **Configurações** (novo, ícone ⚙️ no header): exportar/importar backup em JSON, preferências de notificação (com permissão do browser), limite de gasto pequeno, sair da conta.
- **Métricas locais**: `metric_events` (Supabase, RLS) regista eventos de uso sem dados sensíveis, usado no dashboard motivacional.
- **Ilustrações 3D oficiais**: mascote (Registos), carteira (Guardados), cofrinho (Planeamento), gráfico (Resumo) e ícone final do app, a partir do pack `nextp_all_png_3d_assets` (otimizados para web, `public/illustrations/`).
- **Edição completa**: itens Guardados, produtos da Wishlist, itens de Planeamento (Contas/Dívidas/Compras/Objetivos, incluindo data de vencimento e valor pago) e contas recorrentes (nome/valor/**dia de vencimento**) agora são todos editáveis ao tocar no registo — com opção de apagar.
- **Planeamento → soma por mês**: cada tab (Contas/Dívidas/Compras/Objetivos) mostra o total previsto e a divisão por "Este mês / Próximo mês / Mais tarde / Sem data".

- **Fase 1 — Base do projeto**
  - Estrutura de pastas, `.gitignore`, README e documentação inicial (`docs/`).
  - Projeto Android (Kotlin + Jetpack Compose + Material 3) com Gradle version catalog.
  - Camada de dados com Room: entidades `Category`, `Expense`, `SavedItem`, `PlanningItem`, `RecurringPayment`, `RecurringPaymentOccurrence`, `MonthlySummary`, `UserSettings`.
  - DAOs principais e `NextPDatabase` com persistência em disco.
  - Seed de categorias padrão na primeira execução.
- **Fase 2 — Design system e ícone**
  - `NextP Clay System`: paleta, tipografia, shapes e componentes clay (`ClayCard`, `PaymentDot`).
  - Tema Compose (claro/escuro).
  - Ícone adaptativo do app (N + seta) e estrutura de assets.
  - Navegação principal com 4 abas (Registos, Guardados, Planeamento, Resumo).

[Unreleased]: https://github.com/USER/nextp/commits/main
