import { InfoIcon } from '@phosphor-icons/react/ssr';
import { getTranslations } from 'next-intl/server';

import { Button, LinkButton } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ROUTES from '@/util/routes';

import { CheckIcon } from '../../_components/primitives';

const FREE_FEATURE_KEYS = [
  'publicUnlimited',
  'privateFree',
  'unlimitedPosts',
] as const;

const TEAM_FEATURE_KEYS = ['invisible', 'inviteOnly', 'cancelAnytime'] as const;

const ENTERPRISE_FEATURE_KEYS = ['comingSoon'] as const;

function FeatureItem({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <li className="flex items-start justify-between gap-2 text-sm text-foreground">
      <span className="flex items-start gap-2">
        <CheckIcon className="mt-1 shrink-0 text-primary" />
        {label}
      </span>
      <Tooltip>
        <TooltipTrigger
          aria-label={tooltip}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <InfoIcon className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </li>
  );
}

/** 가격 안내 — Free / Team / Enterprise 3단 비교 카드. */
export default async function PricingSection() {
  const t = await getTranslations('pages.pricing');

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">
          {t('heading')}
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">{t('sub')}</p>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 items-start gap-6 sm:grid-cols-3">
        {/* Free */}
        <div className="flex h-full flex-col rounded-2xl border border-border p-6">
          <p className="text-lg font-semibold">{t('plans.free.name')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('plans.free.description')}
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">
              {t('plans.free.priceLabel')}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('plans.free.priceCaption')}
          </p>

          <LinkButton
            variant="outline"
            size="lg"
            href={ROUTES.REGISTER()}
            className="mt-6 w-full"
          >
            {t('plans.free.action')}
          </LinkButton>

          <ul className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
            {FREE_FEATURE_KEYS.map((key) => (
              <FeatureItem
                key={key}
                label={t(`features.free.${key}.label`)}
                tooltip={t(`features.free.${key}.tooltip`)}
              />
            ))}
          </ul>
        </div>

        {/* Team — highlighted */}
        <div className="relative flex h-full flex-col rounded-2xl border-2 border-primary bg-primary/5 p-6">
          <span className="absolute inset-x-0 top-0 flex -translate-y-1/2 justify-center">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              {t('plans.team.badge')}
            </span>
          </span>

          <p className="text-lg font-semibold">{t('plans.team.name')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('plans.team.description')}
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">
              {t('plans.team.priceLabel')}
            </span>
            <span className="text-sm text-muted-foreground">
              {t('plans.team.priceUnit')}
            </span>
          </div>
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {t('plans.team.priceCaption')}
          </span>

          <LinkButton
            size="lg"
            href={ROUTES.REGISTER()}
            className="mt-6 w-full"
          >
            {t('plans.team.action')}
          </LinkButton>

          <div className="mt-6 flex flex-col gap-3 border-t border-primary/20 pt-6">
            <p className="text-sm font-medium">{t('plans.team.inherit')}</p>
            <ul className="flex flex-col gap-3">
              {TEAM_FEATURE_KEYS.map((key) => (
                <FeatureItem
                  key={key}
                  label={t(`features.team.${key}.label`)}
                  tooltip={t(`features.team.${key}.tooltip`)}
                />
              ))}
            </ul>
          </div>
        </div>

        {/* Enterprise — grayed out, in development */}
        <div className="flex h-full flex-col rounded-2xl border border-dashed border-border bg-muted/30 p-6 opacity-80">
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">
              {t('plans.enterprise.name')}
            </p>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {t('plans.enterprise.badge')}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('plans.enterprise.description')}
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-lg font-medium text-muted-foreground">
              {t('plans.enterprise.priceLabel')}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('plans.enterprise.note')}
          </p>

          <Button variant="outline" size="lg" disabled className="mt-6 w-full">
            {t('plans.enterprise.action')}
          </Button>

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t('plans.enterprise.inherit')}
            </p>
            <ul className="flex flex-col gap-3">
              {ENTERPRISE_FEATURE_KEYS.map((key) => (
                <FeatureItem
                  key={key}
                  label={t(`features.enterprise.${key}.label`)}
                  tooltip={t(`features.enterprise.${key}.tooltip`)}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted-foreground">
        {t('note')}
      </p>
    </section>
  );
}
