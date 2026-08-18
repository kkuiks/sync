'use client';

import {
  DotsThreeIcon,
  DownloadSimpleIcon,
  LinkSimpleIcon,
  PencilSimpleIcon,
  PushPinIcon,
  PushPinSlashIcon,
  SirenIcon,
  StackSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useGetProjectByHandle } from '@/api/__generated__/project/project';
import { GetProjectResponseRole } from '@/api/__generated__/types';
import { AddToCollectionDialog } from '@/components/feature/collection/AddToCollectionDialog';
import { useExportPostMarkdown } from '@/components/feature/post/export/useExportPostMarkdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRequireAuth } from '@/hooks/use-require-auth';
import ROUTES from '@/util/routes';

import { useCopyPostLink } from '../hooks/useCopyPostLink';
import { useDeletePostDialog } from '../hooks/useDeletePostDialog';
import { usePinToggle } from '../hooks/usePinToggle';
import { useReportPostDialog } from '../hooks/useReportPostDialog';
import type { PostCardVariant, PostSummary } from '../types';
import { ReportPostDialog } from './ReportPostDialog';

export function PostActionsMenu({
  summary,
  postPath,
  variant,
}: {
  summary: PostSummary;
  postPath: string;
  variant: PostCardVariant;
}) {
  const t = useTranslations('pages.posts.report');
  const tDelete = useTranslations('pages.posts.delete');
  const tCopyLink = useTranslations('pages.posts.copy-link');
  const tViewer = useTranslations('components.post.viewer');
  const tEdit = useTranslations('pages.posts.edit');
  const tCollection = useTranslations('pages.collections');
  const tExport = useTranslations('pages.posts.export');
  const tPin = useTranslations('pages.posts.pin');
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [addToCollectionOpen, setAddToCollectionOpen] = useState(false);

  const isPreview = variant === 'preview';
  const report = useReportPostDialog();
  const deleteDialog = useDeletePostDialog(summary.id, {
    redirectTo: isPreview
      ? undefined
      : summary.recruitment
        ? ROUTES.RECRUITMENT()
        : ROUTES.HOME(),
  });
  const { exportMarkdown, isExporting } = useExportPostMarkdown({
    slug: summary.slug,
    postPath,
  });
  const copyLink = useCopyPostLink(postPath);

  const projectHandle = summary.project?.handle;
  const { data: projectData } = useGetProjectByHandle(projectHandle ?? '', {
    query: { enabled: Boolean(projectHandle) },
  });
  const project = projectData?.data;
  const canManageProject =
    project?.role === GetProjectResponseRole.Admin || project?.isOwner;
  const isPinned = Boolean(summary.pinnedAt);
  const togglePin = usePinToggle(summary.id, projectHandle ?? '', isPinned);

  const stopPropagation = isPreview
    ? (event: React.MouseEvent) => event.stopPropagation()
    : undefined;

  return (
    <div className="shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={tViewer('options')}
            onClick={stopPropagation}
          >
            <DotsThreeIcon weight="bold" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" onClick={stopPropagation}>
          <DropdownMenuItem onSelect={copyLink}>
            <LinkSimpleIcon />
            {tCopyLink('trigger')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isExporting} onSelect={exportMarkdown}>
            <DownloadSimpleIcon />
            {tExport('trigger')}
          </DropdownMenuItem>
          {!summary.recruitment && (
            <DropdownMenuItem
              onSelect={() => {
                if (!requireAuth({ intent: 'collection' })) {
                  return;
                }
                setAddToCollectionOpen(true);
              }}
            >
              <StackSimpleIcon />
              {tCollection('add-to-collection.trigger')}
            </DropdownMenuItem>
          )}
          {summary.isAuthor && (
            <DropdownMenuItem
              onSelect={() =>
                router.push(
                  summary.recruitment
                    ? ROUTES.RECRUITMENT_POST_EDIT(summary.slug)
                    : summary.project?.handle
                      ? ROUTES.PROJECT_POST_EDIT(
                          summary.project.handle,
                          summary.slug,
                        )
                      : ROUTES.POST_EDIT(summary.slug),
                )
              }
            >
              <PencilSimpleIcon />
              {tEdit('trigger')}
            </DropdownMenuItem>
          )}
          {canManageProject && (
            <DropdownMenuItem onSelect={togglePin}>
              {isPinned ? <PushPinSlashIcon /> : <PushPinIcon />}
              {isPinned ? tPin('unpin-trigger') : tPin('trigger')}
            </DropdownMenuItem>
          )}
          {summary.canDelete && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => deleteDialog.open()}
            >
              <TrashIcon />
              {tDelete('trigger')}
            </DropdownMenuItem>
          )}
          {!summary.isAuthor &&
            (isPreview ? (
              <DropdownMenuItem variant="destructive">
                <SirenIcon />
                {t('trigger')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => report.open()}
              >
                <SirenIcon />
                {t('trigger')}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div onClick={stopPropagation}>
        <AddToCollectionDialog
          open={addToCollectionOpen}
          onOpenChange={setAddToCollectionOpen}
          postHandle={summary.slug}
          projectHandle={summary.project?.handle}
        />
      </div>

      {!isPreview && (
        <div onClick={stopPropagation}>
          <ReportPostDialog
            postId={summary.id}
            open={report.isOpen}
            onOpenChange={(open) => (open ? report.open() : report.close())}
          />
        </div>
      )}

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) =>
          open ? deleteDialog.open() : deleteDialog.close()
        }
      >
        <AlertDialogContent onClick={stopPropagation}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tDelete('title')}</AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>{tDelete('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteDialog.isPending}
              onClick={deleteDialog.confirmDelete}
            >
              {tDelete('actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
