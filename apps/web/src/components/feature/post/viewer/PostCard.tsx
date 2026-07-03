'use client';

import { DotsThreeIcon, SirenIcon } from '@phosphor-icons/react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { GetPostResponse } from '@/api/__generated__/types';
import { ProfileHoverCard } from '@/components/feature/profile/ProfileHoverCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RelativeTime } from '@/components/ui/relative-time';

import { ImageNode } from '../editor/extensions/nodes/image';
import { deserialize } from '../editor/utils/serializer';
import {
  PostScope,
  PostStatus,
  PostType,
  isPublicPublishedPost,
} from '../types/post';
import { PostCardActions } from './components/PostCardActions';
import { PostTypeBadge } from './components/PostTypeBadge';
import { ReportPostDialog } from './components/ReportPostDialog';
import { PostBody } from './variants/PostBody';

interface PostCardProps {
  id: number;
  type: PostType;
  scope?: PostScope;
  status?: PostStatus;
  title?: string | null;
  author: GetPostResponse['author'];
  project?: GetPostResponse['project'];
  content: GetPostResponse['content'];
  likeCount: number;
  commentCount: number;
  bookmarked: boolean;
  createdAt: string;
}

export default function PostCard({
  id,
  type,
  scope,
  status,
  title,
  author,
  project,
  content,
  likeCount,
  commentCount,
  bookmarked,
  createdAt,
}: PostCardProps) {
  const editor = useEditor({
    extensions: [StarterKit, ImageNode],
    content: deserialize(content.json, content.media),
    editable: false,
    immediatelyRender: false,
  });
  const showActions = isPublicPublishedPost(scope, status);

  return (
    <Card>
      <CardHeader>
        <PostCardHeader
          postId={id}
          type={type}
          scope={scope}
          status={status}
          author={author}
          project={project}
          createdAt={createdAt}
        />
      </CardHeader>

      <CardContent
        className={type === PostType.SHORT ? 'space-y-3' : 'space-y-4'}
      >
        {title && type !== PostType.SHORT && (
          <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
        )}
        <PostBody
          type={type}
          editor={editor}
          className={type === PostType.LONG ? 'line-clamp-4' : undefined}
        />
        {showActions && (
          <PostCardActions
            postId={id}
            likeCount={likeCount}
            commentCount={commentCount}
            bookmarked={bookmarked}
          />
        )}
      </CardContent>
    </Card>
  );
}

function PostCardHeader({
  postId,
  type,
  scope,
  status,
  author,
  project,
  createdAt,
}: {
  postId: number;
  type: PostType;
  scope?: PostScope;
  status?: PostStatus;
  author: GetPostResponse['author'];
  project?: GetPostResponse['project'];
  createdAt: string;
}) {
  const t = useTranslations('pages.posts.report');
  const tPost = useTranslations('components.post');
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <ProfileHoverCard
            handle={author.handle}
            name={author.name}
            size="sm"
          />

          <div className="flex flex-col">
            <span className="text-sm font-semibold">{author.name}</span>
            <span className="text-muted-foreground text-xs">
              @{author.handle} · <RelativeTime date={createdAt} />
            </span>
          </div>

          <PostTypeBadge type={type} />

          {status === PostStatus.DRAFT && (
            <Badge variant="outline">{tPost('status.DRAFT')}</Badge>
          )}

          {scope === PostScope.WORKSPACE && (
            <Badge variant="outline">{tPost('scope.WORKSPACE')}</Badge>
          )}

          {project?.name && <Badge variant="secondary">{project.name}</Badge>}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Post options">
              <DotsThreeIcon weight="bold" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                setReportOpen(true);
              }}
            >
              <SirenIcon />
              {t('trigger')}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ReportPostDialog
        postId={postId}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
}
