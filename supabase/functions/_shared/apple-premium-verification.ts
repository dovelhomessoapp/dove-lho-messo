import { Buffer } from "node:buffer";
import {
  Environment,
  SignedDataVerifier,
} from "npm:@apple/app-store-server-library@2";

const bundleID = "it.dovelhomesso.casadolcecasa";
const appAppleID = 6832913103;
const annualProductID = bundleID + ".premium.annuale";

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
      transaction.productId !== annualProductID ||
      !transaction.originalTransactionId ||
      !transaction.appAccountToken ||
      !transaction.expiresDate ||
      !transaction.signedDate
    ) {
      throw new Error("Invalid annual Premium transaction");
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

  return { verifyTransaction };
}
