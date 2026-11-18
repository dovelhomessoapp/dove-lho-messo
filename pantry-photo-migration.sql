alter table public.pantry_lots
  add column photo text
  constraint pantry_lots_photo_jpeg
  check (octet_length(photo) <= 120000 and photo ~ '^data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}$');
