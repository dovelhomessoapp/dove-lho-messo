create function public.record_apple_premium_purchase(
  p_environment text, p_original_transaction_id text, p_home_id uuid,
  p_account_token uuid, p_expires_at timestamptz, p_revoked_at timestamptz,
  p_signed_at timestamptz
) returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.home_members m
  where m.home_id = p_home_id and m.user_id = p_account_token and m.role = 'owner'
  for share;
  if not found then return false; end if;

  insert into public.apple_premium_subscriptions as existing
    (environment, original_transaction_id, home_id, account_token, expires_at, revoked_at, signed_at)
  values
    (p_environment, p_original_transaction_id, p_home_id, p_account_token,
     p_expires_at, p_revoked_at, p_signed_at)
  on conflict (environment, original_transaction_id) do update
  set expires_at = excluded.expires_at,
      revoked_at = excluded.revoked_at,
      signed_at = excluded.signed_at
  where existing.home_id = excluded.home_id
    and existing.account_token = excluded.account_token
    and existing.signed_at < excluded.signed_at;

  return exists (
    select 1 from public.apple_premium_subscriptions s
    where s.environment = p_environment
      and s.original_transaction_id = p_original_transaction_id
      and s.home_id = p_home_id and s.account_token = p_account_token
      and s.expires_at > now() and s.revoked_at is null
  );
end;
$$;

revoke all on function public.record_apple_premium_purchase(
  text, text, uuid, uuid, timestamptz, timestamptz, timestamptz
) from public, anon, authenticated;
grant execute on function public.record_apple_premium_purchase(
  text, text, uuid, uuid, timestamptz, timestamptz, timestamptz
) to service_role;
