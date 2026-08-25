import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { canonicalMetadata } from '@/lib/seo';
import ROUTES from '@/util/routes';

import MarketingFooter from '../_components/MarketingFooter';
import MarketingNav from '../_components/MarketingNav';
import PricingSection from './_components/PricingSection';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.pricing');

  return {
    title: t('metaTitle'),
    ...canonicalMetadata(ROUTES.PRICING()),
  };
}

export default function Pricing() {
  return (
    <div className="light flex min-h-screen w-full flex-col bg-background text-foreground">
      <MarketingNav hasHero={false} />

      <main className="flex-1 pt-16">
        <PricingSection />
      </main>

      <MarketingFooter />
    </div>
  );
}
