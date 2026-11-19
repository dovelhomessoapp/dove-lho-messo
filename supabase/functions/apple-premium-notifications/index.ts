import { createClient } from "npm:@supabase/supabase-js@2";
import { Environment } from "npm:@apple/app-store-server-library@2";
import { createPremiumVerifier, loadAppleRootCertificates } from "../_shared/apple-premium-verification.ts";

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing configuration: " + name);
  return value;
}

const certificates = await loadAppleRootCertificates();
const production = createPremiumVerifier(certificates, Environment.PRODUCTION);
const sandbox = createPremiumVerifier(certificates, Environment.SANDBOX);
const db = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const body = await request.json().catch(() => null);
  if (typeof body?.signedPayload !== "string" || body.signedPayload.length > 131072) {
    return new Response(null, { status: 400 });
  }

  let transaction;
  try {
    transaction = await production.verifyNotification(body.signedPayload)
      .catch(() => sandbox.verifyNotification(body.signedPayload));
  } catch {
    return new Response(null, { status: 503 });
  }
  if (!transaction) return new Response(null, { status: 204 });

  // Notifications can update an existing account binding but cannot create one.
  const { error } = await db.from("apple_premium_subscriptions").update({
    expires_at: transaction.expiresAt,
    revoked_at: transaction.revokedAt,
    signed_at: transaction.signedAt,
  })
    .eq("environment", transaction.environment)
    .eq("original_transaction_id", transaction.originalTransactionID)
    .eq("account_token", transaction.accountToken)
    .lt("signed_at", transaction.signedAt)
    .lte("expires_at", transaction.expiresAt);

  if (error) {
    console.error("Apple notification write failed", error.code);
    return new Response(null, { status: 503 });
  }
  return new Response(null, { status: 204 });
});
