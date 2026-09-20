-- Accès admin + verrouillage des écritures côté client
-- À exécuter dans le SQL Editor de Supabase, après 0002. Rejouable sans risque.

-- 1. Drapeau admin : un compte admin contourne le paywall (voir README).
--    Il ne se modifie QUE depuis le SQL Editor (aucun utilisateur ne peut l'écrire via l'API).
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2. Sécurité : la policy "self update" de 0001 laissait chaque utilisateur modifier SA ligne
--    profiles avec la clé anon publique, donc s'attribuer subscription_status = 'active',
--    un palier premium ou is_admin = true sans payer. Plus aucune écriture n'est faite côté
--    client : tout passe par le serveur (clé service_role).
drop policy if exists "profiles: self update" on public.profiles;
revoke insert, update, delete on public.profiles from anon, authenticated;

-- 3. Les réponses au questionnaire sont maintenant enregistrées et validées par le serveur
--    au moment de l'inscription/paiement, plus directement par le navigateur.
drop policy if exists "questionnaire_responses: self insert" on public.questionnaire_responses;
revoke insert, update, delete on public.questionnaire_responses from anon, authenticated;

-- Pour te passer admin (remplace l'email par celui de ton compte) :
--   update public.profiles set is_admin = true where email = 'ton@email.com';
