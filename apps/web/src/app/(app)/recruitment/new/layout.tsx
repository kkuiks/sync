import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages.recruitment.new');
  return { title: t('title') };
}

export default function NewRecruitmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
