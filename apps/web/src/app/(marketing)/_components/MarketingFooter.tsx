import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { Copyright } from '@/components/ui/copyright';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import ROUTES from '@/util/routes';

import { MONO } from './primitives';

export default async function MarketingFooter() {
  const t = await getTranslations('pages.about.footer');

  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-[260px] text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <FooterColumn title={t('legal.title')}>
          <FooterLink href={ROUTES.TERMS()}>{t('legal.terms')}</FooterLink>
          <FooterLink href={ROUTES.PRIVACY()}>{t('legal.privacy')}</FooterLink>
          <FooterLink href={ROUTES.COOKIES()}>{t('legal.cookies')}</FooterLink>
        </FooterColumn>

        <FooterColumn title={t('account.title')}>
          <FooterLink href={ROUTES.REGISTER()}>
            {t('account.register')}
          </FooterLink>
          <FooterLink href={ROUTES.LOGIN()}>{t('account.login')}</FooterLink>
        </FooterColumn>
      </div>
      <div className="mx-auto w-full max-w-6xl border-t border-border px-6 py-6">
        <Copyright />
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4
        className={cn(MONO, 'mb-3 text-[11px] uppercase text-muted-foreground')}
      >
        {title}
      </h4>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {children}
      </ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link href={href} className="hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}
