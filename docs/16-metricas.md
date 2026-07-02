# 16 — Métricas locais

TASK 4 do masterplan (`docs/19`), adaptado ao stack web.

## Objetivo

Medir uso do app sem expor dados sensíveis. As métricas ficam guardadas por utilizador (tabela `metric_events`, RLS igual às restantes) e servem só para o próprio utilizador ver o seu histórico de uso (ex.: "sequência de dias" no dashboard motivacional) — não há telemetria enviada a terceiros.

## Eventos permitidos

- `EXPENSE_CREATED`
- `EXPENSE_UPDATED`
- `EXPENSE_DELETED`
- `SAVED_ITEM_CREATED`
- `WISHLIST_ITEM_CREATED`
- `WISHLIST_OPEN_AMAZON`
- `WISHLIST_CONVERTED_TO_PURCHASED`
- `RECURRING_PAYMENT_MARKED_PAID`
- `RECURRING_PAYMENT_MARKED_PARTIAL`
- `BACKUP_STARTED`
- `BACKUP_SUCCESS`
- `BACKUP_FAILED`

## O que nunca guardar

- Descrição do gasto.
- Nome do produto (wishlist/guardados).
- Link completo da Amazon/externo.
- Qualquer dado pessoal (email, nome).

Cada evento guarda apenas: `user_id`, `event_type`, `created_at`, e opcionalmente um `meta` numérico/categórico sem texto livre (ex.: `category_id`, nunca `description`).

## Schema (Supabase)

```sql
create table if not exists public.metric_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  meta       jsonb,
  created_at timestamptz not null default now()
);
alter table public.metric_events enable row level security;
create policy "own_all" on public.metric_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Equivalente web dos helpers Kotlin do masterplan

- `data/metrics/MetricEvent.kt` → `src/lib/metrics.ts` (tipo `MetricEventType` + função `logMetric(type, meta?)`).
- `data/metrics/MetricLogger.kt` / `LocalMetricRepository.kt` → a mesma função `logMetric` escreve direto no Supabase (`metric_events`), sem camada local separada (o Supabase já é a "base local" da nuvem do utilizador).

## Uso no dashboard motivacional

Contar `EXPENSE_CREATED` por dia consecutivo dá a "sequência de dias" (conquista "7 dias seguidos"). Contar `RECURRING_PAYMENT_MARKED_PAID` no mês dá "mês no azul" quando tudo está pago. Ver TASK 20 / dashboard motivacional (trabalho futuro).
