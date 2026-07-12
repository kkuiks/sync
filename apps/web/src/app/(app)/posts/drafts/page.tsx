'use client';

import {
  FileTextIcon,
  FolderIcon,
  NotePencilIcon,
} from '@phosphor-icons/react';
import { useIntersectionObserver } from '@uidotdev/usehooks';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { GetPostsResponsePostsNodesItem } from '@/api/__generated__/types';
import { useDraftPosts } from '@/components/feature/post/hooks/useDraftPosts';
import { PostScope, PostType } from '@/components/feature/post/types/post';
import { PostDeleteButton } from '@/components/feature/post/viewer/components/PostDeleteButton';
import { Badge } from '@/components/ui/badge';
import { Button, LinkButton } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { RelativeTime } from '@/components/ui/relative-time';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import ROUTES from '@/util/routes';

type ScopeFilter = 'ALL' | PostScope;
type TypeFilter = 'ALL' | PostType;

const PAGE_SIZE = 50;

export default function DraftPostsPage() {
  useAuthGuard();
  const t = useTranslations('pages.posts.drafts');
  const tPost = useTranslations('components.post');

  const [scope, setScope] = useState<ScopeFilter>('ALL');
  const [type, setType] = useState<TypeFilter>('ALL');

  const params = useMemo(
    () => ({
      first: PAGE_SIZE,
      scope: scope === 'ALL' ? undefined : scope,
      type: type === 'ALL' ? undefined : type,
    }),
    [scope, type],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchNextPageError,
    isFetchingNextPage,
    isPending,
    refetch,
  } = useDraftPosts(params);
  const drafts =
    data?.pages.flatMap((page) => page.data.posts?.nodes ?? []) ?? [];
  const [loadMoreRef, loadMoreEntry] = useIntersectionObserver({
    threshold: 0.2,
    root: null,
    rootMargin: '400px',
  });

  useEffect(() => {
    if (
      loadMoreEntry?.isIntersecting &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError
    ) {
      void fetchNextPage();
    }
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    loadMoreEntry?.isIntersecting,
  ]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <NotePencilIcon className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t('title')}</h1>
        </div>

        <LinkButton href={ROUTES.NEW_POST()} variant="outline">
          {t('new-post')}
        </LinkButton>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={scope}
          onValueChange={(value) => setScope(value as ScopeFilter)}
        >
          <TabsList>
            <TabsTrigger value="ALL">{t('filters.all')}</TabsTrigger>
            <TabsTrigger value={PostScope.PUBLIC}>
              {t('filters.public')}
            </TabsTrigger>
            <TabsTrigger value={PostScope.WORKSPACE}>
              {t('filters.workspace')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={type}
          onValueChange={(value) => setType(value as TypeFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('filters.all-types')}</SelectItem>
            <SelectItem value={PostType.SHORT}>
              {tPost('type.SHORT')}
            </SelectItem>
            <SelectItem value={PostType.LONG}>{tPost('type.LONG')}</SelectItem>
            <SelectItem value={PostType.QUESTION}>
              {tPost('type.QUESTION')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : isError && data === undefined ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('error.title')}</EmptyTitle>
            <EmptyDescription>{t('error.description')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => void refetch()}>
              {t('error.retry')}
            </Button>
          </EmptyContent>
        </Empty>
      ) : drafts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('empty.title')}</EmptyTitle>
            <EmptyDescription>{t('empty.description')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <LinkButton href={ROUTES.NEW_POST()}>
              {t('empty.action')}
            </LinkButton>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3">
          {drafts.map((draft) => (
            <DraftCard key={draft.cursor} draft={draft} />
          ))}

          {isFetchNextPageError ? (
            <div className="flex flex-col items-center gap-2 py-3 text-sm text-muted-foreground">
              <p>{t('error.load-more')}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchNextPage()}
              >
                {t('error.retry')}
              </Button>
            </div>
          ) : (
            <div
              ref={loadMoreRef}
              className="flex min-h-10 justify-center py-2"
            >
              {isFetchingNextPage && <Spinner />}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function DraftCard({ draft }: { draft: GetPostsResponsePostsNodesItem }) {
  const t = useTranslations('pages.posts.drafts');
  const tPost = useTranslations('components.post');
  const summary = draft.content.summary;
  const scope =
    summary.scope === PostScope.WORKSPACE
      ? PostScope.WORKSPACE
      : PostScope.PUBLIC;
  const href = summary.project?.handle
    ? ROUTES.PROJECT_POST_EDIT(summary.project.handle, summary.slug)
    : ROUTES.POST_EDIT(summary.slug);
  const updatedAt = summary.updatedAt ?? summary.createdAt;
  const title = summary.title?.trim() || t(`untitled.${summary.type}`);
  const preview = stripJsonContent(draft.content.content);

  return (
    <Card size="sm" className="rounded-lg">
      <CardHeader className="grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{tPost(`type.${summary.type}`)}</Badge>
            <Badge
              variant={scope === PostScope.PUBLIC ? 'secondary' : 'outline'}
            >
              {scope === PostScope.PUBLIC
                ? t('filters.public')
                : t('filters.workspace')}
            </Badge>
            {summary.project?.name && (
              <Badge variant="secondary">
                <FolderIcon />
                {summary.project.name}
              </Badge>
            )}
          </div>
          <CardTitle className="truncate text-base">
            <Link href={href} className="hover:underline">
              {title}
            </Link>
          </CardTitle>
        </div>

        <div className="flex items-center gap-2">
          <LinkButton href={href} size="sm">
            {t('actions.edit')}
          </LinkButton>
          <PostDeleteButton postId={summary.id} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {preview && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {preview}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileTextIcon className="size-3.5" />
          <RelativeTime date={updatedAt} />
        </div>
      </CardContent>
    </Card>
  );
}

function stripJsonContent(json: string) {
  try {
    const doc = JSON.parse(json) as {
      content?: { text?: string; content?: { text?: string }[] }[];
    };

    return (doc.content ?? [])
      .flatMap((node) => [
        node.text,
        ...(node.content ?? []).map((child) => child.text),
      ])
      .filter(Boolean)
      .join(' ')
      .trim();
  } catch {
    return '';
  }
}
