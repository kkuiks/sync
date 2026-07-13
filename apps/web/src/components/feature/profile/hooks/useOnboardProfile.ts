import { useQueryClient } from '@tanstack/react-query';

import {
  getGetAuthenticatedUserQueryKey,
  useOnboardProfile as useOnboardProfileMutation,
} from '@/api/__generated__/profile/profile';
import { useSession } from '@/lib/auth/client';

interface UseOnboardProfileOptions {
  onSuccess?: () => void;
  onError?: () => void;
}

export function useOnboardProfile(options?: UseOnboardProfileOptions) {
  const queryClient = useQueryClient();
  const { refetch: refetchSession } = useSession();

  return useOnboardProfileMutation({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getGetAuthenticatedUserQueryKey(),
        });

        await refetchSession();

        options?.onSuccess?.();
      },
      onError: options?.onError,
    },
  });
}
