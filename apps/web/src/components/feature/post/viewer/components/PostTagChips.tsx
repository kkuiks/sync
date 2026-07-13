import { TagBadge } from '@/components/feature/tag/TagBadge';

import type { PostTagSummary } from '../types';

export function PostTagChips({ tags }: { tags: PostTagSummary[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          isProjectTag={!!tag.projectHandle}
          variant="secondary"
        />
      ))}
    </div>
  );
}
