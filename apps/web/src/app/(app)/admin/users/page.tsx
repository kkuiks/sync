'use client';

import { MagnifyingGlassIcon, TrashIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@uidotdev/usehooks';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import type { AdminUserSummary } from '@/api/__generated__/types/AdminUserSummary';
import {
  getSearchAdminUserQueryKey,
  useAdminDeleteUser,
  useSearchAdminUser,
} from '@/api/__generated__/user/user';
import { ProfileAvatar } from '@/components/feature/profile/ProfileAvatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import SyncError, { ErrorCode } from '@/lib/error';
import ROUTES from '@/util/routes';

const DEBOUNCE_MS = 300;

export default function AdminUsersPage() {
  const t = useTranslations('pages.admin.users');
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);

  const trimmedQuery = debouncedQuery.trim();
  const params = { query: trimmedQuery };
  const { data, isFetching, error } = useSearchAdminUser(params, {
    query: { enabled: trimmedQuery.length > 0 },
  });

  const user = data?.data;
  const isPending = query !== debouncedQuery || isFetching;
  const hasQuery = trimmedQuery.length > 0;
  const notFound =
    hasQuery &&
    !isPending &&
    !user &&
    error instanceof SyncError &&
    error.code === ErrorCode.USER_NOT_FOUND;

  const { mutate: deleteUser } = useAdminDeleteUser({
    mutation: {
      onSuccess: async () => {
        toast.success(t('messages.delete-success'));
        await queryClient.invalidateQueries({
          queryKey: getSearchAdminUserQueryKey(params),
        });
      },
      onError: (mutationError) => {
        if (mutationError instanceof SyncError) {
          switch (mutationError.code) {
            case ErrorCode.USER_NOT_FOUND:
              toast.error(t('messages.not-found-error'));
              return;
            case ErrorCode.USER_CANNOT_BE_DELETED:
              toast.error(t('messages.cannot-delete-error'));
              return;
          }
        }
        toast.error(t('messages.delete-error'));
      },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <InputGroup className="max-w-md">
        <InputGroupAddon>
          <MagnifyingGlassIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('search.placeholder')}
        />
      </InputGroup>

      {!hasQuery ? (
        <p className="py-12 text-center text-muted-foreground">
          {t('search.prompt')}
        </p>
      ) : isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : notFound || !user ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MagnifyingGlassIcon />
            </EmptyMedia>
            <EmptyTitle>{t('empty', { query: trimmedQuery })}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <UserResultCard user={user} onDelete={deleteUser} />
      )}
    </div>
  );
}

interface UserResultCardProps {
  user: AdminUserSummary;
  onDelete: (variables: { handle: string }) => void;
}

function UserResultCard({ user, onDelete }: UserResultCardProps) {
  const t = useTranslations('pages.admin.users');
  const isDeleted = Boolean(user.deletedAt);

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar
            name={user.name}
            seed={user.handle ?? null}
            imageUrl={user.profileImageUrl}
          />
          <div className="flex flex-col">
            {user.handle ? (
              <Link
                href={ROUTES.PROFILE(user.handle)}
                className="font-medium hover:underline"
              >
                {user.name}
              </Link>
            ) : (
              <span className="font-medium">{user.name}</span>
            )}
            <span className="text-sm text-muted-foreground">
              {user.handle ? `@${user.handle}` : '-'}
            </span>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={isDeleted || !user.handle}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <TrashIcon />
              {t('actions.delete')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('delete-dialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('delete-dialog.description', { name: user.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={(event) => {
                  event.preventDefault();
                  if (user.handle) {
                    onDelete({ handle: user.handle });
                  }
                }}
              >
                {t('actions.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <Field label={t('table.email')} value={user.email} />
        <Field
          label={t('table.role')}
          value={
            <Badge variant={user.role === 'ADMIN' ? 'default' : 'outline'}>
              {t(`roles.${user.role}`)}
            </Badge>
          }
        />
        <Field label={t('table.follower-count')} value={user.followerCount} />
        <Field
          label={t('table.createdAt')}
          value={formatDate(user.createdAt)}
        />
        <Field
          label={t('table.status')}
          value={
            <div className="flex flex-wrap gap-1">
              {isDeleted && (
                <Badge variant="destructive">{t('status.deleted')}</Badge>
              )}
              {!user.isOnboarded && (
                <Badge variant="outline">{t('status.not-onboarded')}</Badge>
              )}
              {!user.isEmailVerified && (
                <Badge variant="outline">{t('status.email-unverified')}</Badge>
              )}
              {!isDeleted && user.isOnboarded && user.isEmailVerified && '-'}
            </div>
          }
        />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div>{value}</div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
  }).format(new Date(value));
}
