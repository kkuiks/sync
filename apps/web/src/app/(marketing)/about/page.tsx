import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { canonicalMetadata } from '@/lib/seo';
import ROUTES from '@/util/routes';

import MarketingFooter from '../_components/MarketingFooter';
import MarketingNav from '../_components/MarketingNav';
import FaqSection from './_components/FaqSection';
import FeaturesSection from './_components/FeaturesSection';
import FinalCtaSection from './_components/FinalCtaSection';
import HeroSection from './_components/HeroSection';
import ProblemSolutionSection from './_components/ProblemSolutionSection';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.about');

  return {
    title: t('metaTitle'),
    ...canonicalMetadata(ROUTES.ABOUT()),
  };
}

export default function About() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <MarketingNav />

      <main className="flex-1">
        <HeroSection />

        <div className="light bg-background text-foreground">
          <ProblemSolutionSection />
          <FeaturesSection />
          <FaqSection />
          <FinalCtaSection />
        </div>
      </main>

      <div className="light bg-background text-foreground">
        <MarketingFooter />
      </div>
    </div>
  );
}
