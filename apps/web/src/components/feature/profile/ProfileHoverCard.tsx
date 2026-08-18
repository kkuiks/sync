'use client';

import Link from 'next/link';
import * as React from 'react';

import { useGetProfileByHandle } from '@/api/__generated__/profile/profile';
import { ProfileAvatar } from '@/components/feature/profile/ProfileAvatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import ROUTES from '@/util/routes';

const MAXIMUM_DISPLAYED_HANDLE_LENGTH = 20;

interface ProfileHoverCardProps {
  handle: string;
  name: string;
  imageUrl?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

export function ProfileHoverCard({
  handle,
  name,
  imageUrl,
  className,
  size = 'default',
}: ProfileHoverCardProps) {
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>(null);

  const { data, isLoading } = useGetProfileByHandle(handle, {
    query: { enabled: open },
  });

  const profile = data?.data;

  function handleMouseEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ProfileAvatar
          name={name}
          seed={handle}
          imageUrl={imageUrl}
          size={size}
          className={cn('cursor-pointer', className)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Link href={ROUTES.PROFILE(handle)}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                name={isLoading ? name : (profile?.name ?? name)}
                seed={handle}
                imageUrl={
                  isLoading ? imageUrl : (profile?.profileImageUrl ?? imageUrl)
                }
                size="lg"
              />

              <div className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {isLoading ? name : (profile?.name ?? name)}
                </span>
                <span className="text-muted-foreground">
                  @
                  {handle.length < MAXIMUM_DISPLAYED_HANDLE_LENGTH
                    ? handle
                    : `${handle.slice(0, MAXIMUM_DISPLAYED_HANDLE_LENGTH)}...`}
                </span>
              </div>
            </div>

            {!isLoading && profile?.bio && (
              <p className="text-muted-foreground line-clamp-3">
                {profile.bio}
              </p>
            )}
          </div>
        </Link>
      </PopoverContent>
    </Popover>
  );
}
