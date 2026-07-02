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

-- ---------- METRIC EVENTS (ver docs/16-metricas.md) ----------
create table if not exists public.metric_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists metric_events_user_type_idx on public.metric_events(user_id, event_type);

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

do $$
declare t text;
begin
  foreach t in array array[
    'categories','expenses','saved_items','wishlist_items','planning_items',
    'recurring_payments','recurring_occurrences','user_settings','metric_events'
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
