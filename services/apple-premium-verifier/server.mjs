import { createHash, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { Environment } from "@apple/app-store-server-library";
import { createPremiumVerifier, loadAppleRootCertificates } from "./apple-verification.mjs";

const token = process.env.APPLE_VERIFIER_TOKEN;
if (!token || !/^[A-Za-z0-9_-]{43,}$/.test(token)) {
  throw new Error("Set APPLE_VERIFIER_TOKEN to a random base64url secret of at least 32 bytes");
}

const digest = (value) => createHash("sha256").update(value).digest();
const expectedAuthorization = digest("Bearer " + token);
const roots = await loadAppleRootCertificates();
const verifiers = new Map([
  [Environment.PRODUCTION, createPremiumVerifier(roots, Environment.PRODUCTION)],
  [Environment.SANDBOX, createPremiumVerifier(roots, Environment.SANDBOX)],
]);

const server = createServer(async (request, response) => {
  function send(status, body) {
    response.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify(body));
  }

  const method = request.url === "/transaction" ? "verifyTransaction"
    : request.url === "/notification" ? "verifyNotification"
    : null;
  if (request.method !== "POST" || !method) return send(404, { error: "Not found" });
  if (!timingSafeEqual(digest(request.headers.authorization ?? ""), expectedAuthorization)) {
    return send(401, { error: "Unauthorized" });
  }

  let body;
  try {
    const chunks = [];
    let length = 0;
    for await (const chunk of request.iterator({ destroyOnReturn: false })) {
      length += chunk.length;
      if (length > 140_000) {
        request.resume();
        return send(413, { error: "Payload too large" });
      }
      chunks.push(chunk);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return send(400, { error: "Invalid request" });
  }

  const verifier = verifiers.get(body?.environment);
  const maxLength = method === "verifyTransaction" ? 32_768 : 131_072;
  if (!verifier || typeof body?.signedPayload !== "string" ||
      body.signedPayload.length < 1 || body.signedPayload.length > maxLength) {
    return send(400, { error: "Invalid request" });
  }

  try {
    const verified = await verifier[method](body.signedPayload);
    return send(200, { verified });
  } catch (error) {
    const status = typeof error?.status === "number" ? error.status : undefined;
    console.warn("Apple verification rejected", { method, status });
    return send(422, { error: "Apple verification rejected", status });
  }
});
server.requestTimeout = 15_000;
server.listen(Number(process.env.PORT ?? 8080), "0.0.0.0");
