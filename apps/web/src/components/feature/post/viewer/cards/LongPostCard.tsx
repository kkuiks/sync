import { RecruitmentMeta } from '@/components/feature/recruitment/RecruitmentMeta';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { PostBody } from '../components/PostBody';
import { PostCardActions } from '../components/PostCardActions';
import { PostCardTitle } from '../components/PostCardTitle';
import { PostCoverImage } from '../components/PostCoverImage';
import { PostTags } from '../components/PostTags';
import { PostViewHeader } from '../components/PostViewHeader';
import {
  POST_DETAIL_HEADER,
  POST_DETAIL_PADDING_X,
  POST_DETAIL_SURFACE,
  type PostDetailCardProps,
} from './types';

export function LongPostCard({
  summary,
  editor,
  postPath,
  lockedPreview,
}: PostDetailCardProps) {
  // 커버가 늘 맨 위에 붙으므로 카드 위 여백을 없앤다. `Card` 의
  // `has-[>img:first-child]` 규칙은 생성 커버(div)에는 걸리지 않는다.
  // `POST_DETAIL_SURFACE`가 모바일에서 이미 `pt-0`이므로, sm 이상에서
  // 되살아나는 `sm:pt-6`만 따로 다시 없앤다.
  return (
    <Card className={cn(POST_DETAIL_SURFACE, 'sm:pt-0')}>
      <PostCoverImage url={summary.coverImageUrl} seed={String(summary.id)} />

      {/* 카드가 작성자 줄과 본문을 붙여 놓으므로, 커버 바로 아래에 올 때만
          위 여백을 되살린다. */}
      <CardHeader
        className={cn(POST_DETAIL_PADDING_X, 'pt-6', POST_DETAIL_HEADER)}
      >
        <PostViewHeader
          summary={summary}
          postPath={postPath}
          variant="detail"
        />
      </CardHeader>

      <CardContent className={cn(POST_DETAIL_PADDING_X, 'space-y-6')}>
        <PostCardTitle title={summary.title} variant="detail" />
        <RecruitmentMeta summary={summary} />
        {/* 상세 화면이므로 본문을 자르지 않는다. 잘린 미리보기는 피드 카드
            (`LongPostPreviewCard`)의 역할이다. */}
        <PostBody editor={editor} lockedPreview={lockedPreview} />
        <PostCardActions summary={summary} variant="detail" />
        <PostTags tags={summary.tags} />
      </CardContent>
    </Card>
  );
}
