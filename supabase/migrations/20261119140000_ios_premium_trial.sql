create table public.home_premium_trials (
  home_id uuid primary key references public.homes(id) on delete cascade,
  started_by uuid not null unique,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null
);
alter table public.home_premium_trials enable row level security;
revoke all on public.home_premium_trials from public, anon, authenticated;

create function public.ios_premium_trial(p_home uuid, p_start boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_id uuid := auth.uid();
  trial_end timestamptz;
begin
  perform 1 from public.home_members m
  where m.home_id = p_home and m.user_id = account_id and m.role = 'owner'
  for share;
  if not found then
    return jsonb_build_object('eligible', false);
  end if;

  select t.ends_at into trial_end from public.home_premium_trials t where t.home_id = p_home;
  if found then return jsonb_build_object('eligible', false, 'endsAt', trial_end); end if;

  if exists (select 1 from public.home_premium_trials t where t.started_by = account_id)
     or exists (select 1 from public.home_subscriptions s where s.home_id = p_home)
     or exists (select 1 from public.apple_premium_subscriptions s where s.home_id = p_home)
     or exists (select 1 from public.home_entitlements h where h.home_id = p_home and h.entitlement = 'developer_premium') then
    return jsonb_build_object('eligible', false);
  end if;

  if not p_start then return jsonb_build_object('eligible', true); end if;

  insert into public.home_premium_trials(home_id, started_by, ends_at)
  values (p_home, account_id, now() + interval '30 days')
  on conflict do nothing;
  select t.ends_at into trial_end from public.home_premium_trials t where t.home_id = p_home;
  return jsonb_build_object('eligible', false, 'endsAt', trial_end);
end;
$$;
revoke all on function public.ios_premium_trial(uuid, boolean) from public, anon;
grant execute on function public.ios_premium_trial(uuid, boolean) to authenticated;

CREATE OR REPLACE FUNCTION public.home_subscription_status(p_home uuid)
 RETURNS TABLE(status text, trial_end timestamp with time zone, current_period_end timestamp with time zone, cancel_at_period_end boolean, stripe_price_id text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.is_home_member(p_home) then
    raise exception 'NOT_HOME_MEMBER';
  end if;

  if exists (
    select 1
    from public.home_entitlements he
    where he.home_id = p_home
      and he.entitlement = 'developer_premium'
  ) then
    return query
    select
      'developer'::text,
      null::timestamptz,
      null::timestamptz,
      false,
      null::text;
    return;
  end if;

  if not exists (
    select 1 from public.home_subscriptions hs
    where hs.home_id = p_home and hs.status in ('trialing', 'active')
  ) then
    return query
    select 'active'::text, null::timestamptz, aps.expires_at, false, null::text
    from public.apple_premium_subscriptions aps
    where aps.home_id = p_home and aps.expires_at > now() and aps.revoked_at is null
    order by aps.expires_at desc
    limit 1;
    if found then return; end if;
  end if;

  if not exists (
    select 1 from public.home_subscriptions hs
    where hs.home_id = p_home and hs.status in ('trialing','active')
  ) then
    return query
    select 'trialing'::text, t.ends_at, t.ends_at, false, null::text
    from public.home_premium_trials t
    where t.home_id = p_home and t.ends_at > now();
    if found then return; end if;
  end if;

  return query
  select hs.status, hs.trial_end, hs.current_period_end, hs.cancel_at_period_end, hs.stripe_price_id
  from public.home_subscriptions hs
  where hs.home_id = p_home;
end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_free_item_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_is_premium boolean;
  v_item_count integer;
begin
  if exists (
    select 1 from public.items i where i.id = new.id
  ) then
    return new;
  end if;

  select (
    exists (
      select 1
      from public.home_entitlements he
      where he.home_id = new.home_id
        and he.entitlement = 'developer_premium'
    )
    or exists (
      select 1
      from public.home_subscriptions hs
      where hs.home_id = new.home_id
        and hs.status in ('trialing','active')
    )
    or exists (
      select 1
      from public.apple_premium_subscriptions aps
      where aps.home_id = new.home_id and aps.expires_at > now() and aps.revoked_at is null
    )
    or exists (
      select 1 from public.home_premium_trials t
      where t.home_id = new.home_id and t.ends_at > now()
    )
  )
  into v_is_premium;

  if v_is_premium then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.home_id::text, 0));

  select count(*)
  into v_item_count
  from public.items i
  where i.home_id = new.home_id;

  if v_item_count >= 30 then
    raise exception using
      errcode = 'P0001',
      message = 'FREE_PLAN_ITEM_LIMIT_REACHED',
      detail = 'Il piano gratuito consente al massimo 30 elementi per casa.';
  end if;

  return new;
end;
$function$;
