'use client';

import { MagnifyingGlassIcon, TrashIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@uidotdev/usehooks';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  getSearchAdminProjectQueryKey,
  useAdminDeleteProject,
  useSearchAdminProject,
} from '@/api/__generated__/project/project';
import type { AdminProjectSummary } from '@/api/__generated__/types/AdminProjectSummary';
import { ProjectAvatar } from '@/components/feature/project/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import SyncError, { ErrorCode } from '@/lib/error';
import ROUTES from '@/util/routes';

const DEBOUNCE_MS = 300;

export default function AdminProjectsPage() {
  const t = useTranslations('pages.admin.projects');
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  const trimmedQuery = debouncedQuery.trim();
  const params = { query: trimmedQuery };
  const { data, isFetching, error } = useSearchAdminProject(params, {
    query: { enabled: trimmedQuery.length > 0 },
  });

  const project = data?.data;
  const isPending = query !== debouncedQuery || isFetching;
  const hasQuery = trimmedQuery.length > 0;
  const notFound =
    hasQuery &&
    !isPending &&
    !project &&
    error instanceof SyncError &&
    error.code === ErrorCode.PROJECT_NOT_FOUND;

  const { mutate: deleteProject } = useAdminDeleteProject({
    mutation: {
      onSuccess: async () => {
        toast.success(t('messages.delete-success'));
        await queryClient.invalidateQueries({
          queryKey: getSearchAdminProjectQueryKey(params),
        });
      },
      onError: (mutationError) => {
        if (
          mutationError instanceof SyncError &&
          mutationError.code === ErrorCode.PROJECT_NOT_FOUND
        ) {
          toast.error(t('messages.not-found-error'));
          return;
        }
        toast.error(t('messages.delete-error'));
      },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <InputGroup className="max-w-md">
        <InputGroupAddon>
          <MagnifyingGlassIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('search.placeholder')}
        />
      </InputGroup>

      {!hasQuery ? (
        <p className="py-12 text-center text-muted-foreground">
          {t('search.prompt')}
        </p>
      ) : isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : notFound || !project ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MagnifyingGlassIcon />
            </EmptyMedia>
            <EmptyTitle>{t('empty', { query: trimmedQuery })}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ProjectResultCard project={project} onDelete={deleteProject} />
      )}
    </div>
  );
}

interface ProjectResultCardProps {
  project: AdminProjectSummary;
  onDelete: (variables: { handle: string }) => void;
}

function ProjectResultCard({ project, onDelete }: ProjectResultCardProps) {
  const t = useTranslations('pages.admin.projects');

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ProjectAvatar
            name={project.name}
            seed={project.handle}
            iconUrl={project.iconUrl}
          />
          <div className="flex flex-col">
            <Link
              href={ROUTES.PROJECT(project.handle)}
              className="font-medium hover:underline"
            >
              {project.name}
            </Link>
            <span className="text-sm text-muted-foreground">
              @{project.handle}
            </span>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <TrashIcon />
              {t('actions.delete')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('delete-dialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('delete-dialog.description', { name: project.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault();
                  onDelete({ handle: project.handle });
                }}
              >
                {t('actions.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <Field
          label={t('table.owner')}
          value={
            project.owner ? (
              <div className="flex flex-col">
                <span>{project.owner.name}</span>
                <span className="text-xs text-muted-foreground">
                  @{project.owner.handle}
                </span>
              </div>
            ) : (
              '-'
            )
          }
        />
        <Field
          label={t('table.visibility')}
          value={
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline">
                {t(
                  project.isPublic ? 'visibility.public' : 'visibility.private',
                )}
              </Badge>
              <Badge variant="outline">
                {t(`join-policies.${project.joinPolicy}`)}
              </Badge>
            </div>
          }
        />
        <Field
          label={t('table.teammate-count')}
          value={project.teammateCount}
        />
        <Field
          label={t('table.createdAt')}
          value={formatDate(project.createdAt)}
        />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div>{value}</div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
  }).format(new Date(value));
}
