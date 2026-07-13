import { getTranslations } from 'next-intl/server';

import { requireOnboardedSession } from '@/lib/auth/guards';

import ExploreTags from './_components/ExploreTags';

export default async function ExploreTagsPage() {
  await requireOnboardedSession();

  const t = await getTranslations('pages.explore.tags');

  return (
    <div className="mx-auto space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>

      <ExploreTags />
    </div>
  );
}
