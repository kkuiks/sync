'use client';

import {
  ArrowLeftIcon,
  BookmarkSimpleIcon,
  CaretDownIcon,
  ChatCircleIcon,
  DotsThreeIcon,
  GearIcon,
  HouseIcon,
  NotePencilIcon,
  PencilIcon,
  RssIcon,
  StackSimpleIcon,
  TagIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import {
  useGetProjectByHandle,
  useSearchMyProjects,
} from '@/api/__generated__/project/project';
import { GetProjectResponseRole } from '@/api/__generated__/types';
import { ProjectAvatar } from '@/components/feature/project/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarContent,
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
import ROUTES from '@/util/routes';

import SidebarCloseButton from './SidebarCloseButton';
import SupportButton from './SupportButton';

interface ProjectSidebarContentProps {
  handle: string;
}

export default function ProjectSidebarContent({
  handle,
}: ProjectSidebarContentProps) {
  const { data: projectData } = useGetProjectByHandle(handle);
  const isViewer = !!projectData?.data.isViewer;
  const isManager =
    !!projectData?.data.isOwner ||
    projectData?.data.role === GetProjectResponseRole.Admin;

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-end">
          <SidebarCloseButton />
        </div>

        <BackToHomeButton />

        <ProjectSwitcher handle={handle} />

        {isViewer && <AskOrWriteButton handle={handle} />}
      </SidebarHeader>

      <SidebarContent>
        <Browse handle={handle} />

        {isViewer && (
          <>
            <SidebarSeparator />
            <MyContributions handle={handle} />

            {isManager && (
              <>
                <SidebarSeparator />
                <Settings handle={handle} />
              </>
            )}
          </>
        )}
      </SidebarContent>

      <div className="px-2">
        <SupportButton />
      </div>
    </>
  );
}

interface SectionProps {
  handle: string;
}

function BackToHomeButton() {
  const t = useTranslations('components.layout.sidebar');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild className="text-sidebar-foreground/70">
          <Link href={ROUTES.HOME()}>
            <ArrowLeftIcon />
            {t('back-to-home')}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

const PROJECT_SWITCHER_VISIBLE_COUNT = 5;

function ProjectSwitcher({ handle }: SectionProps) {
  const t = useTranslations('components.layout.sidebar');
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const { isAuthenticated } = useRequireAuth();
  const { data } = useGetProjectByHandle(handle);
  const { data: myProjectsData } = useSearchMyProjects(
    { query: '' },
    { query: { enabled: isAuthenticated } },
  );

  const projectName = data?.data.summary.name ?? handle;
  const projectIconUrl = data?.data.summary.iconUrl;
  const myProjects = myProjectsData?.data.projects ?? [];
  const visibleProjects = myProjects.slice(0, PROJECT_SWITCHER_VISIBLE_COUNT);
  const hasMoreProjects = myProjects.length > PROJECT_SWITCHER_VISIBLE_COUNT;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu
          open={isProjectMenuOpen}
          onOpenChange={setIsProjectMenuOpen}
        >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-lg border border-sidebar-border"
              data-state={isProjectMenuOpen ? 'open' : 'closed'}
            >
              <ProjectAvatar
                name={projectName}
                seed={handle}
                iconUrl={projectIconUrl}
                size="lg"
              />
              <span className="truncate font-medium">{projectName}</span>
              <CaretDownIcon
                className={`ml-auto transition-transform ${
                  isProjectMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>{t('your-projects')}</DropdownMenuLabel>
            {visibleProjects.map((project) => (
              <DropdownMenuItem key={project.handle} asChild>
                <Link href={ROUTES.PROJECT(project.handle)}>
                  <ProjectAvatar
                    name={project.name}
                    seed={project.handle}
                    iconUrl={project.iconUrl}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            {hasMoreProjects && (
              <DropdownMenuItem asChild>
                <Link href={ROUTES.PROJECTS()}>
                  <DotsThreeIcon />
                  <span className="truncate">{t('see-more')}</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function AskOrWriteButton({ handle }: SectionProps) {
  const t = useTranslations('components.layout.sidebar');
  const pathname = usePathname();
  const { requireAuth } = useRequireAuth();

  return (
    <SidebarMenu>
      <SidebarMenuButton
        asChild
        isActive={pathname === ROUTES.NEW_PROJECT_POST(handle)}
        className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
      >
        <Link
          href={ROUTES.NEW_PROJECT_POST(handle)}
          onClick={(event) => {
            if (
              !requireAuth({
                intent: 'write',
                redirectTo: ROUTES.NEW_PROJECT_POST(handle),
              })
            ) {
              event.preventDefault();
            }
          }}
        >
          <PencilIcon />
          {t('ask-write')}
        </Link>
      </SidebarMenuButton>
    </SidebarMenu>
  );
}

function Browse({ handle }: SectionProps) {
  const t = useTranslations('components.layout.sidebar');
  const pathname = usePathname();

  const isPostsPath = pathname === ROUTES.PROJECT_POSTS(handle);
  const isMembersPath = pathname.startsWith(ROUTES.PROJECT_MEMBERS(handle));
  const isTagsPath = pathname.startsWith(ROUTES.PROJECT_TAGS(handle));
  const isCollectionsPath = pathname.startsWith(
    ROUTES.PROJECT_COLLECTIONS(handle),
  );

  const items = [
    {
      labelKey: 'nav.home',
      href: ROUTES.PROJECT(handle),
      icon: HouseIcon,
      isActive: pathname === ROUTES.PROJECT(handle),
    },
    {
      labelKey: 'nav.board',
      href: ROUTES.PROJECT_POSTS(handle),
      icon: RssIcon,
      isActive: isPostsPath,
    },
    {
      labelKey: 'nav.members',
      href: ROUTES.PROJECT_MEMBERS(handle),
      icon: UsersIcon,
      isActive: isMembersPath,
    },
    {
      labelKey: 'nav.tags',
      href: ROUTES.PROJECT_TAGS(handle),
      icon: TagIcon,
      isActive: isTagsPath,
    },
    {
      labelKey: 'nav.collections',
      href: ROUTES.PROJECT_COLLECTIONS(handle),
      icon: StackSimpleIcon,
      isActive: isCollectionsPath,
    },
  ] as const;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('nav.browse')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.labelKey}>
                <SidebarMenuButton asChild isActive={item.isActive}>
                  <Link href={item.href}>
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
  );
}

function MyContributions({ handle }: SectionProps) {
  const t = useTranslations('components.layout.sidebar');
  const pathname = usePathname();
  // SSR은 항상 로그아웃 상태로 그리는데 `useSession`은 클라이언트 캐시에서
  // 하이드레이션 전에 값을 채울 수 있다. `mounted`로 함께 막아야 첫 클라이언트
  // 렌더가 서버 HTML과 같아진다.
  const mounted = useMounted();
  const { data: session } = useSession();

  if (!mounted || !session?.user.handle) {
    return null;
  }

  const items = [
    {
      labelKey: 'nav.my-posts',
      href: ROUTES.PROJECT_MY_POSTS(handle),
      icon: NotePencilIcon,
      isActive: pathname === ROUTES.PROJECT_MY_POSTS(handle),
    },
    {
      labelKey: 'nav.my-comments',
      href: ROUTES.PROJECT_MY_COMMENTS(handle),
      icon: ChatCircleIcon,
      isActive: pathname === ROUTES.PROJECT_MY_COMMENTS(handle),
    },
    {
      labelKey: 'nav.bookmarks',
      href: ROUTES.PROJECT_BOOKMARKS(handle),
      icon: BookmarkSimpleIcon,
      isActive: pathname === ROUTES.PROJECT_BOOKMARKS(handle),
    },
    {
      labelKey: 'nav.drafts',
      href: ROUTES.PROJECT_DRAFTS(handle),
      icon: NotePencilIcon,
      isActive: pathname === ROUTES.PROJECT_DRAFTS(handle),
    },
  ] as const;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('my-contributions')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.labelKey}>
                <SidebarMenuButton asChild isActive={item.isActive}>
                  <Link href={item.href}>
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
  );
}

function Settings({ handle }: SectionProps) {
  const t = useTranslations('components.layout.sidebar');
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(ROUTES.PROJECT_SETTINGS(handle))}
            >
              <Link href={ROUTES.PROJECT_SETTINGS(handle)}>
                <GearIcon />
                {t('nav.settings')}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
