'use client';

import { useParams } from 'next/navigation';

import PostEditPage from '@/components/feature/post/editor/PostEditPage';

export default function EditProjectPostPage() {
  const { handle, slug } = useParams<{ handle: string; slug: string }>();

  return <PostEditPage slug={slug} projectHandle={handle} />;
}
