-- Génération en arrière-plan + anti-doublon Stripe
-- À exécuter dans le SQL Editor de Supabase, après 0001_init.sql. Rejouable sans risque.

alter table public.generations
  add column if not exists status text not null default 'done'
    check (status in ('pending', 'done', 'failed')),
  add column if not exists error text,
  add column if not exists checkout_session_id text;

-- Une session Stripe Checkout ne peut produire qu'une seule génération initiale :
-- si Stripe renvoie deux fois le même événement, le second insert échoue (23505) et est ignoré.
create unique index if not exists generations_checkout_session_id_key
  on public.generations (checkout_session_id)
  where checkout_session_id is not null;
