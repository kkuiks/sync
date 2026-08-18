'use client';

import { UserPlusIcon } from '@phosphor-icons/react/dist/ssr';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { toast } from 'sonner';

import {
  getGetProjectByHandleQueryOptions,
  useGetMyProjectJoinRequests,
} from '@/api/__generated__/project/project';
import { ProjectAvatar } from '@/components/feature/project/avatar';
import { useCancelJoinRequest } from '@/components/feature/project/hooks/useProjectJoinRequest';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import SyncError, { ErrorCode } from '@/lib/error';
import ROUTES from '@/util/routes';

function MyProjectJoinRequestsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 rounded-lg border p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function MyProjectJoinRequests() {
  const t = useTranslations('pages.projects.requests.join-requests');

  const queryClient = useQueryClient();

  const { data, isPending } = useGetMyProjectJoinRequests();

  const { mutate: cancelJoinRequest, isPending: isCancelling } =
    useCancelJoinRequest();

  if (isPending) {
    return (
      <section className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t('heading')}
        </h2>
        <MyProjectJoinRequestsSkeleton />
      </section>
    );
  }

  const joinRequests = data?.data.joinRequests ?? [];

  if (joinRequests.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserPlusIcon />
          </EmptyMedia>
          <EmptyTitle>{t('empty.title')}</EmptyTitle>
          <EmptyDescription>{t('empty.description')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const handleCancel = (requestId: number, projectHandle: string) => {
    cancelJoinRequest(
      { requestId: requestId.toString() },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(
            getGetProjectByHandleQueryOptions(projectHandle),
          );
          toast.success(t('messages.cancel-success'));
        },
        onError: (error) => {
          if (
            error instanceof SyncError &&
            error.code === ErrorCode.PROJECT_JOIN_REQUEST_NOT_FOUND
          ) {
            toast.error(t('messages.cancel-not-found'));
            return;
          }
          toast.error(t('messages.cancel-error'));
        },
      },
    );
  };

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
        {t('heading')}
        <Badge>{joinRequests.length}</Badge>
      </h2>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {joinRequests.map((request) => (
          <div
            key={request.id}
            className="bg-card border-hairline flex items-center justify-between gap-4 rounded-lg border p-4"
          >
            <Link
              href={ROUTES.PROJECT(request.project.handle)}
              className="flex min-w-0 items-center gap-3"
            >
              <ProjectAvatar
                name={request.project.name}
                seed={request.project.handle}
                iconUrl={request.project.iconUrl}
                size="lg"
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {request.project.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  @{request.project.handle}
                </span>
              </div>
            </Link>
            <Button
              size="sm"
              variant="outline"
              disabled={isCancelling}
              onClick={() => handleCancel(request.id, request.project.handle)}
            >
              {t('actions.cancel')}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
