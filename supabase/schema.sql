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

-- ---------- SAVED ITEMS (Guardados) ----------
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
  note                     text,
  count_as_monthly_expense boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

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
  theme                  text not null default 'system',
  updated_at             timestamptz not null default now()
);

-- ============================================================
-- RLS: cada utilizador só acede às suas linhas.
-- ============================================================
alter table public.categories             enable row level security;
alter table public.expenses               enable row level security;
alter table public.saved_items            enable row level security;
alter table public.planning_items         enable row level security;
alter table public.recurring_payments     enable row level security;
alter table public.recurring_occurrences  enable row level security;
alter table public.user_settings          enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'categories','expenses','saved_items','planning_items',
    'recurring_payments','recurring_occurrences','user_settings'
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
