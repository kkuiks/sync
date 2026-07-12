'use client';

import { useParams } from 'next/navigation';

import PostEditPage from '@/components/feature/post/editor/PostEditPage';

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>();

  return <PostEditPage slug={slug} />;
}
