-- CashSaaS — schema initial
-- À exécuter dans le SQL Editor de ton projet Supabase (ou via `supabase db push`).

create extension if not exists "pgcrypto";

-- Un enregistrement par utilisateur, lié à Supabase Auth
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  stripe_customer_id text unique,
  subscription_tier text check (subscription_tier in ('starter', 'pro', 'premium')),
  subscription_status text not null default 'none'
    check (subscription_status in ('none', 'active', 'past_due', 'canceled')),
  created_at timestamptz not null default now()
);

-- Les 26 réponses brutes du questionnaire, en JSON
create table if not exists public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  answers jsonb not null,
  submitted_at timestamptz not null default now()
);

-- Chaque génération produite (idée + code + prompt)
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tier text not null check (tier in ('starter', 'pro', 'premium')),
  idea_name text,
  niche text,
  prompt_text text,
  result jsonb,
  code_repo_url text,
  created_at timestamptz not null default now()
);

-- Compteur de régénérations utilisées dans le mois en cours, pour appliquer le plafond par palier
create table if not exists public.regenerations_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  month text not null, -- format 'YYYY-MM'
  count int not null default 0,
  primary key (user_id, month)
);

alter table public.profiles enable row level security;
alter table public.questionnaire_responses enable row level security;
alter table public.generations enable row level security;
alter table public.regenerations_usage enable row level security;

-- Chacun ne voit / modifie que ses propres lignes. Le webhook Stripe et la génération
-- passent par la clé service_role, qui contourne RLS.
create policy "profiles: self select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: self update" on public.profiles
  for update using (auth.uid() = id);

create policy "questionnaire_responses: self select" on public.questionnaire_responses
  for select using (auth.uid() = user_id);
create policy "questionnaire_responses: self insert" on public.questionnaire_responses
  for insert with check (auth.uid() = user_id);

create policy "generations: self select" on public.generations
  for select using (auth.uid() = user_id);

create policy "regenerations_usage: self select" on public.regenerations_usage
  for select using (auth.uid() = user_id);

-- Crée automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
