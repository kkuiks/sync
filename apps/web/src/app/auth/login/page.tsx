import { useTranslations } from 'next-intl';

import { SeparatorWithText } from '@/components/ui/separator';

import AuthTermsNotice from '../_components/AuthTermsNotice';
import OAuthProviders from '../_components/OAuthProviders';
import LoginForm from './_components/LoginForm';

export default function Login() {
  const t = useTranslations('pages.login');
  const tAuth = useTranslations('pages.auth');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-light mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="flex flex-col gap-6">
        <LoginForm />

        <SeparatorWithText>{tAuth('or')}</SeparatorWithText>

        <OAuthProviders />

        <AuthTermsNotice />
      </div>
    </div>
  );
}
