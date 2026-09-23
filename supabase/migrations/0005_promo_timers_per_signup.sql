-- Le minuteur de l'offre de lancement n'est plus lié à l'appareil (protection anti-abus retirée,
-- volontairement : la priorité est la conversion, tant que chaque promo correspond à un vrai
-- paiement). Chaque passage dans le questionnaire pose désormais un jeton neuf, jamais réutilisé
-- d'une visite à l'autre : un nouveau compte a donc toujours droit à un minuteur frais, même sur un
-- appareil qui en a déjà vu passer un. On renomme la colonne pour que le schéma reste honnête : elle
-- ne représente plus un « visiteur » qui reviendrait, juste un passage.
-- À exécuter dans le SQL Editor de Supabase, après 0004. Rejouable sans risque.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'promo_timers' and column_name = 'visitor_id'
  ) then
    alter table public.promo_timers rename column visitor_id to token;
  end if;
end $$;

notify pgrst, 'reload schema';
