'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { getOAuth2AuthorizationUrl } from '@/features/user/util/oauth2';
import { OAuth2Provider } from '@/types/profile';

const providers: {
  id: OAuth2Provider;
  icon: React.ReactNode;
}[] = [
  {
    id: 'GOOGLE',
    icon: (
      <Image
        src="/assets/icons/google_logo.svg"
        alt="Google"
        width={18}
        height={18}
      />
    ),
  },
];

export default function OAuthProviders() {
  const t = useTranslations('components.oauth');
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 w-full">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={() => {
            router.push(getOAuth2AuthorizationUrl(provider.id));
          }}
        >
          {provider.icon}
          {t(provider.id)}
        </Button>
      ))}
    </div>
  );
}
