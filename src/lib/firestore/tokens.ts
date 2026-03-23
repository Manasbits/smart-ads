import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { encrypt, decrypt } from "@/lib/encryption";

type Provider = "meta_ads" | "shopify";

function tokensRef(userId: string, provider: Provider) {
  return adminDb.collection("users").doc(userId).collection("tokens").doc(provider);
}

// ─── Meta Ads ────────────────────────────────────────────────────────────────

export interface MetaTokenData {
  accessToken: string;
  tokenExpiresAt: Date;
  metaUserId: string;
  adAccounts: { id: string; name: string; currency: string }[];
  scopes: string[];
}

export async function saveMetaToken(
  userId: string,
  data: MetaTokenData
): Promise<void> {
  await tokensRef(userId, "meta_ads").set({
    accessToken: encrypt(data.accessToken),
    tokenExpiresAt: Timestamp.fromDate(data.tokenExpiresAt),
    metaUserId: data.metaUserId,
    adAccounts: data.adAccounts,
    scopes: data.scopes,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function getMetaToken(userId: string): Promise<MetaTokenData | null> {
  const doc = await tokensRef(userId, "meta_ads").get();
  if (!doc.exists) return null;
  const d = doc.data()!;
  return {
    accessToken: decrypt(d.accessToken as string),
    tokenExpiresAt: (d.tokenExpiresAt as Timestamp).toDate(),
    metaUserId: d.metaUserId as string,
    adAccounts: d.adAccounts as MetaTokenData["adAccounts"],
    scopes: d.scopes as string[],
  };
}

// ─── Shopify ──────────────────────────────────────────────────────────────────

export interface ShopifyTokenData {
  accessToken: string;
  shopDomain: string;
  shopName: string;
  scopes: string[];
}

export async function saveShopifyToken(
  userId: string,
  data: ShopifyTokenData
): Promise<void> {
  await tokensRef(userId, "shopify").set({
    accessToken: encrypt(data.accessToken),
    shopDomain: data.shopDomain,
    shopName: data.shopName,
    scopes: data.scopes,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function getShopifyToken(userId: string): Promise<ShopifyTokenData | null> {
  const doc = await tokensRef(userId, "shopify").get();
  if (!doc.exists) return null;
  const d = doc.data()!;
  return {
    accessToken: decrypt(d.accessToken as string),
    shopDomain: d.shopDomain as string,
    shopName: d.shopName as string,
    scopes: d.scopes as string[],
  };
}

// ─── Generic helpers ─────────────────────────────────────────────────────────

export async function hasToken(userId: string, provider: Provider): Promise<boolean> {
  const doc = await tokensRef(userId, provider).get();
  return doc.exists;
}

/** Returns safe metadata (no token) for display in the settings UI. */
export async function getTokenMeta(
  userId: string,
  provider: Provider
): Promise<Record<string, unknown> | null> {
  const doc = await tokensRef(userId, provider).get();
  if (!doc.exists) return null;
  const d = doc.data()!;
  // Strip the encrypted accessToken — never send it to the client
  const { accessToken: _omit, ...safe } = d;
  return safe;
}

export async function deleteToken(userId: string, provider: Provider): Promise<void> {
  await tokensRef(userId, provider).delete();
}
