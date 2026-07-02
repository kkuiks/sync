'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ProjectInvitations from './ProjectInvitations';
import UserProjects from './UserProjects';

const TABS = ['member', 'following', 'invitations'] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | undefined): value is Tab {
  return TABS.includes(value as Tab);
}

type ProjectsTabsProps = {
  initialTab?: string;
};

export default function ProjectsTabs({ initialTab }: ProjectsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<Tab>(
    isTab(initialTab) ? initialTab : 'member',
  );

  const handleTabChange = (value: string) => {
    if (!isTab(value)) {
      return;
    }

    setActiveTab(value);

    const params = new URLSearchParams();
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList variant="line" className="border-b w-full justify-start">
        <TabsTrigger value="member">Member</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
        <TabsTrigger value="invitations">Invitations</TabsTrigger>
      </TabsList>

      <TabsContent value="member">
        <UserProjects />
      </TabsContent>
      <TabsContent value="following">
        {
          // TODO: 프로젝트 팔로잉 기능 구현
        }
      </TabsContent>
      <TabsContent value="invitations">
        <ProjectInvitations />
      </TabsContent>
    </Tabs>
  );
}
