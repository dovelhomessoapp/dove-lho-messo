import { Buffer } from "node:buffer";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Environment } from "npm:@apple/app-store-server-library@2";
import { createPremiumVerifier } from "../_shared/apple-premium-verification.ts";

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error("Missing configuration: " + name);
  return value;
}

const roots = required("APPLE_ROOT_CERTIFICATES_BASE64").split(",")
  .map((value) => Buffer.from(value.trim(), "base64"));
const production = createPremiumVerifier(roots, Environment.PRODUCTION);
const sandbox = createPremiumVerifier(roots, Environment.SANDBOX);
const sandboxUsers = new Set(
  (Deno.env.get("APPLE_PREMIUM_SANDBOX_USERS") ?? "").split(",")
    .map((value) => value.trim().toLowerCase()).filter(Boolean),
);
const db = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const bearer = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i);
  if (!bearer) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data: { user }, error: authError } = await db.auth.getUser(bearer[1]);
  if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.homeId !== "string" || !uuid.test(body.homeId) ||
      typeof body.signedTransaction !== "string" || body.signedTransaction.length > 32768) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const accountToken = user.id.toLowerCase();
  const verified = await production.verifyTransaction(body.signedTransaction).catch(async () =>
    sandboxUsers.has(accountToken)
      ? await sandbox.verifyTransaction(body.signedTransaction).catch(() => null)
      : null
  );
  if (!verified || verified.accountToken !== accountToken) {
    return Response.json({ error: "Invalid purchase" }, { status: 422 });
  }

  const { data: active, error } = await db.rpc("record_apple_premium_purchase", {
    p_environment: verified.environment,
    p_original_transaction_id: verified.originalTransactionID,
    p_home_id: body.homeId,
    p_account_token: accountToken,
    p_expires_at: verified.expiresAt,
    p_revoked_at: verified.revokedAt,
    p_signed_at: verified.signedAt,
  });
  if (error) {
    console.error("Apple entitlement write failed", error.code);
    return Response.json({ error: "Activation unavailable" }, { status: 503 });
  }
  if (!active) return Response.json({ error: "No active purchase for this family" }, { status: 409 });
  return Response.json({ active: true });
});
