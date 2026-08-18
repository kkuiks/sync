'use client';

import { ChatCircleIcon, HeartIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { useGetPostRecommendations } from '@/api/__generated__/post/post';
import {
  PostRecommendationType,
  PostScope,
} from '@/components/feature/post/types/post';
import { toPostSummary } from '@/components/feature/post/viewer/types';
import { ProjectAvatar } from '@/components/feature/project/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import ROUTES from '@/util/routes';

const VISIBLE_COUNT = '6';
const SKELETON_COUNT = 4;

export default function TrendingProjectPosts() {
  const t = useTranslations('pages.explore.projects.trending-posts');

  const { data, isPending } = useGetPostRecommendations({
    type: PostRecommendationType.TRENDING,
    scope: PostScope.WORKSPACE,
    first: VISIBLE_COUNT,
  });

  const posts = (data?.data.posts?.nodes ?? [])
    .map((node) => toPostSummary(node.content))
    .flatMap((post) => {
      const projectHandle = post.project?.handle;

      return projectHandle ? [{ post, projectHandle }] : [];
    });

  return (
    <aside className="space-y-3 lg:sticky lg:top-6">
      <h2 className="text-lg font-semibold">{t('title')}</h2>

      {isPending ? (
        <ul className="space-y-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <li key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </li>
          ))}
        </ul>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('empty')}</p>
      ) : (
        <ol className="divide-hairline divide-y">
          {posts.map(({ post, projectHandle }) => (
            <li key={post.id}>
              <Link
                href={ROUTES.PROJECT_POST(projectHandle, post.slug)}
                className="group hover:bg-muted/50 -mx-3 block space-y-1.5 rounded-lg px-3 py-3 transition-colors"
              >
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <ProjectAvatar
                    name={post.project?.name ?? ''}
                    seed={post.project?.handle ?? null}
                    iconUrl={post.project?.iconUrl}
                    className="size-4 rounded text-[0.5rem]"
                  />
                  <span className="truncate">{post.project?.name}</span>
                </div>

                <p className="line-clamp-2 text-sm font-medium group-hover:underline">
                  {post.title || post.preview}
                </p>

                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <HeartIcon className="size-3.5" />
                    {post.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <ChatCircleIcon className="size-3.5" />
                    {post.commentCount}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
