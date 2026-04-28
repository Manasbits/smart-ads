"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IntegrationsPanel,
  ProfilePanel,
  SkillsPanel,
} from "@/components/panels/settings-panels";

export default function SettingsPage() {
  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold tracking-tight mb-6">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfilePanel />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <IntegrationsPanel />
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <SkillsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
