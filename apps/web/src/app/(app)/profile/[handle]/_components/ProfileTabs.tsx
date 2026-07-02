'use client';

import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ProfilePosts from './ProfilePosts';

interface ProfileTabsProps {
  handle: string;
}

export default function ProfileTabs({ handle }: ProfileTabsProps) {
  const t = useTranslations('pages.profile');

  return (
    <Tabs defaultValue="posts">
      <TabsList variant="line">
        <TabsTrigger value="posts">{t('posts.label')}</TabsTrigger>
        <TabsTrigger value="questions">{t('tabs.questions.label')}</TabsTrigger>
        <TabsTrigger value="feed">{t('tabs.feed.label')}</TabsTrigger>
        <TabsTrigger value="likes">{t('tabs.likes.label')}</TabsTrigger>
        <TabsTrigger value="media">{t('tabs.media.label')}</TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        <ProfilePosts handle={handle} />
      </TabsContent>

      <TabsContent value="questions">
        {
          // TODO: 질문 탭 구현 필요
        }
        <ProfileTabEmptyState message={t('tabs.questions.empty')} />
      </TabsContent>

      <TabsContent value="feed">
        {
          // TODO: 피드 탭 구현 필요
        }
        <ProfileTabEmptyState message={t('tabs.feed.empty')} />
      </TabsContent>

      <TabsContent value="likes">
        {
          // TODO: 좋아요 탭 구현 필요
        }
        <ProfileTabEmptyState message={t('tabs.likes.empty')} />
      </TabsContent>

      <TabsContent value="media">
        {
          // TODO: 미디어 탭 구현 필요
        }
        <ProfileTabEmptyState message={t('tabs.media.empty')} />
      </TabsContent>
    </Tabs>
  );
}

function ProfileTabEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border px-4 py-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
