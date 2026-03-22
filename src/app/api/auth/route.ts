export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { createOrUpdateUser } from "@/lib/firestore/users";

const FOURTEEN_DAYS_MS = 60 * 60 * 24 * 14 * 1000;
const FOURTEEN_DAYS_SEC = 60 * 60 * 24 * 14;

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: FOURTEEN_DAYS_MS,
    });

    // Create or update user in Firestore
    await createOrUpdateUser({
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      displayName: decodedToken.name || "",
      photoURL: decodedToken.picture || "",
    });

    const response = NextResponse.json({
      success: true,
      uid: decodedToken.uid,
    });

    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: FOURTEEN_DAYS_SEC,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
