import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LinkButton } from '@/components/ui/button';
import { requireOnboardedSession } from '@/lib/auth/guards';
import ROUTES from '@/util/routes';

import { RecruitmentFeed } from './_components/RecruitmentFeed';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.recruitment');
  return { title: t('title'), description: t('description') };
}

export default async function RecruitmentPage() {
  await requireOnboardedSession();
  const t = await getTranslations('pages.recruitment');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <LinkButton href={ROUTES.NEW_RECRUITMENT_POST()}>
          {t('write')}
        </LinkButton>
      </div>

      <RecruitmentFeed />
    </div>
  );
}
