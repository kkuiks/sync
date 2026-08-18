'use client';

import {
  ClockIcon,
  MapPinIcon,
  SuitcaseSimpleIcon,
} from '@phosphor-icons/react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { PostCardActions } from '@/components/feature/post/viewer/components/PostCardActions';
import { PostCardTitle } from '@/components/feature/post/viewer/components/PostCardTitle';
import { PostHeaderIdentity } from '@/components/feature/post/viewer/components/PostHeaderIdentity';
import { PostPreviewBody } from '@/components/feature/post/viewer/components/PostPreviewBody';
import { PostTags } from '@/components/feature/post/viewer/components/PostTags';
import type { PostSummary } from '@/components/feature/post/viewer/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ROUTES from '@/util/routes';

export function RecruitmentPostCard({ summary }: { summary: PostSummary }) {
  const t = useTranslations('pages.recruitment');
  const locale = useLocale();
  const router = useRouter();
  const details = summary.recruitment;

  if (!details) {
    return null;
  }

  return (
    <Card
      className="cursor-pointer gap-4 p-5 transition-colors hover:bg-muted/30"
      onClick={() => router.push(ROUTES.POST(summary.slug))}
    >
      <div className="flex items-start justify-between gap-4">
        <PostHeaderIdentity summary={summary} isPreview />
        <Badge color={details.status === 'OPEN' ? 'success' : 'default'}>
          {t(`statuses.${details.status}`)}
        </Badge>
      </div>

      <div className="space-y-2">
        <PostCardTitle
          title={summary.title}
          variant="preview"
          className="line-clamp-2"
        />
        <PostPreviewBody preview={summary.preview} className="line-clamp-2" />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
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

      <PostTags tags={summary.tags} />
      <Separator />
      <div onClick={(event) => event.stopPropagation()}>
        <PostCardActions summary={summary} />
      </div>
    </Card>
  );
}
