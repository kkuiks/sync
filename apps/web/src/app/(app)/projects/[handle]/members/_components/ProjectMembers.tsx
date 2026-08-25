'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useGetProjectTeammates } from '@/api/__generated__/project/project';
import { GetProjectTeammatesResponseTeammatesItemRole } from '@/api/__generated__/types';
import { ProfileAvatar } from '@/components/feature/profile/ProfileAvatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ROUTES from '@/util/routes';

export default function ProjectMembers() {
  const t = useTranslations('pages.projects.project.members');
  const roleT = useTranslations('pages.projects.project.settings.teammates');

  const { handle } = useParams<{ handle: string }>();
  const { data, isPending, isError } = useGetProjectTeammates(handle);

  const roleLabel: Record<
    GetProjectTeammatesResponseTeammatesItemRole,
    string
  > = {
    [GetProjectTeammatesResponseTeammatesItemRole.Admin]: roleT('role.admin'),
    [GetProjectTeammatesResponseTeammatesItemRole.Member]: roleT('role.member'),
  };

  const teammates = data?.data.teammates ?? [];

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">{t('label')}</h1>

      {isPending ? (
        <ProjectMembersSkeleton />
      ) : isError ? (
        <p className="text-muted-foreground text-sm">{t('list.error')}</p>
      ) : teammates.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('list.empty')}</p>
      ) : (
        <ul className="divide-y">
          {teammates.map((teammate) => (
            <li key={teammate.user.handle}>
              <Link
                href={ROUTES.PROFILE(teammate.user.handle)}
                className="flex items-center gap-3 py-3"
              >
                <ProfileAvatar
                  name={teammate.user.name}
                  seed={teammate.user.handle}
                  imageUrl={teammate.user.profileImageUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {teammate.user.name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    @{teammate.user.handle}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {teammate.isOwner && (
                    <Badge variant="outline">{t('role.owner')}</Badge>
                  )}
                  <Badge variant="outline">{roleLabel[teammate.role]}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProjectMembersSkeleton() {
  return (
    <ul className="divide-y">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index} className="flex items-center gap-3 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}
