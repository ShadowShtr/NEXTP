# 14 — NextP Quality System

Adaptado do masterplan (`docs/19`) ao stack real do NextP (Next.js + Supabase), TASK 2.

## Definition of Done por task

Uma task só está concluída se, simultaneamente:
1. `npm run build` compila sem erros.
2. Não quebra dados existentes (sem migração destrutiva no schema Supabase).
3. Respeita o visual NextP Clay System (azul/branco, cards clay, SVG masters — nunca emoji/ícone genérico onde exista SVG NextP).
4. Atualiza a documentação relevante em `docs/`.
5. Atualiza `CHANGELOG.md`.
6. Tem critério de teste manual descrito (ver `docs/17-test-plan.md`).

## Checklist antes de commit

- [ ] `npx next build` passa localmente.
- [ ] Sem `console.log` de dados sensíveis (valores, descrições, emails).
- [ ] Sem chaves/segredos hardcoded (usar `process.env.NEXT_PUBLIC_*`).
- [ ] Componentes novos usam `clay-card` / `clay-btn` / `CategoryIcon` / `FeatureIcon` do design system.
- [ ] Mensagens de erro em português, claras para o utilizador final.

## Checklist antes de PR / push para produção

- [ ] Commit segue o padrão (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`).
- [ ] `git push origin main` feito.
- [ ] `vercel deploy --prod --yes` executado e `readyState: READY` confirmado.
- [ ] URL de produção (`nextp-rouge.vercel.app`) responde 200.

## Checklist antes de gerar APK (quando Android voltar a ser trabalhado)

- [ ] Ícone adaptativo atualizado a partir do SVG master (`assets/icons/svg/app/nextp-app-icon.svg`).
- [ ] `versionCode`/`versionName` incrementados.
- [ ] ProGuard/R8 revisado.

## Checklist visual

- [ ] Paleta oficial usada (ver `docs/05-design-system.md`) — nunca cores fora da paleta.
- [ ] Cantos grandes (`rounded-clay*`), sombra suave (`shadow-clay*`).
- [ ] Ícones vindos de `assets/icons/svg/` via `src/lib/icons.tsx` — não introduzir emoji novo em telas de dados financeiros.
- [ ] Bolinhas de recorrentes usam sempre `PaymentDot` (5 estados oficiais).

## Checklist de persistência

- [ ] Toda escrita financeira vai para o Supabase (nunca `localStorage`/cache como fonte de verdade).
- [ ] RLS (`user_id = auth.uid()`) garantido em qualquer tabela nova — testar com 2 contas diferentes.
- [ ] Nenhuma operação depende de estado só-cliente que se perca ao fechar o browser.

## Checklist de segurança

Ver `docs/15-security.md` na íntegra antes de mexer em auth, formulários ou wishlist (URLs externas).

## Checklist de testes

Ver `docs/17-test-plan.md`. Pelo menos os fluxos críticos (criar/editar/apagar gasto; marcar recorrente pago; converter wishlist em comprado) devem ser testados manualmente antes do deploy.

## Checklist de métricas

Ver `docs/16-metricas.md`. Eventos locais não podem conter descrição de gasto, nome de produto, URL completo ou dados pessoais.

## Padrão de changelog

Cada entrada em `CHANGELOG.md` sob `## [Unreleased]`, com subtítulo `### Added` / `### Fixed` / `### Changed`, uma linha por funcionalidade, tom direto (o quê, não como).
