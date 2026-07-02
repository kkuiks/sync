import { useTranslations } from 'next-intl';

import { SeparatorWithText } from '@/components/ui/separator';

import AuthTermsNotice from '../_components/AuthTermsNotice';
import OAuthProviders from '../_components/OAuthProviders';
import RegisterForm from './_components/RegisterForm';

export default function Register() {
  const t = useTranslations('pages.register');
  const tAuth = useTranslations('pages.auth');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-light mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="flex flex-col gap-6">
        <RegisterForm />

        <SeparatorWithText>{tAuth('or')}</SeparatorWithText>

        <OAuthProviders />

        <AuthTermsNotice />
      </div>
    </div>
  );
}
