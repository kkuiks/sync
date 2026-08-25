import { getTranslations } from 'next-intl/server';

import FaqAccordion, { type FaqItem } from './FaqAccordion';

const FAQ_KEYS = ['solo', 'migration', 'private'] as const;

/** 4. FAQ — 가입을 막는 의심을 걷어낸다. */
export default async function FaqSection() {
  const t = await getTranslations('pages.about.faq');

  const items: FaqItem[] = FAQ_KEYS.map((key) => ({
    id: key,
    question: t(`items.${key}.q`),
    answer: t(`items.${key}.a`),
  }));

  return (
    <section id="faq" className="scroll-mt-20 border-t border-border py-20">
      <FaqAccordion heading={t('heading')} items={items} />
    </section>
  );
}
