'use client';

import { WarningCircleIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useGetRecruitmentPostsInfinite } from '@/api/__generated__/recruitment-post/recruitment-post';
import { toPostSummary } from '@/components/feature/post/viewer/types';
import {
  DEFAULT_RECRUITMENT_FILTERS,
  RecruitmentFilters,
  type RecruitmentFiltersValue,
} from '@/components/feature/recruitment/RecruitmentFilters';
import { RecruitmentPostCard } from '@/components/feature/recruitment/RecruitmentPostCard';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

export function RecruitmentFeed() {
  const t = useTranslations('pages.recruitment');
  const [filters, setFilters] = useState<RecruitmentFiltersValue>(
    DEFAULT_RECRUITMENT_FILTERS,
  );
  const params = {
    first: '20',
    status: filters.status === 'ALL' ? undefined : filters.status,
    employmentType:
      filters.employmentType === 'ALL' ? undefined : filters.employmentType,
    workMode: filters.workMode === 'ALL' ? undefined : filters.workMode,
    experienceLevel:
      filters.experienceLevel === 'ALL' ? undefined : filters.experienceLevel,
    location: filters.location.trim() || undefined,
    tag: filters.tag.trim() || undefined,
    query: filters.query.trim() || undefined,
  };
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isPending,
    isFetchingNextPage,
    refetch,
  } = useGetRecruitmentPostsInfinite(params, {
    query: {
      getNextPageParam: (lastPage) => {
        const pageInfo = lastPage.data.posts?.pageInfo;
        return pageInfo?.hasNextPage
          ? (pageInfo.endCursor ?? undefined)
          : undefined;
      },
    },
  });

  const posts =
    data?.pages.flatMap((page) => page.data.posts?.nodes ?? []) ?? [];

  return (
    <div className="space-y-6">
      <RecruitmentFilters value={filters} onChange={setFilters} />

      {isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Empty className="min-h-80">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WarningCircleIcon />
            </EmptyMedia>
            <EmptyTitle>{t('error.title')}</EmptyTitle>
            <EmptyDescription>{t('error.description')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              {t('error.retry')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : posts.length === 0 ? (
        <Empty className="min-h-80">
          <EmptyHeader>
            <EmptyTitle>{t('empty.title')}</EmptyTitle>
            <EmptyDescription>{t('empty.description')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const summary = toPostSummary(post.content);
            return <RecruitmentPostCard key={summary.id} summary={summary} />;
          })}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                isPending={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {t('load-more')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
