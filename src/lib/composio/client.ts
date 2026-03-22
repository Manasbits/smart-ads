import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

/** Composio toolkit slugs (see https://docs.composio.dev/tools/metaads, /toolkits/shopify). */
const DEFAULT_SMARTADS_TOOLKITS = ["METAADS", "SHOPIFY"] as const;
type Toolkit = (typeof DEFAULT_SMARTADS_TOOLKITS)[number];

/** Maps each toolkit to the env var holding its OAuth auth config ID. */
const AUTH_CONFIG_ENV: Record<Toolkit, string> = {
  METAADS: "COMPOSIO_METAADS_AUTH_CONFIG_ID",
  SHOPIFY: "COMPOSIO_SHOPIFY_AUTH_CONFIG_ID",
};

let composioInstance: Composio<VercelProvider> | null = null;

function getComposio() {
  if (!composioInstance) {
    composioInstance = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new VercelProvider(),
    });
  }
  return composioInstance;
}

/** Resolves the OAuth auth config ID for a toolkit, or throws. */
export function getAuthConfigId(toolkit: Toolkit): string {
  const envKey = AUTH_CONFIG_ENV[toolkit];
  const id = process.env[envKey]?.trim();
  if (!id) {
    throw new Error(
      `OAuth auth config not set: add ${envKey} to your .env.local`
    );
  }
  return id;
}

/**
 * Initiates an OAuth connection for a user via connectedAccounts.link().
 * This bypasses session.authorize() which ignores auth config IDs and
 * falls back to API-key auth.
 */
export async function initiateOAuthConnection(
  userId: string,
  toolkit: Toolkit,
  callbackUrl: string
) {
  if (!process.env.COMPOSIO_API_KEY?.trim()) {
    throw new Error("COMPOSIO_API_KEY is not configured");
  }
  const composio = getComposio();
  const authConfigId = getAuthConfigId(toolkit);

  const connectionRequest = await composio.connectedAccounts.link(
    userId,
    authConfigId,
    { callbackUrl }
  );

  return connectionRequest;
}

/**
 * Returns a full ToolRouterSession for the given user.
 * Used for fetching tools, checking toolkits status, etc.
 */
export async function getSessionForUser(userId: string) {
  if (!process.env.COMPOSIO_API_KEY?.trim()) {
    throw new Error("COMPOSIO_API_KEY is not configured");
  }
  const composio = getComposio();

  const authConfigs: Record<string, string> = {};
  for (const tk of DEFAULT_SMARTADS_TOOLKITS) {
    const id = process.env[AUTH_CONFIG_ENV[tk]]?.trim();
    if (id) authConfigs[tk] = id;
  }

  return composio.create(userId, {
    toolkits: [...DEFAULT_SMARTADS_TOOLKITS],
    manageConnections: true,
    ...(Object.keys(authConfigs).length > 0 && { authConfigs }),
  });
}

export async function getToolsForUser(userId: string) {
  try {
    if (!process.env.COMPOSIO_API_KEY?.trim()) {
      console.warn("[composio] COMPOSIO_API_KEY is missing; tools disabled");
      return {};
    }

    const session = await getSessionForUser(userId);
    const tools = await session.tools();
    return tools;
  } catch (error) {
    console.error(
      "[composio] Failed to get tools:",
      JSON.stringify({ userId, error: String(error) })
    );
    // Graceful degradation — chat works without tools
    return {};
  }
}

/**
 * Disconnects a connected account from Composio.
 * Revokes tokens and removes the connection permanently.
 */
export async function disconnectAccount(connectedAccountId: string) {
  const composio = getComposio();
  await composio.connectedAccounts.delete(connectedAccountId);
}
