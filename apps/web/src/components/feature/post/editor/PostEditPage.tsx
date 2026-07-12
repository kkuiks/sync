'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { useGetPostBySlug } from '@/api/__generated__/post/post';
import { PostDeleteButton } from '@/components/feature/post/viewer/components/PostDeleteButton';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import ROUTES from '@/util/routes';

import { useUpdatePost } from '../hooks/useUpdatePost';
import { PostScope, PostStatus, PostType } from '../types/post';
import PostEditor from './PostEditor';

interface PostEditPageProps {
  slug: string;
  projectHandle?: string;
}

export default function PostEditPage({
  slug,
  projectHandle,
}: PostEditPageProps) {
  const router = useRouter();
  const t = useTranslations('components.editor');
  useAuthGuard();

  const { data, isPending, isError } = useGetPostBySlug(slug);
  const { mutate: updatePost, isPending: isUpdating } = useUpdatePost();

  const post = data?.data;
  const summary = post?.summary;
  const content = post?.content;
  const actualProjectHandle = summary?.project?.handle;

  useEffect(() => {
    if (!summary) {
      return;
    }

    const canonicalPath = actualProjectHandle
      ? ROUTES.PROJECT_POST_EDIT(actualProjectHandle, slug)
      : ROUTES.POST_EDIT(slug);
    const isCanonical = actualProjectHandle
      ? projectHandle === actualProjectHandle
      : projectHandle === undefined;

    if (!isCanonical) {
      router.replace(canonicalPath);
    }
  }, [actualProjectHandle, projectHandle, router, slug, summary]);

  if (isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isError || !post || !summary || !content) {
    return (
      <div className="mx-auto flex min-h-96 max-w-2xl items-center justify-center px-6 text-sm text-muted-foreground">
        {t('messages.edit-unavailable')}
      </div>
    );
  }

  if (!summary.isAuthor) {
    return (
      <div className="mx-auto flex min-h-96 max-w-2xl items-center justify-center px-6 text-sm text-muted-foreground">
        {t('messages.edit-forbidden')}
      </div>
    );
  }

  const scope =
    summary.scope === PostScope.WORKSPACE
      ? PostScope.WORKSPACE
      : PostScope.PUBLIC;
  const status = summary.status as PostStatus;
  const tags = content.tags.filter(
    (tag): tag is string => typeof tag === 'string',
  );
  const detailPath = summary.project?.handle
    ? ROUTES.PROJECT_POST(summary.project.handle, summary.slug)
    : ROUTES.POST(summary.slug);
  const editorProject =
    summary.project?.handle && summary.project.name
      ? { handle: summary.project.handle, name: summary.project.name }
      : undefined;

  return (
    <PostEditor
      key={summary.id}
      isEditing
      type={summary.type as PostType}
      initialTitle={summary.title}
      initialStatus={status}
      initialScope={scope}
      initialTags={tags}
      initialContentJson={content.json}
      initialMedia={content.media}
      deleteAction={
        status === PostStatus.DRAFT ? (
          <PostDeleteButton
            postId={summary.id}
            redirectTo={ROUTES.DRAFTS()}
            className="w-full"
          />
        ) : undefined
      }
      isSubmitting={isUpdating}
      project={editorProject}
      onSubmit={({ title, type, status, tags, content }) => {
        updatePost(
          {
            postId: summary.id,
            data: {
              title,
              type,
              status,
              tags,
              content: {
                json: content.json,
                text: content.text,
                mediaIds: content.media.map((media) => media.id),
              },
            },
          },
          {
            onSuccess: () => {
              toast.success(t('messages.update-success'));
              if (status === PostStatus.PUBLISHED) {
                router.push(detailPath);
                router.refresh();
              }
            },
            onError: () => {
              toast.error(t('messages.update-error'));
            },
          },
        );
      }}
    />
  );
}
