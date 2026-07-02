# assets — NextP Clay System (masters visuais)

Fonte visual oficial do NextP. **Não usar ícones genéricos quando existir um SVG NextP correspondente.** Paleta azul/branco claymorphism (ver `docs/05-design-system.md`).

## Estrutura

```
assets/
  icons/svg/
    app/            nextp-app-icon.svg (base do ícone do launcher)
    categories/     category-food, transport, home, fun, fixed-bill, market,
                    health, documents, work, family, other
    features/       piggy-bank, wallet, chart, trophy, shield, bell,
                    calendar-check, cloud-backup, invisible-expenses
    payments/       payment-dot-pending | paid | partial | overdue | ignored
    saved/          purchased, receipt, warranty, wishlist, price-target,
                    open-link, amazon-link
    system/         settings, backup, export
  backgrounds/svg/  background-app-soft-blue, home-hero, onboarding-brand,
                    planning-clouds, saved-wallet, summary-charts
  references/       nextp-reference-*.png (direção visual — 10 telas)
```

## Uso

- **Web (atual):** os SVGs usados na UI são copiados para `public/icons/**` e
  servidos via `<img>`; o mapeamento categoria→ficheiro está em `src/lib/icons.tsx`.
- **Android (arquivado em `android/`):** converter os SVGs usados para
  VectorDrawable XML em `app/src/main/res/drawable/`, mantendo estes SVGs como master.

Todos os SVGs incluem `<title>` e `<desc>` para acessibilidade.
