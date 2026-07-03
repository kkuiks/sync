'use client';

import { DotsThreeIcon } from '@phosphor-icons/react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';

import { useGetProjectByHandle } from '@/api/__generated__/project/project';
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
import ROUTES from '@/util/routes';

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
import { PostBody } from './variants/PostBody';

interface PostPreviewProps {
  id: number;
  slug: string;
  type?: PostType;
  scope?: PostScope;
  status?: PostStatus;
  title?: string | null;
  author: GetPostResponse['author'];
  project?: string;
  content: GetPostResponse['content'];
  likeCount: number;
  commentCount: number;
  bookmarked: boolean;
  createdAt: string;
}

export default function PostPreview({
  id,
  slug,
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
}: PostPreviewProps) {
  const editor = useEditor({
    extensions: [StarterKit, ImageNode],
    content: deserialize(content.json, content.media),
    editable: false,
    immediatelyRender: false,
  });

  const { data: projectData } = useGetProjectByHandle(project ?? '', {
    query: {
      enabled: !!project,
    },
  });
  const showActions = isPublicPublishedPost(scope, status);

  const handleClickCard = () => {
    if (projectData?.data) {
      redirect(ROUTES.PROJECT_POST(projectData.data.handle, slug));
    } else {
      redirect(ROUTES.POST(slug));
    }
  };

  return (
    <Card onClick={handleClickCard}>
      <CardHeader>
        <PostPreviewHeader
          type={type}
          scope={scope}
          status={status}
          author={author}
          project={project}
          createdAt={createdAt}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        {title && type !== PostType.SHORT && (
          <h2 className="line-clamp-2 text-xl font-semibold leading-tight">
            {title}
          </h2>
        )}
        <PostBody
          type={type}
          editor={editor}
          className={type === PostType.LONG ? 'line-clamp-6' : undefined}
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

function PostPreviewHeader({
  type,
  scope,
  status,
  author,
  project,
  createdAt,
}: {
  type?: PostType;
  scope?: PostScope;
  status?: PostStatus;
  author: GetPostResponse['author'];
  project?: string;
  createdAt: string;
}) {
  const { data: projectData } = useGetProjectByHandle(project ?? '', {
    query: {
      enabled: !!project,
    },
  });
  const tPost = useTranslations('components.post');

  return (
    <div className="flex items-start justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <ProfileHoverCard
          handle={author.handle}
          name={author.name}
          size="default"
        />

        <div className="flex flex-col">
          <span className="text-sm font-semibold">{author.name}</span>
          <span className="text-muted-foreground text-xs">
            @{author.handle} · <RelativeTime date={createdAt} />
          </span>
        </div>

        {type && <PostTypeBadge type={type} />}

        {status === PostStatus.DRAFT && (
          <Badge variant="outline">{tPost('status.DRAFT')}</Badge>
        )}

        {scope === PostScope.WORKSPACE && (
          <Badge variant="outline">{tPost('scope.WORKSPACE')}</Badge>
        )}

        {projectData?.data && (
          <Badge variant="secondary">{projectData.data.name}</Badge>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Post options">
            <DotsThreeIcon weight="bold" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem>Copy link</DropdownMenuItem>
          <DropdownMenuItem>Report</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
