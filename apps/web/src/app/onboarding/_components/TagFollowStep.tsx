'use client';

import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { useGetFollowedTags } from '@/api/__generated__/tag/tag';
import { useFollowTag } from '@/components/feature/tag/hooks/useFollowTag';
import { useTagSearch } from '@/components/feature/tag/hooks/useTagSearch';
import { useUnfollowTag } from '@/components/feature/tag/hooks/useUnfollowTag';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth/client';

import { OnboardingStepContentProps, OnboardingStepContentRef } from '../page';

export const TagFollowStep = forwardRef<
  OnboardingStepContentRef,
  OnboardingStepContentProps
>(({ onStateChange }, ref) => {
  const t = useTranslations('pages.onboarding.steps.tags');

  const { data: session } = useSession();
  const handle = session?.user.handle ?? '';

  // TODO: 태그 "추천" 전용 엔드포인트가 추가되면 여기서 추천 태그 목록을 불러와
  // 검색 이전에도 팔로우할 태그를 노출해야 한다. 지금은 별도 추천 API가 없어
  // 검색으로만 태그를 찾을 수 있다.

  const {
    query,
    setQuery,
    debouncedQuery,
    tags: searchedTags,
    isPending: isSearchTagsPending,
  } = useTagSearch();

  const { data: followedTagsData } = useGetFollowedTags(handle, {
    query: { enabled: !!handle },
  });

  const followedTags = followedTagsData?.data.tags ?? [];
  const followedIds = followedTags.map((tag) => String(tag.id));

  const { mutate: followTag } = useFollowTag({ handle });
  const { mutate: unfollowTag } = useUnfollowTag({ handle });

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    submit: (onSuccess) => onSuccess(),
  }));

  useEffect(() => {
    onStateChange({ isPending: false, isValid: true });
  }, [onStateChange]);

  const setPending = (tagId: string, value: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (value) {
        next.add(tagId);
      } else {
        next.delete(tagId);
      }
      return next;
    });
  };

  const toggleFollow = (tagId: string) => {
    setPending(tagId, true);

    const onSettled = () => setPending(tagId, false);

    if (followedIds.includes(tagId)) {
      unfollowTag({ tagId }, { onSettled });
      return;
    }

    followTag({ tagId }, { onSettled });
  };

  const searchResults = searchedTags.filter(
    (tag) => !followedIds.includes(String(tag.id)),
  );

  return (
    <div className="flex flex-col gap-4">
      {followedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {followedTags.map((tag) => (
            <Button
              key={tag.id}
              type="button"
              size="sm"
              variant="default"
              isPending={pendingIds.has(String(tag.id))}
              onClick={() => toggleFollow(String(tag.id))}
            >
              {tag.name}
            </Button>
          ))}
        </div>
      )}

      <InputGroup>
        <InputGroupAddon>
          <MagnifyingGlassIcon size={18} />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('search.placeholder')}
        />
      </InputGroup>

      {debouncedQuery.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {isSearchTagsPending ? (
            <TagFollowStepSkeleton />
          ) : searchResults.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center w-full">
              {t('search.empty')}
            </p>
          ) : (
            searchResults.map((tag) => (
              <Button
                key={tag.id}
                type="button"
                size="sm"
                variant="outline"
                isPending={pendingIds.has(String(tag.id))}
                onClick={() => toggleFollow(String(tag.id))}
              >
                {tag.name}
              </Button>
            ))
          )}
        </div>
      )}
    </div>
  );
});
TagFollowStep.displayName = 'TagFollowStep';

function TagFollowStepSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-20 rounded-full" />
      ))}
    </>
  );
}
