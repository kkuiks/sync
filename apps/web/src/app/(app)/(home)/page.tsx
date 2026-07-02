import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth, isAuthenticated, isOnboarded } from '@/lib/auth';
import ROUTES from '@/util/routes';

import Posts from './_components/Posts';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!isAuthenticated(session)) {
    redirect(ROUTES.ABOUT());
  }

  if (!isOnboarded(session)) {
    redirect(ROUTES.ONBOARDING());
  }

  return (
    <div>
      <Posts />
    </div>
  );
}
