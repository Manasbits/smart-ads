import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

let composioInstance: Composio | null = null;

function getComposio() {
  if (!composioInstance) {
    composioInstance = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new VercelProvider(),
    });
  }
  return composioInstance;
}

export async function getToolsForUser(userId: string) {
  try {
    const composio = getComposio();
    const session = await composio.create(userId);
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
