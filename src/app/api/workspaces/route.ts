export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import {
  createWorkspace,
  listWorkspaces,
  deleteWorkspace,
} from "@/lib/firestore/workspaces";

export const GET = withAuth(async (_req, { userId }) => {
  const workspaces = await listWorkspaces(userId);
  return NextResponse.json({ workspaces });
});

export const POST = withAuth(async (req, { userId }) => {
  const { name, description, icon } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Workspace name is required" },
      { status: 400 }
    );
  }

  const workspaceId = await createWorkspace(
    userId,
    name.trim(),
    description,
    icon
  );

  return NextResponse.json({ workspaceId }, { status: 201 });
});

export const DELETE = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("id");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "Workspace ID is required" },
      { status: 400 }
    );
  }

  await deleteWorkspace(workspaceId, userId);
  return NextResponse.json({ success: true });
});
