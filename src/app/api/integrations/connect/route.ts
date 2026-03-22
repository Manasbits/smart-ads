import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getSessionForUser } from "@/lib/composio/client";

const VALID_TOOLKITS = ["METAADS", "SHOPIFY"] as const;
type ValidToolkit = (typeof VALID_TOOLKITS)[number];

function isValidToolkit(value: unknown): value is ValidToolkit {
  return typeof value === "string" && VALID_TOOLKITS.includes(value as ValidToolkit);
}

function isValidFromPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  // Must start with / but not // (prevent open redirect)
  return value.startsWith("/") && !value.startsWith("//");
}

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { toolkit, from } = body;

    if (!isValidToolkit(toolkit)) {
      return NextResponse.json(
        { error: "Invalid toolkit. Must be METAADS or SHOPIFY." },
        { status: 400 }
      );
    }

    const safeTo = isValidFromPath(from) ? from : "/settings";

    const session = await getSessionForUser(userId);

    const appOrigin = new URL(req.url).origin;
    const callbackUrl = `${appOrigin}/auth/callback?toolkit=${toolkit}&from=${encodeURIComponent(safeTo)}`;

    const connectionRequest = await session.authorize(toolkit, { callbackUrl });

    if (!connectionRequest.redirectUrl) {
      console.error("[connect] No redirectUrl returned from Composio", {
        userId,
        toolkit,
      });
      return NextResponse.json(
        { error: "Failed to initiate OAuth flow. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ redirectUrl: connectionRequest.redirectUrl });
  } catch (error) {
    console.error("[connect] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate connection" },
      { status: 500 }
    );
  }
});
