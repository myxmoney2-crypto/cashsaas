-- Minuteur de l'offre de lancement (10 minutes après la fin du questionnaire)
-- À exécuter dans le SQL Editor de Supabase, après 0003. Rejouable sans risque.

-- Un visiteur identifié par un cookie côté serveur (jamais un identifiant qu'il choisit) démarre son
-- minuteur une seule fois, à la fin réelle du questionnaire. Aucune policy n'est créée : anon et
-- authenticated n'ont donc AUCUN accès (lecture ou écriture) à cette table via l'API publique — seule
-- la clé service_role (utilisée uniquement côté serveur, jamais exposée au navigateur) peut la lire ou
-- l'écrire. C'est ce qui empêche un visiteur de lire ou modifier son propre started_at.
create table if not exists public.promo_timers (
  visitor_id uuid primary key,
  started_at timestamptz not null default now()
);

alter table public.promo_timers enable row level security;
revoke all on public.promo_timers from anon, authenticated;

notify pgrst, 'reload schema';
