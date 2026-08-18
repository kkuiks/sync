'use client';

import {
  ClockIcon,
  MapPinIcon,
  SuitcaseSimpleIcon,
} from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useUpdateRecruitmentStatus } from '@/api/__generated__/recruitment-post/recruitment-post';
import { invalidatePostQueries } from '@/components/feature/post/hooks/postQueryKeys';
import type { PostSummary } from '@/components/feature/post/viewer/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { RecruitmentStatus } from './types';

export function RecruitmentMeta({ summary }: { summary: PostSummary }) {
  const details = summary.recruitment;
  const t = useTranslations('pages.recruitment');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { mutate: updateStatus, isPending } = useUpdateRecruitmentStatus();

  if (!details) {
    return null;
  }

  const nextStatus =
    details.status === RecruitmentStatus.OPEN
      ? RecruitmentStatus.CLOSED
      : RecruitmentStatus.OPEN;
  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge
          color={
            details.status === RecruitmentStatus.OPEN ? 'success' : 'default'
          }
        >
          {t(`statuses.${details.status}`)}
        </Badge>
        {summary.isAuthor ? (
          <Button
            size="sm"
            variant="outline"
            isPending={isPending}
            onClick={() =>
              updateStatus(
                {
                  postId: `${summary.id}`,
                  data: { status: nextStatus },
                },
                {
                  onSuccess: async () => {
                    await invalidatePostQueries(queryClient);
                    toast.success(
                      nextStatus === RecruitmentStatus.OPEN
                        ? t('messages.status-open')
                        : t('messages.status-closed'),
                    );
                  },
                  onError: () => toast.error(t('messages.status-error')),
                },
              )
            }
          >
            {details.status === RecruitmentStatus.OPEN
              ? t('actions.close')
              : t('actions.reopen')}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <SuitcaseSimpleIcon />
          {t(`employment-types.${details.employmentType}`)} ·{' '}
          {t(`experience-levels.${details.experienceLevel}`)}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPinIcon />
          {details.location
            ? t('card.work-location', {
                mode: t(`work-modes.${details.workMode}`),
                location: details.location,
              })
            : t(`work-modes.${details.workMode}`)}
        </span>
        {details.closesAt && (
          <span className="flex items-center gap-1.5">
            <ClockIcon />
            {t('card.closes-at', {
              date: new Intl.DateTimeFormat(locale, {
                dateStyle: 'medium',
              }).format(new Date(details.closesAt)),
            })}
          </span>
        )}
      </div>
    </div>
  );
}
