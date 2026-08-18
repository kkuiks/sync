import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { ArticlePreviewMedia } from '../components/ArticlePreviewMedia';
import { PostCardActions } from '../components/PostCardActions';
import { PostCardTitle } from '../components/PostCardTitle';
import { PostPreviewBody } from '../components/PostPreviewBody';
import { PostTags } from '../components/PostTags';
import { PostViewHeader } from '../components/PostViewHeader';
import { ReadingTimeBadge } from '../components/ReadingTimeBadge';
import { POST_PREVIEW_SURFACE, type PostPreviewCardTypeProps } from './types';

/**
 * 블로그 글만 카드로 감싼다. 짧은 글·질문은 목록에 이어 붙지만 블로그 글은
 * 커버가 있는 한 덩어리라, 카드 표면이 있어야 읽는 단위가 분명해진다.
 *
 * 커버는 고정 높이로 두고 카드 높이는 내용이 정한다. 카드 높이를 고정하면
 * 아래에 무엇을 더할 때마다 `overflow-hidden` 에 잘려 나가는데, 잘리는 건 늘
 * 맨 끝에 있는 액션 줄이다.
 */
export function LongPostPreviewCard({
  summary,
  postPath,
  onClick,
  fillHeight,
  surface,
}: PostPreviewCardTypeProps) {
  return (
    <Card
      onClick={onClick}
      // `size="sm"` 을 주면 안 된다. `data-[size=sm]:py-4` 가 속성 선택자라
      // 여기 `py-0` 보다 우선순위가 높아 커버 위에 여백이 남는다.
      className={cn(
        POST_PREVIEW_SURFACE.card,
        'gap-0 overflow-hidden py-0',
        // 목록 안에서는 위아래 구분선에 카드가 닿지 않게 띄운다. 이웃한 짧은
        // 글·질문 카드의 안쪽 여백(`py-4`)과 같은 값이라 줄 간격이 고르다.
        surface === 'flat' && 'my-4',
        fillHeight && 'h-full',
      )}
    >
      {/* 비율이 아니라 고정 높이로 잡는다. 비율로 두면 넓은 목록에서는 커버가
          300px 가까이 되고 좁은 격자에서는 절반으로 줄어, 카드 폭에 따라
          커버가 차지하는 몫이 널뛴다. 아래 내용이 대략 200px 이라 폭과 무관하게
          커버가 카드의 절반쯤을 차지한다. */}
      <div className="relative h-48 w-full shrink-0">
        <ArticlePreviewMedia
          seed={String(summary.id)}
          coverImageUrl={summary.coverImageUrl}
        />

        <ReadingTimeBadge
          wordCount={summary.wordCount}
          className="absolute right-3 bottom-3"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* 작성자 줄은 제목 묶음과 한 덩어리로 둔다. 바깥 `gap-2` 에 걸리면
            작성자와 본문 사이만 벌어진다. */}
        <div>
          <PostViewHeader
            summary={summary}
            postPath={postPath}
            variant="preview"
          />

          <div className="space-y-1 mb-2">
            <PostCardTitle
              title={summary.title}
              variant="preview"
              className="line-clamp-2"
            />

            <PostPreviewBody
              preview={summary.preview}
              className="line-clamp-2"
            />

            <PostTags tags={summary.tags} />
          </div>
        </div>

        {/* `mt-auto` 로 액션 줄을 바닥에 붙인다. `fillHeight` 로 카드가 내용보다
            높아져도 한 행의 카드들끼리 액션 줄 높이가 맞는다. */}
        <Separator className="mt-auto" />

        <PostCardActions summary={summary} />
      </div>
    </Card>
  );
}
