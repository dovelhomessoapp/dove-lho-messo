-- Apply only once the Apple verification endpoint is ready.
create table public.apple_premium_subscriptions (
  environment text not null check (environment in ('Production', 'Sandbox')),
  original_transaction_id text not null,
  home_id uuid not null references public.homes(id) on delete cascade,
  account_token uuid not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  signed_at timestamptz not null,
  primary key (environment, original_transaction_id)
);

create index on public.apple_premium_subscriptions (home_id, expires_at desc);
alter table public.apple_premium_subscriptions enable row level security;
revoke all on public.apple_premium_subscriptions from public, anon, authenticated;
grant select, insert, update on public.apple_premium_subscriptions to service_role;

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
