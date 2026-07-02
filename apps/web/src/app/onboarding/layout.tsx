import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { TwoColumnFullPageLayout } from '@/components/layout/TwoColumnLayout';
import { auth, isAuthenticated, isOnboarded } from '@/lib/auth';
import ROUTES from '@/util/routes';

interface OnboardingLayoutProps {
  children?: React.ReactNode;
}

export default async function OnboardingLayout({
  children,
}: OnboardingLayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!isAuthenticated(session)) {
    redirect(ROUTES.ABOUT());
  }

  if (isOnboarded(session)) {
    redirect(ROUTES.HOME());
  }

  const t = await getTranslations('pages.onboarding.brand');

  return (
    <TwoColumnFullPageLayout
      brandTitle={t('title')}
      brandDescription={t('description')}
    >
      {children}
    </TwoColumnFullPageLayout>
  );
}
