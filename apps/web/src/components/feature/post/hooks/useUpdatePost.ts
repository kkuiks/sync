import { useMutation, useQueryClient } from '@tanstack/react-query';

import { type ErrorType, api } from '@/lib/server';

import { PostStatus, PostType } from '../types/post';
import { isPostRelatedQueryKey } from './useDeletePost';

export interface UpdatePostRequest {
  title: string;
  type: PostType;
  status: PostStatus;
  tags: string[];
  content: {
    text: string;
    json: string;
    mediaIds: (number | string)[];
  };
}

interface UpdatePostVariables {
  postId: number | string;
  data: UpdatePostRequest;
}

type UpdatePostResponse = {
  data: undefined;
  status: 204;
  headers: Headers;
};

async function updatePost({ postId, data }: UpdatePostVariables) {
  return api<UpdatePostResponse>(`/posts/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdatePostResponse,
    ErrorType<unknown>,
    UpdatePostVariables
  >({
    mutationFn: updatePost,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) => isPostRelatedQueryKey(query.queryKey),
      });
    },
  });
}
