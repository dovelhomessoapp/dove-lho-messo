create table public.dlm_account_deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now()
);

alter table public.dlm_account_deletion_requests enable row level security;
revoke all on public.dlm_account_deletion_requests from public, anon, authenticated;
grant select, insert (user_id) on public.dlm_account_deletion_requests to authenticated;

create policy "Read own deletion request"
on public.dlm_account_deletion_requests for select to authenticated
using (user_id = (select auth.uid()));

create policy "Submit own deletion request"
on public.dlm_account_deletion_requests for insert to authenticated
with check (user_id = (select auth.uid()));

create function public.dlm_request_account_deletion()
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  requester uuid := auth.uid();
  receipt timestamptz;
begin
  if requester is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  insert into public.dlm_account_deletion_requests (user_id) values (requester)
  on conflict (user_id) do nothing;

  select requested_at into strict receipt
  from public.dlm_account_deletion_requests
  where user_id = requester;
  return receipt;
end;
$$;

revoke all on function public.dlm_request_account_deletion() from public, anon;
grant execute on function public.dlm_request_account_deletion() to authenticated;

create function public.dlm_admin_account_deletion_requests()
returns table (user_id uuid, email text, requested_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.app_admins a where a.user_id = auth.uid()) then
    raise exception 'ADMIN_ONLY' using errcode = '42501';
  end if;

  return query
  select r.user_id, u.email::text, r.requested_at
  from public.dlm_account_deletion_requests r
  join auth.users u on u.id = r.user_id
  order by r.requested_at;
end;
$$;

revoke all on function public.dlm_admin_account_deletion_requests() from public, anon;
grant execute on function public.dlm_admin_account_deletion_requests() to authenticated;
