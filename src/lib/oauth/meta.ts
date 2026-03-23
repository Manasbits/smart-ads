import { createHmac, timingSafeEqual } from "crypto";

const META_API_VERSION = "v21.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// ─── CSRF State (HMAC-signed, no DB needed) ───────────────────────────────────

/**
 * Creates a signed state string: base64(payload) + "." + hmac_signature
 * Payload: { userId, provider, ts }
 */
export function createOAuthState(userId: string, provider: string): string {
  const secret = process.env.TOKEN_ENCRYPTION_KEY!;
  const payload = Buffer.from(JSON.stringify({ userId, provider, ts: Date.now() })).toString(
    "base64url"
  );
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/**
 * Verifies a state string, returns payload if valid and not expired (10 min TTL).
 */
export function verifyOAuthState(
  state: string
): { userId: string; provider: string } | null {
  try {
    const secret = process.env.TOKEN_ENCRYPTION_KEY!;
    const [payload, sig] = state.split(".");
    if (!payload || !sig) return null;

    const expectedSig = createHmac("sha256", secret).update(payload).digest("hex");
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    // 10-minute TTL
    if (Date.now() - data.ts > 10 * 60 * 1000) return null;

    return { userId: data.userId, provider: data.provider };
  } catch {
    return null;
  }
}

// ─── Meta OAuth ───────────────────────────────────────────────────────────────

export function buildMetaAuthUrl(state: string, redirectUri: string): string {
  const appId = process.env.META_APP_ID!;
  const scopes = ["ads_read", "ads_management", "business_management"].join(",");
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export async function exchangeCodeForShortLivedToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; tokenType: string }> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${META_BASE}/oauth/access_token?${params}`);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Failed to exchange Meta code");
  }
  return { accessToken: data.access_token, tokenType: data.token_type };
}

export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortLivedToken,
  });
  const res = await fetch(`${META_BASE}/oauth/access_token?${params}`);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Failed to exchange for long-lived token");
  }
  return { accessToken: data.access_token, expiresIn: data.expires_in as number };
}

export async function fetchMetaUserAndAccounts(accessToken: string): Promise<{
  userId: string;
  name: string;
  adAccounts: { id: string; name: string; currency: string }[];
}> {
  // Fetch user
  const userRes = await fetch(
    `${META_BASE}/me?fields=id,name&access_token=${accessToken}`
  );
  const userData = await userRes.json();
  if (!userRes.ok || userData.error) {
    throw new Error(userData.error?.message ?? "Failed to fetch Meta user");
  }

  // Fetch ad accounts
  const accountsRes = await fetch(
    `${META_BASE}/me/adaccounts?fields=id,name,currency&access_token=${accessToken}&limit=50`
  );
  const accountsData = await accountsRes.json();

  const adAccounts: { id: string; name: string; currency: string }[] =
    (accountsData.data ?? []).map((a: { id: string; name: string; currency: string }) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
    }));

  return { userId: userData.id as string, name: userData.name as string, adAccounts };
}
