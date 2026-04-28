"use client";

import { ChatArea } from "@/components/chat/chat-area";
import {
  IntegrationsPanel,
  ProfilePanel,
  SkillsPanel,
} from "@/components/panels/settings-panels";
import type { ConnectedAccount } from "@/types";

interface ShellCenterPanelProps {
  activeView: "chat" | "integrations" | "skills" | "profile";
  conversationId: string | undefined;
  connectedAccounts: ConnectedAccount[];
}

export function ShellCenterPanel({
  activeView,
  conversationId,
  connectedAccounts,
}: ShellCenterPanelProps) {
  if (activeView === "integrations") return <IntegrationsPanel />;
  if (activeView === "skills") return <SkillsPanel />;
  if (activeView === "profile") return <ProfilePanel />;

  return (
    <ChatArea
      conversationId={conversationId}
      connectedAccounts={connectedAccounts}
    />
  );
}
