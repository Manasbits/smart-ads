import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

interface AuthContext {
  userId: string;
  email: string;
}

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: AuthContext
) => Promise<NextResponse | Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest) => {
    const sessionCookie = req.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie,
        true
      );
      return handler(req, {
        userId: decodedClaims.uid,
        email: decodedClaims.email || "",
      });
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  };
}
