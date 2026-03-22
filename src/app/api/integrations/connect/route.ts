import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { initiateOAuthConnection } from "@/lib/composio/client";

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

    const appOrigin = new URL(req.url).origin;
    const callbackUrl = `${appOrigin}/auth/callback?toolkit=${toolkit}&from=${encodeURIComponent(safeTo)}`;

    const connectionRequest = await initiateOAuthConnection(
      userId,
      toolkit,
      callbackUrl
    );

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

    const message =
      error instanceof Error && error.message.includes("OAuth auth config")
        ? error.message
        : "Failed to initiate connection";

    return NextResponse.json({ error: message }, { status: 500 });
  }
});
