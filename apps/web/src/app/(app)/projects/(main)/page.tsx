import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth, isAuthenticated } from '@/lib/auth';
import ROUTES from '@/util/routes';

import ProjectsTabs from './_components/ProjectsTabs';

type ProjectsProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function Projects({ searchParams }: ProjectsProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!isAuthenticated(session)) {
    redirect(ROUTES.HOME());
  }

  const { tab } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Workspaces</h1>
      </div>

      <ProjectsTabs initialTab={tab} />
    </div>
  );
}
