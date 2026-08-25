'use client';

import { FireIcon, PencilIcon, QuestionMarkIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  useGetPinnedPostsByProject,
  useGetTopPostsByProject,
  useGetUnansweredQuestionsByProject,
} from '@/api/__generated__/post/post';
import { useGetProjectByHandle } from '@/api/__generated__/project/project';
import type { GetPostsResponsePostsItem } from '@/api/__generated__/types';
import { PostType } from '@/components/feature/post/types/post';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RelativeTime } from '@/components/ui/relative-time';
import { Skeleton } from '@/components/ui/skeleton';
import ROUTES from '@/util/routes';

const MAX_PINNED = 2;
const WORDS_PER_MINUTE = 200;

interface ProjectDashboardProps {
  handle: string;
}

export default function ProjectDashboard({ handle }: ProjectDashboardProps) {
  return (
    <div className="flex h-full flex-col space-y-6">
      <FeedHeader handle={handle} />
      <PinnedBanner handle={handle} />
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <TopPostsShelf handle={handle} />
        <UnansweredQuestionsShelf handle={handle} />
      </div>
    </div>
  );
}

function FeedHeader({ handle }: { handle: string }) {
  const t = useTranslations('pages.projects.project.header');
  const tDashboard = useTranslations('pages.projects.project.dashboard.feed');
  const { data, isPending } = useGetProjectByHandle(handle);
  const isMember = !!data?.data.role;

  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-lg font-semibold">{tDashboard('heading')}</h1>

      {isPending ? (
        <Skeleton className="h-9 w-24 rounded-md" />
      ) : (
        isMember && (
          <LinkButton href={ROUTES.NEW_PROJECT_POST(handle)}>
            <PencilIcon />
            {t('actions.write')}
          </LinkButton>
        )
      )}
    </div>
  );
}

function PinnedBanner({ handle }: { handle: string }) {
  const t = useTranslations('pages.projects.project.dashboard.pinned');
  const { data, isPending } = useGetPinnedPostsByProject(handle);
  const posts = (data?.data.posts ?? []).slice(0, MAX_PINNED);

  return (
    <Card className="min-h-72">
      <CardContent className="flex h-full flex-col space-y-3">
        <h2 className="text-sm font-semibold">{t('heading')}</h2>

        {isPending ? (
          <div className="flex-1 space-y-3">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground text-center text-sm">
              {t('empty')}
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            {posts.map((post) => (
              <PinnedPostCard key={post.id} handle={handle} post={post} t={t} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PinnedPostCard({
  handle,
  post,
  t,
}: {
  handle: string;
  post: GetPostsResponsePostsItem;
  t: ReturnType<
    typeof useTranslations<'pages.projects.project.dashboard.pinned'>
  >;
}) {
  const minutes = Math.max(1, Math.ceil(post.wordCount / WORDS_PER_MINUTE));

  return (
    <Link href={ROUTES.PROJECT_POST(handle, post.slug)}>
      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary">{t('badge')}</Badge>
          </div>
          <p className="text-sm font-semibold">{post.title || post.preview}</p>
          <p className="text-muted-foreground text-xs">
            {t('meta', { author: post.author.name, minutes })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function ShelfCard({
  handle,
  title,
  icon,
  href,
  isPending,
  posts,
  emptyMessage,
  renderMeta,
}: {
  handle: string;
  title: ReactNode;
  icon: ReactNode;
  href: string;
  isPending: boolean;
  posts: GetPostsResponsePostsItem[];
  emptyMessage: ReactNode;
  renderMeta: (post: GetPostsResponsePostsItem) => ReactNode;
}) {
  return (
    <Card className="min-h-72">
      <CardContent className="flex h-full flex-col space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            {icon}
            {title}
          </h2>
          <Link
            href={href}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            {'>'}
          </Link>
        </div>

        {isPending ? (
          <div className="flex-1 space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground text-center text-sm">
              {emptyMessage}
            </p>
          </div>
        ) : (
          <ul className="flex-1 space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={ROUTES.PROJECT_POST(handle, post.slug)}
                  className="block"
                >
                  <p className="truncate text-sm font-medium">
                    {post.title || post.preview}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {renderMeta(post)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TopPostsShelf({ handle }: { handle: string }) {
  const t = useTranslations('pages.projects.project.dashboard.top-posts');
  const { data, isPending } = useGetTopPostsByProject(handle);

  return (
    <ShelfCard
      handle={handle}
      title={t('heading')}
      icon={<FireIcon className="size-4" />}
      href={ROUTES.PROJECT_POSTS(handle)}
      isPending={isPending}
      posts={data?.data.posts ?? []}
      emptyMessage={t('empty')}
      renderMeta={(post) =>
        t('meta', {
          author: post.author.name,
          likes: post.likeCount,
          comments: post.commentCount,
        })
      }
    />
  );
}

function UnansweredQuestionsShelf({ handle }: { handle: string }) {
  const t = useTranslations(
    'pages.projects.project.dashboard.unanswered-questions',
  );
  const { data, isPending } = useGetUnansweredQuestionsByProject(handle);

  return (
    <ShelfCard
      handle={handle}
      title={t('heading')}
      icon={<QuestionMarkIcon className="size-4" />}
      href={ROUTES.PROJECT_POSTS(handle, { type: PostType.QUESTION })}
      isPending={isPending}
      posts={data?.data.posts ?? []}
      emptyMessage={t('empty')}
      renderMeta={(post) => (
        <>
          {post.author.name} · <RelativeTime date={post.createdAt} />
        </>
      )}
    />
  );
}
