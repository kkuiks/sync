'use client';

import {
  CalendarBlankIcon,
  GlobeIcon,
  LockSimpleIcon,
  ScrollIcon,
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  useGetProjectByHandle,
  useGetProjectTeammates,
} from '@/api/__generated__/project/project';
import type { GetProjectResponse } from '@/api/__generated__/types';
import {
  GetProjectResponseSummaryJoinPolicy,
  GetProjectTeammatesResponseTeammatesItemRole,
} from '@/api/__generated__/types';
import type { GetProjectTeammatesResponseTeammatesItem } from '@/api/__generated__/types';
import { ProfileAvatar } from '@/components/feature/profile/ProfileAvatar';
import { ProjectAvatar } from '@/components/feature/project/avatar';
import {
  useFollowProject,
  useUnfollowProject,
} from '@/components/feature/project/hooks/useFollowProject';
import { useJoinProject } from '@/components/feature/project/hooks/useProjectJoinRequest';
import { AvatarGroup } from '@/components/ui/avatar';
import { Button, LinkButton } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRequireAuth } from '@/hooks/use-require-auth';
import SyncError, { ErrorCode } from '@/lib/error';
import { cn, toSafeHttpUrl } from '@/lib/utils';
import ROUTES from '@/util/routes';

import AddTeammatePopover from '../../posts/_components/AddTeammatePopover';

const MAX_VISIBLE_MEMBERS = 5;
const MAX_VISIBLE_STAFF = 6;
const DESCRIPTION_CLAMP_THRESHOLD = 96;

interface ProjectInfoSidebarProps {
  handle: string;
}

function getJoinPolicyKey(joinPolicy: GetProjectResponseSummaryJoinPolicy) {
  switch (joinPolicy) {
    case GetProjectResponseSummaryJoinPolicy.Open:
      return 'open';
    case GetProjectResponseSummaryJoinPolicy.Request:
      return 'request';
    default:
      return 'invite';
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

export default function ProjectInfoSidebar({
  handle,
}: ProjectInfoSidebarProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <AboutSection handle={handle} />
        <RulesSection handle={handle} />
        <ContributorsSection handle={handle} />
      </CardContent>
    </Card>
  );
}

function AboutSection({ handle }: ProjectInfoSidebarProps) {
  const t = useTranslations('pages.projects.project.sidebar.about');
  const { data, isPending } = useGetProjectByHandle(handle);
  const {
    data: teammatesData,
    isPending: isTeammatesPending,
    isError: isTeammatesError,
  } = useGetProjectTeammates(handle);

  if (isPending || !data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  const { summary } = data.data;
  const websiteUrl = toSafeHttpUrl(summary.website);
  const joinPolicyKey = getJoinPolicyKey(summary.joinPolicy);
  const joinPolicyLabel = t(`join-policy.${joinPolicyKey}`);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProjectAvatar
            name={summary.name}
            seed={summary.handle}
            iconUrl={summary.iconUrl}
            size="lg"
          />
          <h1 className="truncate text-base font-bold">{summary.name}</h1>
        </div>
        <MembershipActions handle={handle} data={data.data} />
      </div>

      <DescriptionText text={summary.description || t('description-empty')} />

      <div className="text-muted-foreground space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <CalendarBlankIcon className="size-3.5 shrink-0" />
          {t('created', { date: formatDate(summary.createdAt) })}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-fit items-center gap-1.5">
              {summary.isPublic ? (
                <GlobeIcon className="size-3.5 shrink-0" />
              ) : (
                <LockSimpleIcon className="size-3.5 shrink-0" />
              )}
              {summary.isPublic
                ? t('visibility.public')
                : t('visibility.private')}
              {' · '}
              {joinPolicyLabel}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {t(
              `visibility-tooltip.${summary.isPublic ? 'public' : 'private'}.${joinPolicyKey}`,
            )}
          </TooltipContent>
        </Tooltip>
      </div>

      {websiteUrl && (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary flex items-center gap-1.5 text-sm hover:underline"
        >
          <GlobeIcon className="size-4 shrink-0" />
          <span className="truncate">{websiteUrl}</span>
        </a>
      )}

      <div className="flex gap-6">
        <BigStat count={summary.followerCount} label={t('stats.followers')} />
        {!isTeammatesError && (
          <BigStat
            count={
              isTeammatesPending ? (
                <Skeleton className="h-5 w-6" />
              ) : (
                teammatesData.data.teammates.length
              )
            }
            label={t('stats.members')}
          />
        )}
      </div>
    </div>
  );
}

function DescriptionText({ text }: { text: string }) {
  const t = useTranslations('pages.projects.project.sidebar.about');
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > DESCRIPTION_CLAMP_THRESHOLD;

  return (
    <div className="space-y-1">
      <p
        className={cn(
          'text-muted-foreground text-sm whitespace-pre-line',
          !expanded && isLong && 'line-clamp-3',
        )}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-primary text-xs font-medium hover:underline"
        >
          {expanded ? t('show-less') : t('show-more')}
        </button>
      )}
    </div>
  );
}

function MembershipActions({
  handle,
  data,
}: {
  handle: string;
  data: GetProjectResponse;
}) {
  const t = useTranslations('pages.projects.project.header');
  const { requireAuth } = useRequireAuth();

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
        onError: (error) => {
          if (error instanceof SyncError) {
            switch (error.code) {
              case ErrorCode.PROJECT_ALREADY_TEAMMATE:
                toast.error(t('join.already-member'));
                return;
              case ErrorCode.PROJECT_JOIN_REQUEST_ALREADY_EXISTS:
                toast.error(t('join.already-requested'));
                return;
              case ErrorCode.PROJECT_NOT_FOUND:
                toast.error(t('join.not-found'));
                return;
              case ErrorCode.PROJECT_JOIN_NOT_ALLOWED:
                toast.error(t('join.not-allowed'));
                return;
            }
          }
          toast.error(t('join.error'));
        },
      },
    );
  };

  const { summary, role, hasPendingJoinRequest, isFollowing } = data;
  const isMember = !!role;
  const canJoin =
    summary.joinPolicy === GetProjectResponseSummaryJoinPolicy.Open ||
    summary.joinPolicy === GetProjectResponseSummaryJoinPolicy.Request;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {isMember ? (
        <Button variant="outline" size="sm" className="rounded-full" disabled>
          {t('status.member')}
        </Button>
      ) : (
        canJoin &&
        (hasPendingJoinRequest ? (
          <Button variant="outline" size="sm" className="rounded-full" disabled>
            {t('join.requested-status')}
          </Button>
        ) : (
          <Button
            size="sm"
            className="rounded-full"
            disabled={isJoinPending}
            onClick={() => handleJoin(summary.joinPolicy)}
          >
            {summary.joinPolicy === GetProjectResponseSummaryJoinPolicy.Open
              ? t('join.join')
              : t('join.request')}
          </Button>
        ))
      )}

      {!isMember && (
        <Button
          variant={isFollowing ? 'default' : 'outline'}
          size="sm"
          className="rounded-full"
          disabled={isFollowPending || isUnfollowPending}
          onClick={() => handleFollowToggle(!!isFollowing)}
        >
          {isFollowing ? t('follow.following') : t('follow.follow')}
        </Button>
      )}
    </div>
  );
}

function BigStat({ count, label }: { count: ReactNode; label: ReactNode }) {
  return (
    <div>
      <div className="text-sm font-bold">{count}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  );
}

function StaffRow({
  teammate,
}: {
  teammate: GetProjectTeammatesResponseTeammatesItem;
}) {
  const { user } = teammate;

  return (
    <li className="flex items-center gap-2 text-sm">
      <ProfileAvatar
        name={user.name}
        seed={user.handle}
        imageUrl={user.profileImageUrl}
        size="sm"
      />
      <span className="truncate">{user.name}</span>
    </li>
  );
}

function RulesSection({ handle }: ProjectInfoSidebarProps) {
  const t = useTranslations('pages.projects.project.sidebar.rules');
  const { data, isPending } = useGetProjectByHandle(handle);

  if (isPending || !data?.data.summary.rules) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">
        <ScrollIcon className="size-4" />
        {t('heading')}
      </h2>
      <p className="text-muted-foreground text-sm whitespace-pre-line">
        {data.data.summary.rules}
      </p>
    </div>
  );
}

function ContributorsSection({ handle }: ProjectInfoSidebarProps) {
  const t = useTranslations('pages.projects.project.sidebar.contributors');
  const tStaff = useTranslations('pages.projects.project.sidebar.about.staff');
  const { data, isPending, isError } = useGetProjectTeammates(handle);

  if (isError) {
    return null;
  }

  const teammates = data?.data.teammates ?? [];
  const visibleTeammates = teammates.slice(0, MAX_VISIBLE_MEMBERS);
  const hiddenCount = teammates.length - visibleTeammates.length;
  const staff = teammates
    .filter(
      (teammate) =>
        teammate.isOwner ||
        teammate.role === GetProjectTeammatesResponseTeammatesItemRole.Admin,
    )
    .slice(0, MAX_VISIBLE_STAFF);

  return (
    <>
      <Separator />

      {!isPending && staff.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-medium">
            {tStaff('heading')}
          </h3>
          <ul className="space-y-1.5">
            {staff.map((teammate) => (
              <StaffRow key={teammate.user.handle} teammate={teammate} />
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {t('heading')}
            {!isPending && ` · ${teammates.length}`}
          </h2>

          <div className="flex items-center gap-3">
            <AddTeammatePopover
              projectHandle={handle}
              trigger={
                <Button variant="link" size="xs" className="h-auto p-0">
                  {t('invite')}
                </Button>
              }
            />
            <LinkButton
              href={ROUTES.PROJECT_MEMBERS(handle)}
              variant="link"
              size="xs"
              className="h-auto p-0"
            >
              {t('view-all')}
            </LinkButton>
          </div>
        </div>

        {isPending ? (
          <div className="flex -space-x-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="ring-background size-8 rounded-full ring-2"
              />
            ))}
          </div>
        ) : (
          <AvatarGroup>
            {visibleTeammates.map(({ user }) => (
              <Tooltip key={user.handle}>
                <TooltipTrigger asChild>
                  <ProfileAvatar
                    name={user.name}
                    seed={user.handle}
                    imageUrl={user.profileImageUrl}
                    size="sm"
                  />
                </TooltipTrigger>
                <TooltipContent>{user.name}</TooltipContent>
              </Tooltip>
            ))}
            {hiddenCount > 0 && (
              <div className="bg-muted text-muted-foreground ring-background relative flex size-8 shrink-0 items-center justify-center rounded-full text-xs ring-2">
                +{hiddenCount}
              </div>
            )}
          </AvatarGroup>
        )}
      </div>
    </>
  );
}
