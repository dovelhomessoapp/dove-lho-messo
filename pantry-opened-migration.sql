-- Estensione non distruttiva: conserva tutti gli alimenti già inseriti.
alter table public.pantry_lots
  add column if not exists opened_on date,
  add column if not exists opened_until date;
alter table public.pantry_lots
  drop constraint if exists pantry_open_dates_valid;
alter table public.pantry_lots
  add constraint pantry_open_dates_valid check (
    (opened_on is null and opened_until is null)
    or (opened_on is not null and (opened_until is null or opened_until >= opened_on))
  );
