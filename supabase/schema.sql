-- ============================================================
-- NextP — Schema Supabase (Postgres)
-- Executar no SQL Editor do Supabase (uma vez).
-- Cada tabela é privada por utilizador via Row Level Security (RLS).
-- Os dados NUNCA se perdem em deploys/limpeza de cache (vivem aqui).
-- ============================================================

-- Extensão para uuid
create extension if not exists "pgcrypto";

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  icon          text not null default 'category',
  color         text not null default '#98A2B3',
  monthly_limit numeric,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);


-- ---------- WALLET ACCOUNTS (Carteiras, FINANCE-12) ----------
create table if not exists public.wallet_accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  type            text not null default 'OTHER', -- CASH | BANK | CARD | SAVINGS | MBWAY | OTHER
  initial_balance numeric not null default 0,
  color           text,
  icon            text,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
-- Nunca guardamos um "saldo atual" em coluna: fica calculado em runtime
-- (src/lib/wallets.ts) a partir do saldo inicial + receitas − gastos ligados
-- à carteira, para nunca dessincronizar quando um gasto é editado/apagado.

-- ---------- EXPENSES ----------
create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  description    text not null,
  amount         numeric not null,
  category_id    uuid references public.categories(id) on delete set null,
  date           date not null,            -- dia do gasto (yyyy-mm-dd)
  time           text,                     -- HH:mm
  payment_method text,
  note           text,
  is_recurring   boolean not null default false,
  source         text not null default 'MANUAL',
  occurrence_id  uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists expenses_user_date_idx on public.expenses(user_id, date);
create index if not exists expenses_user_cat_idx on public.expenses(user_id, category_id);
-- SAFETY-01 — evita gasto duplicado (duplo-toque, reenvio de rede, "marcar pago" repetido).
alter table public.expenses add column if not exists idempotency_key text;
create unique index if not exists expenses_user_idempotency_uq
  on public.expenses(user_id, idempotency_key) where idempotency_key is not null;
-- FINANCE-12 — de que carteira saiu o dinheiro (opcional; null = sem carteira definida).
alter table public.expenses add column if not exists wallet_account_id uuid references public.wallet_accounts(id) on delete set null;

-- ---------- SAVED ITEMS (Guardados > Comprados) ----------
create table if not exists public.saved_items (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  name                     text not null,
  amount                   numeric not null,
  purchase_date            date not null,
  store                    text,
  category                 text,
  warranty_until           date,
  invoice_image_path       text,
  purchase_url             text,
  source                   text not null default 'MANUAL',   -- MANUAL | WISHLIST
  wishlist_item_id         uuid,
  note                     text,
  count_as_monthly_expense boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
-- Colunas novas em bases já existentes (idempotente, não destrutivo):
alter table public.saved_items add column if not exists purchase_url text;
alter table public.saved_items add column if not exists source text not null default 'MANUAL';
alter table public.saved_items add column if not exists wishlist_item_id uuid;

-- ---------- WISHLIST ITEMS (Guardados > Quero comprar) ----------
-- Ver docs/18-amazon-wishlist.md. Fase 1: sem scraping, link colado manualmente.
create table if not exists public.wishlist_items (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  name                    text not null,
  expected_amount         numeric,
  target_amount           numeric,
  current_amount          numeric,
  amazon_url              text,
  external_url            text,
  image_path              text,
  category_id             uuid references public.categories(id) on delete set null,
  priority                text not null default 'MEDIUM',    -- LOW|MEDIUM|HIGH|URGENT
  status                  text not null default 'WISHLIST',  -- WISHLIST|PURCHASED
  desired_date            date,
  note                    text,
  converted_saved_item_id uuid references public.saved_items(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists wishlist_user_status_idx on public.wishlist_items(user_id, status);
create index if not exists wishlist_user_priority_idx on public.wishlist_items(user_id, priority);
create index if not exists wishlist_user_category_idx on public.wishlist_items(user_id, category_id);
create index if not exists wishlist_user_desired_date_idx on public.wishlist_items(user_id, desired_date);

-- ---------- PLANNING ITEMS ----------
create table if not exists public.planning_items (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  type             text not null default 'FUTURE_BILL',
  total_amount     numeric not null default 0,
  paid_amount      numeric not null default 0,
  due_date         date,
  priority         text not null default 'MEDIUM',
  status           text not null default 'PENDING',
  repeat_type      text not null default 'NONE',
  note             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- RECURRING PAYMENTS (template) ----------
create table if not exists public.recurring_payments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  amount              numeric not null,
  category_id         uuid references public.categories(id) on delete set null,
  due_day             int not null default 1,
  repeat_type         text not null default 'MONTHLY',
  start_date          date not null default current_date,
  end_date            date,
  reminder_enabled    boolean not null default true,
  reminder_days_before int not null default 1,
  auto_create_expense text not null default 'ASK',
  note                text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------- RECURRING OCCURRENCES (estado por mês, INDEPENDENTE) ----------
create table if not exists public.recurring_occurrences (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  recurring_payment_id uuid not null references public.recurring_payments(id) on delete cascade,
  month                int not null,   -- 1..12
  year                 int not null,
  due_date             date not null,
  expected_amount      numeric not null,
  paid_amount          numeric not null default 0,
  status               text not null default 'PENDING',
  paid_at              date,
  note                 text,
  created_expense_id   uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (recurring_payment_id, year, month)   -- 1 estado por mês
);

-- ---------- USER SETTINGS (1 linha por utilizador) ----------
create table if not exists public.user_settings (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  currency               text not null default 'EUR',
  daily_reminder_enabled boolean not null default true,
  daily_reminder_time    text not null default '21:00',
  monthly_budget         numeric,
  small_expense_limit    numeric not null default 5,
  backup_enabled         boolean not null default false,
  last_backup_at         timestamptz,
  theme                  text not null default 'system',
  updated_at             timestamptz not null default now()
);
alter table public.user_settings add column if not exists backup_enabled boolean not null default false;
alter table public.user_settings add column if not exists last_backup_at timestamptz;
alter table public.user_settings add column if not exists reserved_amount numeric not null default 0;

-- ---------- INCOME ENTRIES (Receitas, ver docs/02-requisitos.md) ----------
create table if not exists public.income_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount      numeric not null,
  date        date not null,
  source      text,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists income_user_date_idx on public.income_entries(user_id, date);
-- SAFETY-01 — evita receita duplicada (duplo-toque, reenvio de rede).
alter table public.income_entries add column if not exists idempotency_key text;
create unique index if not exists income_user_idempotency_uq
  on public.income_entries(user_id, idempotency_key) where idempotency_key is not null;
-- FINANCE-12 — em que carteira entrou o dinheiro (opcional; null = sem carteira definida).
alter table public.income_entries add column if not exists wallet_account_id uuid references public.wallet_accounts(id) on delete set null;

-- ---------- METRIC EVENTS (ver docs/16-metricas.md) ----------
create table if not exists public.metric_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists metric_events_user_type_idx on public.metric_events(user_id, event_type);

-- ---------- MONTHLY CLOSINGS (Fechamento mensal, FINANCE-15) ----------
create table if not exists public.monthly_closings (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  year                 int not null,
  month                int not null,
  income_total         numeric not null default 0,
  expense_total        numeric not null default 0,
  recurring_paid       numeric not null default 0,
  recurring_pending    numeric not null default 0,
  small_expense_total  numeric not null default 0,
  final_balance        numeric not null default 0,
  projected_balance    numeric not null default 0,
  top_category         text,
  closed_at            timestamptz not null default now(),
  reopened_at          timestamptz,
  created_at           timestamptz not null default now(),
  unique (user_id, year, month)
);

-- ============================================================
-- RLS: cada utilizador só acede às suas linhas.
-- ============================================================
alter table public.categories             enable row level security;
alter table public.expenses               enable row level security;
alter table public.saved_items            enable row level security;
alter table public.wishlist_items         enable row level security;
alter table public.planning_items         enable row level security;
alter table public.recurring_payments     enable row level security;
alter table public.recurring_occurrences  enable row level security;
alter table public.user_settings          enable row level security;
alter table public.metric_events          enable row level security;
alter table public.income_entries         enable row level security;
alter table public.monthly_closings       enable row level security;
alter table public.wallet_accounts        enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'categories','expenses','saved_items','wishlist_items','planning_items',
    'recurring_payments','recurring_occurrences','user_settings','metric_events',
    'income_entries','monthly_closings','wallet_accounts'
  ]
  loop
    execute format('drop policy if exists "own_all" on public.%I;', t);
    execute format($f$
      create policy "own_all" on public.%I
        for all
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- ============================================================
-- CORREÇÃO: categorias duplicadas (bug de corrida no seed antigo).
-- Mantém a categoria mais antiga de cada (user_id, name), reaponta tudo o que
-- referenciava as duplicadas, apaga as duplicadas e impede que voltem a
-- acontecer. Seguro correr sempre — não faz nada se já não houver duplicados.
-- ============================================================
do $$
begin
  with ranked as (
    select id, user_id, name,
           row_number() over (partition by user_id, name order by created_at asc, id asc) as rn,
           first_value(id) over (partition by user_id, name order by created_at asc, id asc) as keep_id
    from public.categories
  ),
  dups as (select id, keep_id from ranked where rn > 1)
  update public.expenses e set category_id = d.keep_id
    from dups d where e.category_id = d.id;

  with ranked as (
    select id, user_id, name,
           row_number() over (partition by user_id, name order by created_at asc, id asc) as rn,
           first_value(id) over (partition by user_id, name order by created_at asc, id asc) as keep_id
    from public.categories
  ),
  dups as (select id, keep_id from ranked where rn > 1)
  update public.recurring_payments rp set category_id = d.keep_id
    from dups d where rp.category_id = d.id;

  with ranked as (
    select id, user_id, name,
           row_number() over (partition by user_id, name order by created_at asc, id asc) as rn,
           first_value(id) over (partition by user_id, name order by created_at asc, id asc) as keep_id
    from public.categories
  ),
  dups as (select id, keep_id from ranked where rn > 1)
  update public.wishlist_items w set category_id = d.keep_id
    from dups d where w.category_id = d.id;

  with ranked as (
    select id, user_id, name,
           row_number() over (partition by user_id, name order by created_at asc, id asc) as rn
    from public.categories
  )
  delete from public.categories c using ranked r
    where c.id = r.id and r.rn > 1;
end $$;

create unique index if not exists categories_user_name_uq on public.categories(user_id, name);

-- ============================================================
-- WISHLIST-02: conversão transacional wishlist -> comprado.
-- Índice único: um wishlist_item nunca pode gerar mais de um saved_item.
-- ============================================================
create unique index if not exists saved_items_wishlist_item_uq
  on public.saved_items(wishlist_item_id) where wishlist_item_id is not null;

create or replace function public.convert_wishlist_to_saved_item(
  p_wishlist_id uuid,
  p_final_amount numeric,
  p_purchase_date date,
  p_count_as_expense boolean
) returns table (saved_item_id uuid, expense_id uuid)
language plpgsql
as $$
declare
  v_user_id uuid := auth.uid();
  v_wishlist public.wishlist_items;
  v_saved_id uuid;
  v_expense_id uuid;
begin
  select * into v_wishlist from public.wishlist_items
    where id = p_wishlist_id and user_id = v_user_id
    for update;

  if not found then
    raise exception 'wishlist item not found';
  end if;

  if v_wishlist.status = 'PURCHASED' then
    raise exception 'wishlist item already converted';
  end if;

  if p_final_amount is null or p_final_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  insert into public.saved_items (
    user_id, name, amount, purchase_date, purchase_url, invoice_image_path,
    source, wishlist_item_id, count_as_monthly_expense
  ) values (
    v_user_id, v_wishlist.name, p_final_amount, p_purchase_date,
    coalesce(v_wishlist.amazon_url, v_wishlist.external_url), v_wishlist.image_path,
    'WISHLIST', v_wishlist.id, coalesce(p_count_as_expense, false)
  ) returning id into v_saved_id;

  update public.wishlist_items
    set status = 'PURCHASED', converted_saved_item_id = v_saved_id, updated_at = now()
    where id = p_wishlist_id;

  if p_count_as_expense then
    insert into public.expenses (user_id, description, amount, date, time, payment_method, source, idempotency_key)
    values (v_user_id, v_wishlist.name, p_final_amount, p_purchase_date, to_char(now(), 'HH24:MI'), 'Outro', 'SAVED_ITEM', 'saved_item:' || v_saved_id)
    returning id into v_expense_id;
  end if;

  return query select v_saved_id, v_expense_id;
end;
$$;

grant execute on function public.convert_wishlist_to_saved_item(uuid, numeric, date, boolean) to authenticated;

-- ============================================================
-- STORAGE-01: bucket para fotos/faturas de Guardados e Wishlist.
-- Bucket público (leitura direta por URL); escrita/gestão só do próprio
-- dono, através de uma pasta com o seu user_id como primeiro segmento
-- do caminho (ex.: "<user_id>/foto.jpg").
-- ============================================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

drop policy if exists "attachments_owner_all" on storage.objects;
create policy "attachments_owner_all" on storage.objects
  for all
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "attachments_public_read" on storage.objects;
create policy "attachments_public_read" on storage.objects
  for select
  using (bucket_id = 'attachments');
