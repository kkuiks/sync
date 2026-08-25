import type { Metadata } from 'next';

import { env } from '@/lib/env';
import ROUTES from '@/util/routes';

const SITE_NAME = 'sync';
const POST_TITLE_MAX_LENGTH = 60;
const POST_PREVIEW_TITLE_MAX_LENGTH = 40;
const POST_DESCRIPTION_MAX_LENGTH = 160;

/** 커버 이미지가 없는 게시물과 조회 실패 시 사용하는 기본 미리보기 이미지. */
export const DEFAULT_OG_IMAGE = '/og-default.png';

export interface PostSeoSource {
  slug: string;
  title?: string | null;
  preview: string;
  status: string;
  scope: string;
  author: {
    name: string;
    handle: string;
  };
  project?: {
    handle?: string | null;
    name?: string | null;
    isPublic?: boolean | null;
  };
  tags: Array<{
    name: string;
  }>;
  previewMedia: Array<{
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TagSeoSource {
  id: number;
  name: string;
  description?: string | null;
  /** 프로젝트 태그인 경우 소속 프로젝트 핸들 (전역 태그는 없음). */
  projectHandle?: string | null;
}

export const INDEXABLE_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
} satisfies NonNullable<Metadata['robots']>;

export const NON_INDEXABLE_ROBOTS = {
  index: false,
  follow: false,
  noarchive: true,
  nosnippet: true,
  noimageindex: true,
  googleBot: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
} satisfies NonNullable<Metadata['robots']>;

export const NON_INDEXABLE_METADATA = {
  robots: NON_INDEXABLE_ROBOTS,
} satisfies Metadata;

/**
 * 사이트의 정규 오리진. 배포 파이프라인이 넘겨주는 공개 도메인을 사용한다.
 */
export function getSiteUrl(path = '/'): URL {
  return new URL(path, new URL('/', env.NEXT_PUBLIC_SITE_URL));
}

/** 상대 경로를 정규 오리진 기준 절대 URL 문자열로 바꾼다. 이미 절대 URL이면 그대로 둔다. */
export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return getSiteUrl(pathOrUrl).toString();
}

/**
 * 페이지의 정규 URL만 담은 메타데이터 조각.
 * 루트 레이아웃은 canonical 을 선언하지 않으므로(선언하면 모든 하위 페이지가 홈을
 * 정규 URL 로 상속받아 색인에서 빠진다), 색인 대상 페이지가 각자 자기 경로를 밝힌다.
 */
export function canonicalMetadata(path: string): Metadata {
  return {
    alternates: {
      canonical: getSiteUrl(path),
    },
  };
}

export function getPostCanonicalPath(post: PostSeoSource): string {
  const projectHandle = post.project?.handle;

  return projectHandle
    ? ROUTES.PROJECT_POST(projectHandle, post.slug)
    : ROUTES.POST(post.slug);
}

export function getPostCanonicalUrl(post: PostSeoSource): URL {
  return getSiteUrl(getPostCanonicalPath(post));
}

export function isPostIndexable(post: PostSeoSource): boolean {
  if (post.status !== 'PUBLISHED') {
    return false;
  }

  if (post.scope === 'PUBLIC') {
    return true;
  }

  return (
    post.scope === 'WORKSPACE' &&
    post.project?.isPublic === true &&
    Boolean(post.project.handle)
  );
}

export function createPostMetadata(
  post: PostSeoSource,
  fallbackDescription: string,
): Metadata {
  const title =
    truncate(post.title, POST_TITLE_MAX_LENGTH) ||
    truncate(post.preview, POST_PREVIEW_TITLE_MAX_LENGTH) ||
    SITE_NAME;
  const description =
    truncate(post.preview, POST_DESCRIPTION_MAX_LENGTH) || fallbackDescription;
  const canonicalUrl = getPostCanonicalUrl(post);
  const authorUrl = getSiteUrl(ROUTES.PROFILE(post.author.handle));
  const tags = post.tags.map((tag) => tag.name);
  // 커버 이미지는 만료되는 서명 URL이라 og:image에 직접 넣으면 크롤러가
  // 재수집할 때 미리보기가 깨진다. 항상 불변 경로인 OG 라우트를 가리키고,
  // 실제 이미지 해석은 그 라우트가 요청 시점에 처리한다.
  const images = [
    {
      url: getSiteUrl(ROUTES.POST_OG_IMAGE(post.slug)).toString(),
      alt: title,
    },
  ];

  return {
    title,
    description,
    authors: [{ name: post.author.name, url: authorUrl }],
    creator: post.author.name,
    publisher: SITE_NAME,
    keywords: tags,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: isPostIndexable(post) ? INDEXABLE_ROBOTS : NON_INDEXABLE_ROBOTS,
    openGraph: {
      type: 'article',
      locale: 'ko_KR',
      siteName: SITE_NAME,
      title,
      description,
      url: canonicalUrl,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [authorUrl],
      section: post.project?.name ?? undefined,
      tags,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

/**
 * 태그 상세 페이지의 메타데이터를 만든다.
 * 전역 태그는 누구나 읽을 수 있어 색인하지만, 프로젝트 태그는 비공개 프로젝트의
 * 팀 전용 화면일 수 있으므로 색인하지 않는다.
 */
export function createTagMetadata(
  tag: TagSeoSource,
  fallbackDescription: string,
): Metadata {
  const id = String(tag.id);
  const isProjectTag = Boolean(tag.projectHandle);
  const canonicalUrl = getSiteUrl(
    isProjectTag ? ROUTES.PROJECT_TAG(tag.projectHandle!, id) : ROUTES.TAG(id),
  );
  const description =
    truncate(tag.description, POST_DESCRIPTION_MAX_LENGTH) ||
    fallbackDescription;

  return {
    title: tag.name,
    description,
    keywords: [tag.name],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: isProjectTag ? NON_INDEXABLE_ROBOTS : INDEXABLE_ROBOTS,
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      siteName: SITE_NAME,
      title: tag.name,
      description,
      url: canonicalUrl,
      images: [toAbsoluteUrl(DEFAULT_OG_IMAGE)],
    },
    twitter: {
      card: 'summary_large_image',
      title: tag.name,
      description,
      images: [toAbsoluteUrl(DEFAULT_OG_IMAGE)],
    },
  };
}

/**
 * 게시물 상세 페이지에 삽입할 BlogPosting JSON-LD를 만든다.
 * 색인 대상 게시물에만 사용한다(`isPostIndexable`).
 */
export function buildPostJsonLd(
  post: PostSeoSource,
  canonicalPath: string,
): Record<string, unknown> {
  const canonicalUrl = getSiteUrl(canonicalPath).toString();
  const title =
    truncate(post.title, POST_TITLE_MAX_LENGTH) ||
    truncate(post.preview, POST_PREVIEW_TITLE_MAX_LENGTH) ||
    SITE_NAME;
  const description =
    truncate(post.preview, POST_DESCRIPTION_MAX_LENGTH) || title;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    url: canonicalUrl,
    headline: title,
    description,
    image: [getSiteUrl(ROUTES.POST_OG_IMAGE(post.slug)).toString()],
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: 'ko-KR',
    keywords: post.tags.map((tag) => tag.name),
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: getSiteUrl(ROUTES.PROFILE(post.author.handle)).toString(),
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: getSiteUrl().toString(),
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl(DEFAULT_OG_IMAGE),
      },
    },
    ...(post.project?.name
      ? { isPartOf: { '@type': 'Blog', name: post.project.name } }
      : {}),
  };
}

function truncate(value: string | null | undefined, maxLength: number): string {
  const normalized = value?.replace(/\s+/g, ' ').trim() ?? '';

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
