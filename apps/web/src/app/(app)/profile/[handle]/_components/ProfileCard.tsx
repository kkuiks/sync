'use client';
import { EnvelopeIcon, PencilIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useGetProfileByHandle } from '@/api/__generated__/profile/profile';
import { FollowButton } from '@/components/feature/profile/FollowButton';
import { ProfileAvatar } from '@/components/feature/profile/ProfileAvatar';
import { ContactFields } from '@/components/feature/profile/contacts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModalType } from '@/constants/modal';
import { useModal } from '@/hooks/store';
import SyncError, { ErrorCode } from '@/lib/error';
import ROUTES from '@/util/routes';

interface ProfileOverviewProps {
  handle: string;
}

export default function ProfileOverview({ handle }: ProfileOverviewProps) {
  const t = useTranslations('pages.profile');

  const {
    data: profile,
    isPending,
    error,
    isError,
  } = useGetProfileByHandle(handle);

  useEffect(() => {
    if (isError && error instanceof SyncError) {
      switch (error.code) {
        case ErrorCode.USER_NOT_FOUND:
          notFound();
      }
    }
  }, [error, isError]);

  if (!profile) {
    return <Skeleton className="h-56 w-full" />;
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <ProfileAvatar
          name={profile.data.name}
          seed={handle}
          imageUrl={profile.data.profileImageUrl}
          className="h-28 w-28 border"
        />

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                {profile.data.name}
              </h2>
              {profile.data.profession && (
                <p className="text-muted-foreground">
                  {profile.data.profession}
                </p>
              )}
            </div>

            <div className="h-9">
              {!isPending && (
                <div className="flex gap-2">
                  {profile.data.isAuthenticatedUser ? (
                    <EditProfileButton />
                  ) : (
                    <FollowButton handle={handle} />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href={ROUTES.PROFILE_FOLLOWERS(handle)}
              className="hover:underline"
            >
              <span className="font-semibold">
                {profile.data.followerCount}
              </span>{' '}
              <span className="text-muted-foreground">
                {t('header.followers')}
              </span>
            </Link>
            <Link
              href={ROUTES.PROFILE_FOLLOWING(handle)}
              className="hover:underline"
            >
              <span className="font-semibold">
                {profile.data.followingCount}
              </span>{' '}
              <span className="text-muted-foreground">
                {t('header.following')}
              </span>
            </Link>
          </div>

          {profile.data.bio && (
            <p className="max-w-2xl text-pretty break-words leading-relaxed text-foreground/90">
              {profile.data.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <EnvelopeIcon />
              <p>{profile.data.email}</p>
            </div>

            <ProfileContacts handle={handle} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileContacts({ handle }: { handle: string }) {
  const t = useTranslations('pages.profile');

  const [showAllContacts, setShowAllContacts] = useState(false);

  const { data: profile } = useGetProfileByHandle(handle);

  if (!profile || !profile.data.contacts) {
    return null;
  }

  const contacts = profile.data.contacts;

  const filteredFields = ContactFields.filter((field) => {
    const contact = contacts[field.id as keyof typeof profile.data.contacts];
    return contact && contact.trim() !== '';
  });

  const displayFields = showAllContacts
    ? filteredFields
    : filteredFields.slice(0, 2);

  return (
    <>
      {displayFields.map((field) => {
        const contact =
          contacts[field.id as keyof typeof profile.data.contacts];

        return (
          <Link
            key={field.id}
            className="text-sm text-muted-foreground flex items-center gap-2"
            href={`${field.prefix}${contact}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <p>{field.icon}</p>
            <p>
              {field.prefix}
              {contact}
            </p>
          </Link>
        );
      })}

      {filteredFields.length > 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllContacts(!showAllContacts)}
          className="w-fit text-sm"
        >
          {showAllContacts
            ? t('header.contacts.show-less')
            : `${t('header.contacts.show-more')} (${filteredFields.length - 2})`}
        </Button>
      )}
    </>
  );
}

function EditProfileButton() {
  const t = useTranslations('pages.profile.header');

  const { openModal } = useModal();

  return (
    <Button
      variant="ghost"
      aria-label={t('edit')}
      onClick={() => openModal(ModalType.SETTINGS)}
    >
      <PencilIcon />
    </Button>
  );
}
