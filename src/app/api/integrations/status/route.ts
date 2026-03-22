import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";

export const dynamic = "force-dynamic";

/** Exposes only whether the secret is present — never the key itself. */
export const GET = withAuth(async () => {
  const composioApiKeyConfigured = Boolean(
    process.env.COMPOSIO_API_KEY?.trim()
  );
  return NextResponse.json({ composioApiKeyConfigured });
});
