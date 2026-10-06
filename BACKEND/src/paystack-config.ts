import crypto from "crypto";

export type PaystackMode = "test" | "live";
export type PaystackRuntimeConfig = {
  mode: PaystackMode;
  secretKey: string;
  publicKey: string;
  callbackUrl?: string;
};

export function validatePaystackConfig(env: NodeJS.ProcessEnv): PaystackRuntimeConfig {
  const production = env.NODE_ENV === "production";
  const mode: PaystackMode = production ? "live" : "test";
  const secretKey = env.PAYSTACK_SECRET_KEY?.trim() || "";
  const publicKey = env.PAYSTACK_PUBLIC_KEY?.trim() || "";
  const secretPrefix = mode === "live" ? "sk_live_" : "sk_test_";
  const publicPrefix = mode === "live" ? "pk_live_" : "pk_test_";
  const secretValid = secretKey.length > 0 && secretKey.startsWith(secretPrefix);
  const publicValid = publicKey.length > 0 && publicKey.startsWith(publicPrefix);
  if (!secretValid || !publicValid) {
    throw new Error(`Paystack ${mode} configuration requires matching valid ${mode} secret and public keys`);
  }
  const callbackUrl = env.PAYSTACK_CALLBACK_URL?.trim();
  return { mode, secretKey, publicKey, ...(callbackUrl ? { callbackUrl } : {}) };
}

export function verifyPaystackSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  if (!/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

export function parseNairaToKobo(value: unknown, maximumNaira = 10_000_000): bigint | null {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const match = /^(0|[1-9]\d{0,8})(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const naira = BigInt(match[1]);
  if (naira > BigInt(maximumNaira)) return null;
  const kobo = naira * 100n + BigInt((match[2] || "").padEnd(2, "0"));
  return kobo > 0n ? kobo : null;
}

export function creatorShareKobo(totalKobo: bigint): bigint {
  if (totalKobo < 0n) throw new Error("Gift total cannot be negative");
  // Floor to the nearest whole kobo; the platform receives the exact remainder.
  return (totalKobo * 70n) / 100n;
}

export function formatNairaFromKobo(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / 100n;
  const fraction = String(absolute % 100n).padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}
