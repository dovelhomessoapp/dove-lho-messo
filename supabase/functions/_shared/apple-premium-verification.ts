import { Buffer } from "node:buffer";
import {
  Environment,
  SignedDataVerifier,
} from "npm:@apple/app-store-server-library@2";

const bundleID = "it.dovelhomesso.casadolcecasa";
const appAppleID = 6832913103;
const premiumProductIDs = new Set([
  bundleID + ".premium.annuale",
  bundleID + ".premium.mensile",
]);

export function createPremiumVerifier(
  rootCertificates: readonly Uint8Array[],
  environment: Environment.PRODUCTION | Environment.SANDBOX,
) {
  if (rootCertificates.length === 0) {
    throw new Error("Apple root certificates are required");
  }

  const verifier = new SignedDataVerifier(
    rootCertificates.map((certificate) => Buffer.from(certificate)),
    true,
    environment,
    bundleID,
    appAppleID,
  );

  async function verifyTransaction(signedTransaction: string) {
    const transaction = await verifier.verifyAndDecodeTransaction(signedTransaction);
    if (
      (!transaction.productId || !premiumProductIDs.has(transaction.productId)) ||
      !transaction.originalTransactionId ||
      !transaction.appAccountToken ||
      !transaction.expiresDate ||
      !transaction.signedDate
    ) {
      throw new Error("Invalid Premium transaction");
    }
    return {
      environment,
      originalTransactionID: transaction.originalTransactionId,
      accountToken: transaction.appAccountToken.toLowerCase(),
      expiresAt: new Date(transaction.expiresDate).toISOString(),
      signedAt: new Date(transaction.signedDate).toISOString(),
      revokedAt: transaction.revocationDate
        ? new Date(transaction.revocationDate).toISOString()
        : null,
    };
  }

  async function verifyNotification(signedPayload: string) {
    const notification = await verifier.verifyAndDecodeNotification(signedPayload);
    const signedTransaction = notification.data?.signedTransactionInfo;
    if (!signedTransaction) return null;

    const transaction = await verifier.verifyAndDecodeTransaction(signedTransaction);
    if ((!transaction.productId || !premiumProductIDs.has(transaction.productId)) || !transaction.appAccountToken) return null;
    return verifyTransaction(signedTransaction);
  }

  return { verifyTransaction, verifyNotification };
}

export async function loadAppleRootCertificates(): Promise<Uint8Array[]> {
  const configured = Deno.env.get("APPLE_ROOT_CERTIFICATES_BASE64");
  if (configured) return configured.split(",").map((value) => Buffer.from(value.trim(), "base64"));
  const response = await fetch("https://www.apple.com/certificateauthority/AppleRootCA-G3.cer", {
    signal: AbortSignal.timeout(8000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Apple root certificate unavailable");
  const certificate = await response.arrayBuffer();
  const digest = Buffer.from(await crypto.subtle.digest("SHA-256", certificate)).toString("hex");
  if (digest !== "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179") {
    throw new Error("Unexpected Apple root certificate fingerprint");
  }
  return [new Uint8Array(certificate)];
}
