'use client';

import {
  BookmarkSimpleIcon,
  BriefcaseIcon,
  CompassIcon,
  FileTextIcon,
  HouseIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  PlusIcon,
  StackSimpleIcon,
  TagIcon,
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { useSearchMyProjects } from '@/api/__generated__/project/project';
import { ProjectAvatar } from '@/components/feature/project/avatar';
import { LinkButton } from '@/components/ui/button';
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useMounted } from '@/hooks/use-mounted';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useSession } from '@/lib/auth/client';
import { isAuthenticated } from '@/lib/auth/utils';
import ROUTES from '@/util/routes';

import SidebarCloseButton from './SidebarCloseButton';
import SupportButton from './SupportButton';

const MAX_VISIBLE_PROJECTS = 5;

const nav = [
  {
    labelKey: 'nav.home',
    href: ROUTES.HOME(),
    icon: HouseIcon,
    authenticated: false,
  },
  {
    labelKey: 'nav.explore-projects',
    href: ROUTES.EXPLORE_PROJECTS(),
    icon: CompassIcon,
    authenticated: false,
  },
  {
    labelKey: 'nav.recruitment',
    href: ROUTES.RECRUITMENT(),
    icon: BriefcaseIcon,
    authenticated: true,
  },
  {
    labelKey: 'nav.tags',
    href: ROUTES.EXPLORE_TAGS(),
    icon: TagIcon,
    authenticated: false,
  },
] as const;

// These link into the profile page's own tabs (?tab=drafts/bookmarks/collections),
// so their `href` depends on the current user's handle and is built in the
// component once the session is known — see `buildYours` below.
const buildYours = (handle: string | null) =>
  [
    {
      labelKey: 'nav.my-posts',
      href: handle ? ROUTES.PROFILE(handle) : ROUTES.LOGIN(),
      tab: undefined as string | undefined,
      icon: NotePencilIcon,
      authenticated: true,
    },
    {
      labelKey: 'nav.drafts',
      href: handle ? ROUTES.PROFILE_DRAFTS(handle) : ROUTES.LOGIN(),
      tab: 'drafts',
      icon: FileTextIcon,
      authenticated: true,
    },
    {
      // Reuses `components.navigation.menu.bookmarks` — same bookmarks concept
      // already translated for the top navigation bar.
      labelKey: 'menu.bookmarks',
      namespace: 'navigation' as const,
      href: handle ? ROUTES.PROFILE_BOOKMARKS(handle) : ROUTES.LOGIN(),
      tab: 'bookmarks',
      icon: BookmarkSimpleIcon,
      authenticated: true,
    },
    {
      labelKey: 'nav.collections',
      href: handle ? ROUTES.PROFILE_COLLECTIONS(handle) : ROUTES.LOGIN(),
      tab: 'collections',
      icon: StackSimpleIcon,
      authenticated: true,
    },
  ] as const;

const footer = [
  { labelKey: 'privacy', href: ROUTES.PRIVACY() },
  { labelKey: 'terms', href: ROUTES.TERMS() },
  { labelKey: 'cookies', href: ROUTES.COOKIES() },
] as const;

export default function PersonalSidebarContent() {
  const t = useTranslations('components.layout.sidebar');
  const tNav = useTranslations('components.navigation');
  const tFooter = useTranslations('components.footer');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query] = useState('');
  const { requireAuth } = useRequireAuth();

  // `useSession` can resolve synchronously from its client-side cache before
  // hydration, while SSR always renders a logged-out state. Gating the whole
  // logged-in subtree on `mounted` keeps the first client render identical to
  // the server-rendered HTML, so neither the extra nodes nor Radix's
  // useId-based ids diverge and cause a hydration mismatch.
  const mounted = useMounted();

  const { data: session } = useSession();
  const showProjects = mounted && isAuthenticated(session);
  const handle = mounted ? (session?.user.handle ?? null) : null;
  const yours = buildYours(handle);

  const { data } = useSearchMyProjects(
    { query },
    { query: { enabled: showProjects } },
  );

  const projects = data?.data.projects ?? [];

  return (
    <>
      <SidebarHeader className="flex flex-row items-center justify-between p-4">
        <SidebarCloseButton />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="bg-success-tint text-success-text hover:bg-success-tint/80 active:bg-success-tint/70"
                >
                  <Link
                    href={ROUTES.NEW_POST()}
                    onClick={(event) => {
                      if (
                        !requireAuth({
                          intent: 'write',
                          redirectTo: ROUTES.NEW_POST(),
                        })
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <PencilSimpleIcon />
                    {t('ask-write')}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        onClick={(event) => {
                          if (
                            item.authenticated &&
                            !requireAuth({
                              intent: 'write',
                              redirectTo: item.href,
                            })
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <Icon />
                        {t(item.labelKey)}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>{t('yours')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {yours.map((item) => {
                const Icon = item.icon;
                const isActive =
                  !!handle &&
                  pathname === ROUTES.PROFILE(handle) &&
                  (searchParams.get('tab') ?? undefined) === item.tab;
                return (
                  <SidebarMenuItem key={item.labelKey}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.href}
                        onClick={(event) => {
                          if (
                            item.authenticated &&
                            !requireAuth({
                              intent: 'write',
                              redirectTo: item.href,
                            })
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <Icon />
                        {'namespace' in item
                          ? tNav(item.labelKey)
                          : t(item.labelKey)}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showProjects && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <div className="flex">
                  <Link
                    href={ROUTES.PROJECTS()}
                    className="grow hover:text-sidebar-foreground"
                  >
                    {t('projects')}
                  </Link>

                  <LinkButton href={ROUTES.NEW_PROJECT()} variant="ghost">
                    <PlusIcon />
                  </LinkButton>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.slice(0, MAX_VISIBLE_PROJECTS).map((project) => {
                    const isActive =
                      pathname === ROUTES.PROJECT(project.handle);
                    return (
                      <SidebarMenuItem key={project.handle}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={ROUTES.PROJECT(project.handle)}>
                            <ProjectAvatar
                              name={project.name}
                              seed={project.handle}
                              iconUrl={project.iconUrl}
                            />
                            {project.name}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                  {projects.length > MAX_VISIBLE_PROJECTS && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link
                          href={ROUTES.PROJECTS()}
                          className="text-sidebar-foreground/60"
                        >
                          {t('see-more')}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <div className="px-2">
        <SupportButton />
      </div>

      <SidebarFooter className="p-4">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-sidebar-foreground/60">
          {footer.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {tFooter(link.labelKey)}
            </Link>
          ))}
        </div>
      </SidebarFooter>
    </>
  );
}
