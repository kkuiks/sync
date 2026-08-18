'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { useCreateRecruitmentPost } from '@/api/__generated__/recruitment-post/recruitment-post';
import type { CreateRecruitmentPostRequest } from '@/api/__generated__/types';
import PostEditor from '@/components/feature/post/editor/PostEditor';
import { PostType } from '@/components/feature/post/types/post';
import {
  RecruitmentFields,
  toOptionalIsoDateTime,
} from '@/components/feature/recruitment/RecruitmentFields';
import {
  DEFAULT_RECRUITMENT_FORM_VALUE,
  type RecruitmentFormValue,
} from '@/components/feature/recruitment/types';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import ROUTES from '@/util/routes';

export default function NewRecruitmentPostPage() {
  const router = useRouter();
  const t = useTranslations('pages.recruitment');
  useAuthGuard();

  const [details, setDetails] = useState<RecruitmentFormValue>(
    DEFAULT_RECRUITMENT_FORM_VALUE,
  );
  const { mutate: createRecruitmentPost, isPending } =
    useCreateRecruitmentPost();

  return (
    <PostEditor
      type={PostType.LONG}
      fixedType
      allowDraft={false}
      showSeries={false}
      showTemplates={false}
      scopeLabelOverride={t('editor.scope')}
      sidebarContent={
        <RecruitmentFields value={details} onChange={setDetails} />
      }
      isSubmitting={isPending}
      onSubmit={({ title, tags, coverMediaId, content }) => {
        createRecruitmentPost(
          {
            data: {
              title,
              tags,
              coverMediaId,
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
            } satisfies CreateRecruitmentPostRequest,
          },
          {
            onSuccess: ({ data }) => router.push(ROUTES.POST(data.slug)),
            onError: () => toast.error(t('messages.create-error')),
          },
        );
      }}
    />
  );
}
