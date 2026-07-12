import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';

import type { GetPostsResponse } from '@/api/__generated__/types';
import { type ErrorType, api } from '@/lib/server';

import { PostScope, PostType } from '../types/post';

export interface DraftPostsParams {
  first?: number;
  type?: PostType;
  scope?: PostScope;
}

interface DraftPostsRequestParams extends DraftPostsParams {
  after?: string;
}

export type DraftPostsResponse = GetPostsResponse;

function getDraftPostsUrl(params?: DraftPostsRequestParams) {
  const normalizedParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, String(value));
    }
  });

  const query = normalizedParams.toString();
  return query ? `/posts/drafts?${query}` : '/posts/drafts';
}

export const getDraftPostsQueryKey = (params?: DraftPostsParams) =>
  ['/posts/drafts', ...(params ? [params] : [])] as const;

async function getDraftPosts(params?: DraftPostsRequestParams) {
  return api<{ data: DraftPostsResponse; status: 200; headers: Headers }>(
    getDraftPostsUrl(params),
    {
      method: 'GET',
    },
  );
}

type DraftPostsPage = Awaited<ReturnType<typeof getDraftPosts>>;

export function useDraftPosts(params?: DraftPostsParams) {
  return useInfiniteQuery<
    DraftPostsPage,
    ErrorType<unknown>,
    InfiniteData<DraftPostsPage>,
    ReturnType<typeof getDraftPostsQueryKey>,
    string | undefined
  >({
    queryKey: getDraftPostsQueryKey(params),
    queryFn: ({ pageParam }) =>
      getDraftPosts({ ...(params ?? {}), after: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      const pageInfo = lastPage.data.posts?.pageInfo;
      return pageInfo?.hasNextPage
        ? (pageInfo.endCursor ?? undefined)
        : undefined;
    },
  });
}
