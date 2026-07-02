import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { getGetProfileByHandleQueryOptions } from '@/api/__generated__/profile/profile';
import { TwoColumnLayout } from '@/components/layout/TwoColumnLayout';
import { getQueryClient } from '@/lib/query';

import ProfileCard from './_components/ProfileCard';
import ProfileTabs from './_components/ProfileTabs';

interface ProfileProps {
  params: Promise<{
    handle: string;
  }>;
}

export default async function Profile({ params }: ProfileProps) {
  const { handle } = await params;

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(getGetProfileByHandleQueryOptions(handle));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TwoColumnLayout
        main={
          <div className="space-y-4">
            <ProfileCard handle={handle} />
            <ProfileTabs handle={handle} />
          </div>
        }
        side={undefined}
        hideSideOnMobile
      />
    </HydrationBoundary>
  );
}
