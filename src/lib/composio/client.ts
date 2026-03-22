import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

/** Composio toolkit slugs (see https://docs.composio.dev/tools/metaads, /toolkits/shopify). */
const DEFAULT_SMARTADS_TOOLKITS = ["METAADS", "SHOPIFY"] as const;

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

/**
 * Returns a full ToolRouterSession for the given user.
 * Use this when you need session.authorize() or session.toolkits().
 */
export async function getSessionForUser(userId: string) {
  if (!process.env.COMPOSIO_API_KEY?.trim()) {
    throw new Error("COMPOSIO_API_KEY is not configured");
  }
  const composio = getComposio();
  return composio.create(userId, {
    toolkits: [...DEFAULT_SMARTADS_TOOLKITS],
    manageConnections: true,
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
