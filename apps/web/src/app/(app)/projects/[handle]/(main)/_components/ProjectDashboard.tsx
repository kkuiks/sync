'use client';

import { PencilIcon, PushPinIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  useGetPinnedPostsByProject,
  useGetPostsByProjectInfinite,
} from '@/api/__generated__/post/post';
import { useGetProjectByHandle } from '@/api/__generated__/project/project';
import { GetProjectResponseSummaryJoinPolicy } from '@/api/__generated__/types';
import { PostPreviewCard } from '@/components/feature/post/viewer/PostCard';
import PostList from '@/components/feature/post/viewer/PostList';
import PostListMessage from '@/components/feature/post/viewer/error/PostListMessage';
import { toPostSummary } from '@/components/feature/post/viewer/types';
import {
  useFollowProject,
  useUnfollowProject,
} from '@/components/feature/project/hooks/useFollowProject';
import { useJoinProject } from '@/components/feature/project/hooks/useProjectJoinRequest';
import { Button, LinkButton } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/hooks/use-require-auth';
import ROUTES from '@/util/routes';

import AddTeammatePopover from '../../posts/_components/AddTeammatePopover';

const PAGE_SIZE = '10';
const MAX_PINNED = 2;

interface ProjectDashboardProps {
  handle: string;
}

export default function ProjectDashboard({ handle }: ProjectDashboardProps) {
  return (
    <div className="space-y-6">
      <FeedHeader handle={handle} />
      <PinnedBanner handle={handle} />
      <ProjectFeed handle={handle} />
    </div>
  );
}

function FeedHeader({ handle }: { handle: string }) {
  const t = useTranslations('pages.projects.project.header');
  const tDashboard = useTranslations('pages.projects.project.dashboard.feed');
  const { requireAuth } = useRequireAuth();

  const { data, isPending } = useGetProjectByHandle(handle);
  const { mutate: followProject, isPending: isFollowPending } =
    useFollowProject();
  const { mutate: unfollowProject, isPending: isUnfollowPending } =
    useUnfollowProject();
  const { mutate: joinProject, isPending: isJoinPending } = useJoinProject();

  const handleFollowToggle = (isFollowing: boolean) => {
    if (!requireAuth({ intent: 'follow' })) {
      return;
    }

    if (isFollowing) {
      unfollowProject({ handle });
      return;
    }

    followProject({ handle });
  };

  const handleJoin = (joinPolicy: GetProjectResponseSummaryJoinPolicy) => {
    if (!requireAuth({ intent: 'join' })) {
      return;
    }

    joinProject(
      { handle },
      {
        onSuccess: () => {
          toast.success(
            joinPolicy === GetProjectResponseSummaryJoinPolicy.Open
              ? t('join.joined')
              : t('join.requested'),
          );
        },
        onError: () => {
          toast.error(t('join.error'));
        },
      },
    );
  };

  const { summary, role, hasPendingJoinRequest, isFollowing } =
    data?.data ?? {};
  const isMember = !!role;
  const canJoin =
    summary?.joinPolicy === GetProjectResponseSummaryJoinPolicy.Open ||
    summary?.joinPolicy === GetProjectResponseSummaryJoinPolicy.Request;

  return (
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-lg font-semibold">{tDashboard('heading')}</h1>

      {isPending ? (
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          {/* Membership — joining the project is separate from following it. */}
          {isMember ? (
            <Button variant="outline" disabled>
              {t('status.member')}
            </Button>
          ) : (
            canJoin &&
            summary &&
            (hasPendingJoinRequest ? (
              <Button variant="outline" disabled>
                {t('join.requested-status')}
              </Button>
            ) : (
              <Button
                disabled={isJoinPending}
                onClick={() => handleJoin(summary.joinPolicy)}
              >
                {summary.joinPolicy === GetProjectResponseSummaryJoinPolicy.Open
                  ? t('join.join')
                  : t('join.request')}
              </Button>
            ))
          )}

          {/* Following — for non-members only; membership already subscribes. */}
          {!isMember && (
            <Button
              variant="outline"
              disabled={isFollowPending || isUnfollowPending}
              onClick={() => handleFollowToggle(!!isFollowing)}
            >
              {isFollowing ? t('follow.following') : t('follow.follow')}
            </Button>
          )}

          {/* Writing — teammates only. */}
          {isMember && (
            <LinkButton href={ROUTES.NEW_PROJECT_POST(handle)}>
              <PencilIcon />
              {t('actions.write')}
            </LinkButton>
          )}
        </div>
      )}
    </div>
  );
}

function PinnedBanner({ handle }: { handle: string }) {
  const t = useTranslations('pages.projects.project.dashboard.pinned');
  const { data, isPending } = useGetPinnedPostsByProject(handle);
  const posts = (data?.data.posts ?? []).slice(0, MAX_PINNED);

  if (!isPending && posts.length === 0) {
    return null;
  }

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <div
          key={post.id}
          className="border-primary/30 bg-primary/5 overflow-hidden rounded-lg border"
        >
          <div className="text-primary flex items-center gap-1.5 px-4 pt-3 text-xs font-medium">
            <PushPinIcon weight="fill" className="size-3.5" />
            {t('badge')}
          </div>
          <PostPreviewCard summary={toPostSummary(post)} surface="flat" />
        </div>
      ))}
    </div>
  );
}

function ProjectFeed({ handle }: { handle: string }) {
  const t = useTranslations('pages.projects.project.posts');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useGetPostsByProjectInfinite(
    handle,
    { first: PAGE_SIZE },
    {
      query: {
        getNextPageParam: (lastPage) => {
          const pageInfo = lastPage.data.posts?.pageInfo;
          return pageInfo?.hasNextPage
            ? (pageInfo.endCursor ?? undefined)
            : undefined;
        },
      },
    },
  );

  const posts =
    data?.pages.flatMap((page) => page.data.posts?.nodes ?? []) ?? [];

  return (
    <PostList
      items={posts.map((post) => toPostSummary(post.content))}
      isPending={isPending}
      isError={isError}
      hasNextPage={!!hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      empty={<ProjectFeedEmpty handle={handle} />}
      error={
        <PostListMessage message={t('list.error')} variant="destructive" />
      }
      end={
        <div className="py-4 text-center">
          <p className="text-muted-foreground text-xs">{t('list.end')}</p>
        </div>
      }
    />
  );
}

function ProjectFeedEmpty({ handle }: { handle: string }) {
  const t = useTranslations('pages.projects.project.posts.empty-state');
  const { requireAuth } = useRequireAuth();

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div className="space-y-2">
        <p className="font-medium">{t('title')}</p>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>
      <div className="flex gap-2">
        <AddTeammatePopover
          projectHandle={handle}
          trigger={
            <Button variant="outline" size="sm">
              {t('invite')}
            </Button>
          }
        />
        <LinkButton
          href={ROUTES.NEW_PROJECT_POST(handle)}
          size="sm"
          onClick={(event) => {
            if (
              !requireAuth({
                intent: 'write',
                redirectTo: ROUTES.NEW_PROJECT_POST(handle),
              })
            ) {
              event.preventDefault();
            }
          }}
        >
          {t('write')}
        </LinkButton>
      </div>
    </div>
  );
}
