'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  getGetAllTagsQueryKey,
  useGetAllTags,
} from '@/api/__generated__/tag/tag';
import { TagList, TagListItem } from '@/components/feature/tag/TagList';
import { useFollowTag } from '@/components/feature/tag/hooks/useFollowTag';
import { useUnfollowTag } from '@/components/feature/tag/hooks/useUnfollowTag';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/client';

const PAGE_SIZE = '20';

export default function ExploreTags() {
  const t = useTranslations('pages.explore.tags');

  const { data: session } = useSession();
  const handle = session?.user.handle ?? '';

  const [page, setPage] = useState(0);
  const { data, isPending, isError } = useGetAllTags({
    page: String(page),
    size: PAGE_SIZE,
  });

  const queryClient = useQueryClient();
  const invalidateTags = () =>
    queryClient.invalidateQueries({ queryKey: getGetAllTagsQueryKey() });

  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const setPending = (tagId: number, value: boolean) => {
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

  const { mutate: followTag } = useFollowTag({
    handle,
    onSettled: invalidateTags,
  });
  const { mutate: unfollowTag } = useUnfollowTag({
    handle,
    onSettled: invalidateTags,
  });

  const toggleFollow = (tagId: number, isFollowing: boolean) => {
    setPending(tagId, true);

    const onSettled = () => setPending(tagId, false);

    if (isFollowing) {
      unfollowTag({ tagId: String(tagId) }, { onSettled });
    } else {
      followTag({ tagId: String(tagId) }, { onSettled });
    }
  };

  const tags = data?.data.tags?.content ?? [];
  const pageInfo = data?.data.tags?.pageInfo;

  return (
    <section>
      <TagList
        tags={tags}
        getKey={(tag) => tag.id}
        isPending={isPending}
        isError={isError}
        emptyMessage={t('list.empty')}
        errorMessage={t('list.error')}
        pageInfo={pageInfo}
        onPreviousPage={() => setPage((prev) => prev - 1)}
        onNextPage={() => setPage((prev) => prev + 1)}
        renderItem={(tag) => (
          <TagListItem
            name={tag.name}
            description={tag.description}
            noDescriptionLabel={t('no-description')}
            postCountLabel={t('post-count', { count: tag.postCount })}
            trailing={
              <Button
                variant={tag.isFollowing ? 'outline' : 'default'}
                size="sm"
                className="shrink-0"
                isPending={pendingIds.has(tag.id)}
                onClick={() => toggleFollow(tag.id, tag.isFollowing)}
              >
                {tag.isFollowing ? t('unfollow') : t('follow')}
              </Button>
            }
          />
        )}
      />
    </section>
  );
}
