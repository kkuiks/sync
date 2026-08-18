'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { useGetPostBySlug } from '@/api/__generated__/post/post';
import { useUpdateRecruitmentPost } from '@/api/__generated__/recruitment-post/recruitment-post';
import type {
  GetPostResponseContent,
  UpdateRecruitmentPostRequest,
} from '@/api/__generated__/types';
import PostEditor from '@/components/feature/post/editor/PostEditor';
import { invalidatePostQueries } from '@/components/feature/post/hooks/postQueryKeys';
import { PostType } from '@/components/feature/post/types/post';
import {
  type PostSummary,
  toPostSummary,
} from '@/components/feature/post/viewer/types';
import {
  RecruitmentFields,
  toOptionalIsoDateTime,
  toRecruitmentFormValue,
} from '@/components/feature/recruitment/RecruitmentFields';
import type { RecruitmentFormValue } from '@/components/feature/recruitment/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import ROUTES from '@/util/routes';

export default function EditRecruitmentPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const t = useTranslations('pages.recruitment');
  useAuthGuard();

  const { data, isPending, isError } = useGetPostBySlug(slug);
  const post = data?.data;

  if (isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isError || !post) {
    return <EditorUnavailable message={t('messages.edit-unavailable')} />;
  }

  const summary = toPostSummary(post.summary);
  if (!summary.isAuthor || !summary.recruitment) {
    return <EditorUnavailable message={t('messages.edit-forbidden')} />;
  }

  return (
    <RecruitmentEditor
      key={summary.id}
      summary={summary}
      content={post.content}
    />
  );
}

function RecruitmentEditor({
  summary,
  content,
}: {
  summary: PostSummary;
  content?: GetPostResponseContent;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('pages.recruitment');
  const [details, setDetails] = useState<RecruitmentFormValue>(() =>
    toRecruitmentFormValue(summary.recruitment),
  );
  const { mutate: updateRecruitmentPost, isPending } =
    useUpdateRecruitmentPost();

  return (
    <PostEditor
      isEditing
      type={PostType.LONG}
      summary={summary}
      content={content}
      fixedType
      allowDraft={false}
      showSeries={false}
      showTemplates={false}
      scopeLabelOverride={t('editor.scope')}
      backHrefOverride={ROUTES.POST(summary.slug)}
      sidebarContent={
        <RecruitmentFields value={details} onChange={setDetails} />
      }
      isSubmitting={isPending}
      onSubmit={({ title, tags, coverMediaId, removeCover, content }) => {
        updateRecruitmentPost(
          {
            postId: `${summary.id}`,
            data: {
              title,
              tags,
              coverMediaId,
              removeCover,
              recruitmentStatus: summary.recruitment!.status,
              employmentType: details.employmentType,
              workMode: details.workMode,
              location: details.location.trim() || undefined,
              experienceLevel: details.experienceLevel,
              closesAt: toOptionalIsoDateTime(details.closesAt),
              content: {
                json: content.json,
                text: content.text,
                mediaIds: content.media.map((media) => media.id),
              },
            } satisfies UpdateRecruitmentPostRequest,
          },
          {
            onSuccess: async () => {
              await invalidatePostQueries(queryClient);
              toast.success(t('messages.update-success'));
              router.push(ROUTES.POST(summary.slug));
              router.refresh();
            },
            onError: () => toast.error(t('messages.update-error')),
          },
        );
      }}
    />
  );
}

function EditorUnavailable({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-96 max-w-2xl items-center justify-center px-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
