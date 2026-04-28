export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";

const DISABLED = {
  error: "Workspace functionality is temporarily disabled.",
};

export const GET = withAuth(async () => {
  return NextResponse.json(DISABLED, { status: 410 });
});

export const POST = withAuth(async () => {
  return NextResponse.json(DISABLED, { status: 410 });
});

export const DELETE = withAuth(async () => {
  return NextResponse.json(DISABLED, { status: 410 });
});
