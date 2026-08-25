import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getProjectByHandle } from '@/api/__generated__/project/project';
import { TwoColumnLayout } from '@/components/layout/TwoColumnLayout';
import SyncError, { ErrorCode } from '@/lib/error';
import { canonicalMetadata } from '@/lib/seo';
import ROUTES from '@/util/routes';

import ProjectDashboard from './_components/ProjectDashboard';
import ProjectInfoSidebar from './_components/ProjectInfoSidebar';

interface ProjectDashboardPageProps {
  params: Promise<{
    handle: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProjectDashboardPageProps): Promise<Metadata> {
  const { handle } = await params;

  return canonicalMetadata(ROUTES.PROJECT(handle));
}

export default async function ProjectDashboardPage({
  params,
}: ProjectDashboardPageProps) {
  const { handle } = await params;

  try {
    await getProjectByHandle(handle);
  } catch (error) {
    if (error instanceof SyncError) {
      switch (error.code) {
        case ErrorCode.PROJECT_NOT_FOUND:
          notFound();
      }
    }
  }

  return (
    <TwoColumnLayout
      main={<ProjectDashboard handle={handle} />}
      side={<ProjectInfoSidebar handle={handle} />}
      reverseSideOnMobile
      stretchMain
    />
  );
}
