'use client';

import { useTranslations } from 'next-intl';

import { TwoColumnFullPageLayout } from '@/components/layout/TwoColumnLayout';

interface AuthLayoutProps {
  children?: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const t = useTranslations('pages.auth.brand');

  return (
    <TwoColumnFullPageLayout
      brandTitle={t('title')}
      brandDescription={t('description')}
    >
      {children}
    </TwoColumnFullPageLayout>
  );
}
