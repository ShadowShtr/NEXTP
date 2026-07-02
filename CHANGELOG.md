# Changelog

Todas as mudanças relevantes do NextP. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]

### Added
- **Assets NextP Clay System**: SVG masters de ícones (categorias, features, payment dots, saved, system, app) e backgrounds em `assets/`, servidos em `public/icons/`. Ligados à UI web (`CategoryIcon`, `FeatureIcon`, `PaymentDot`). Masterplan em `docs/19-claude-task-masterplan.md`.
- **Web app (Next.js + Supabase)**: 4 abas funcionais (Registos com edição, Guardados, Planeamento com checklist recorrente, Resumo com gráficos e Gastos Invisíveis), navegação com **+ central**, login email+password, deploy Vercel.
- **Docs de qualidade**: `14-quality-system.md`, `15-security.md`, `16-metricas.md`, `17-test-plan.md`, `18-amazon-wishlist.md` — Definition of Done, regras de segurança financeira, métricas locais sem dados sensíveis, matriz de testes manuais, e especificação da wishlist Amazon.

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
