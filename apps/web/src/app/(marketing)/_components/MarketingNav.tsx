'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import * as React from 'react';

import { LinkButton } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import ROUTES from '@/util/routes';

const NAV_LINKS = [
  { key: 'features', href: `${ROUTES.ABOUT()}#features` },
  { key: 'pricing', href: ROUTES.PRICING() },
  { key: 'faq', href: `${ROUTES.ABOUT()}#faq` },
] as const;

/**
 * 랜딩 상단 내비게이션.
 *
 * 전체 화면 다크 히어로가 있는 페이지(`hasHero`)에서는 히어로가 보이는 동안
 * 배경 없이 다크 모드로 두고, 히어로를 완전히 지나야 밝은 바로 전환된다.
 * 스크롤량(예: 8px)이 아니라 히어로 노출 여부로 판단해야 히어로가 화면
 * 대부분을 채운 상태에서 너무 일찍 밝은 배경이 겹쳐 보이는 것을 막을 수 있다.
 * 히어로가 없는 페이지에서는 처음부터 밝은 바 상태로 고정한다.
 */
export default function MarketingNav({
  hasHero = true,
}: {
  hasHero?: boolean;
}) {
  const t = useTranslations('pages.about.nav');
  const [isScrolled, setIsScrolled] = React.useState(!hasHero);

  React.useEffect(() => {
    if (!hasHero) return;

    const hero = document.getElementById('landing-hero');
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setIsScrolled(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(hero);

    return () => observer.disconnect();
  }, [hasHero]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300',
        isScrolled
          ? 'light border-border/70 bg-background/80 text-foreground backdrop-blur'
          : 'dark border-transparent bg-transparent text-foreground',
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Logo />

          <nav
            className={cn(
              'hidden items-center gap-6 text-base md:flex',
              isScrolled ? 'text-muted-foreground' : 'text-foreground/80',
            )}
          >
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className="transition-colors hover:text-foreground"
              >
                {t(`links.${key}`)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LinkButton
            variant="ghost"
            href={ROUTES.LOGIN()}
            className={cn(
              !isScrolled &&
                'text-foreground/80 hover:bg-foreground/10 hover:text-foreground',
            )}
          >
            {t('login')}
          </LinkButton>
          <LinkButton
            href={ROUTES.REGISTER()}
            className={cn(
              !isScrolled &&
                'bg-foreground text-background hover:bg-foreground/85',
            )}
          >
            {t('register')}
          </LinkButton>
        </div>
      </div>
    </header>
  );
}
