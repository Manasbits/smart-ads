import { createHmac, timingSafeEqual } from "crypto";

const SHOPIFY_API_VERSION = "2024-10";

// ─── Shopify OAuth ────────────────────────────────────────────────────────────

export function buildShopifyAuthUrl(
  shop: string,
  state: string,
  redirectUri: string
): string {
  const clientId = process.env.SHOPIFY_CLIENT_ID!;
  const scopes = [
    "read_orders",
    "read_products",
    "read_analytics",
    "read_customers",
  ].join(",");

  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

/**
 * Verifies Shopify's HMAC signature on the callback query params.
 * Shopify signs all params except `hmac` and `signature`.
 */
export function verifyShopifyHmac(params: URLSearchParams): boolean {
  const secret = process.env.SHOPIFY_CLIENT_SECRET!;
  const hmac = params.get("hmac");
  if (!hmac) return false;

  const filtered = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key !== "hmac" && key !== "signature") {
      filtered.set(key, value);
    }
  }

  // Sort keys and build query string manually
  const sortedKeys = [...filtered.keys()].sort();
  const message = sortedKeys.map((k) => `${k}=${filtered.get(k)}`).join("&");

  const expected = createHmac("sha256", secret).update(message).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function exchangeShopifyCode(
  shop: string,
  code: string
): Promise<string> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
      code,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? "Failed to exchange Shopify code");
  }
  return data.access_token as string;
}

export async function fetchShopInfo(
  shop: string,
  accessToken: string
): Promise<{ name: string; myshopifyDomain: string; scopes: string[] }> {
  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/shop.json`,
    { headers: { "X-Shopify-Access-Token": accessToken } }
  );
  const data = await res.json();
  if (!res.ok || !data.shop) {
    throw new Error("Failed to fetch Shopify shop info");
  }
  return {
    name: data.shop.name as string,
    myshopifyDomain: data.shop.myshopify_domain as string,
    scopes: [],
  };
}

export function normalizeShopDomain(input: string): string {
  // Ensure format: mystore.myshopify.com
  const cleaned = input
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();

  if (!cleaned.endsWith(".myshopify.com")) {
    return `${cleaned}.myshopify.com`;
  }
  return cleaned;
}
