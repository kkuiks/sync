'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import * as React from 'react';

import { useGetProjectByHandle } from '@/api/__generated__/project/project';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import ROUTES from '@/util/routes';

import { ProjectAvatar } from './avatar';

interface ProjectHoverCardProps {
  handle: string;
  name: string;
  iconUrl?: string | null;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

export function ProjectHoverCard({
  handle,
  name,
  iconUrl,
  className,
  size = 'default',
}: ProjectHoverCardProps) {
  const t = useTranslations('components.project.hoverCard');
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>(null);

  const { data, isLoading } = useGetProjectByHandle(handle, {
    query: { enabled: open },
  });

  const project = data?.data.summary;

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
        <ProjectAvatar
          name={name}
          seed={handle}
          iconUrl={iconUrl}
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
        <div className="flex flex-col gap-3">
          <Link
            href={ROUTES.PROJECT(handle)}
            className="flex items-center gap-3"
          >
            <ProjectAvatar
              name={isLoading ? name : (project?.name ?? name)}
              seed={handle}
              iconUrl={isLoading ? iconUrl : (project?.iconUrl ?? iconUrl)}
              size="lg"
            />

            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium">
                {isLoading ? name : (project?.name ?? name)}
              </span>
              <span className="text-muted-foreground truncate">@{handle}</span>
            </div>
          </Link>

          {!isLoading && project?.description && (
            <p className="text-muted-foreground line-clamp-3">
              {project.description}
            </p>
          )}

          {!isLoading && project && (
            <p className="text-muted-foreground text-xs">
              {t('followerCount', { count: project.followerCount })}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
