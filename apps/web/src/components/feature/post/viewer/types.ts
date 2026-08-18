import type { GetPostResponseContentMediaItem } from '@/api/__generated__/types';
import type { RecruitmentDetails } from '@/components/feature/recruitment/types';

import { PostScope, PostStatus, PostType } from '../types/post';

export interface PostAuthorSummary {
  name: string;
  handle: string;
  profileImageUrl?: string | null;
}

export interface PostProjectSummary {
  handle?: string | null;
  name?: string | null;
  iconUrl?: string | null;
}

export interface PostTagSummary {
  id: number;
  name: string;
  description?: string | null;
  postCount: number;
  followerCount: number;
  projectHandle?: string | null;
  isFollowing: boolean;
}

export interface PostPreviewMedia {
  id: number;
  url: string;
}

export interface PostSummary {
  id: number;
  slug: string;
  type: PostType;
  status: PostStatus;
  scope: PostScope;
  title?: string | null;
  author: PostAuthorSummary;
  project?: PostProjectSummary;
  liked: boolean;
  likeCount: number;
  bookmarked: boolean;
  commentCount: number;
  isAuthor: boolean;
  /** 요청자가 이 게시물을 삭제할 수 있는지 여부 (작성자, 플랫폼 관리자, 프로젝트 관리자) */
  canDelete: boolean;
  createdAt: string;
  resolved: boolean;
  /** 프로젝트 대시보드에 고정된 시각 (고정되지 않은 경우 없음) */
  pinnedAt?: string | null;
  tags: PostTagSummary[];
  /** 게시물 내용의 일반 텍스트 미리보기 */
  preview: string;
  /** 게시물 본문의 단어 수 */
  wordCount: number;
  /** 미리보기용 첨부 미디어 목록 (최대 3개) */
  previewMedia: PostPreviewMedia[];
  /** 게시물에 첨부된 전체 미디어 수 */
  mediaCount: number;
  /** 자동 생성 또는 업로드된 커버 이미지 URL */
  coverImageUrl?: string | null;
  /** 이 글을 만든 에이전트 클라이언트의 이름. 사람이 직접 쓴 글에는 없다. */
  createdViaClientName?: string | null;
  /** 전용 구인글에만 존재하는 구조화된 탐색 정보 */
  recruitment?: RecruitmentDetails | null;
}

/**
 * 뷰어가 받는 본문. 객체 형태의 `json` 이 비어 있을 수 있는데, 에이전트가 만들어 아직 변환되지
 * 않은 Markdown 초안이 그렇다. 뷰어는 Tiptap JSON 만 그리므로 그 경우 빈 문서로 처리하고,
 * 작성자는 편집 화면으로 유도한다(초안은 어차피 작성자 외에는 조회할 수 없다).
 */
export type PostContent =
  | string
  | { json?: string | null; media: GetPostResponseContentMediaItem[] };

export interface PostViewSource {
  summary: PostSummary;
  /**
   * 본문. `summary.accessLevel` 이 `PREVIEW`(유료 게이트)이면 서버가 응답에서 본문을
   * 통째로 빼므로 `undefined` 가 된다.
   */
  content?: PostContent;
}

export type PostCardVariant = 'preview' | 'detail';

interface RawPostSummary extends Omit<
  PostSummary,
  'type' | 'status' | 'scope' | 'author' | 'project' | 'recruitment'
> {
  type: string;
  status: string;
  scope: string;
  author: PostAuthorSummary;
  project?: PostProjectSummary;
  recruitment?: {
    status?: string | null;
    employmentType?: string | null;
    workMode?: string | null;
    location?: string | null;
    experienceLevel?: string | null;
    closesAt?: string | null;
  } | null;
}

/**
 * The only place the generated per-endpoint DTOs' string-literal `type`/
 * `status` get narrowed to the app's `PostType`/`PostStatus` enums — every
 * generated summary type is otherwise structurally identical to
 * `PostSummary`.
 */
export function toPostSummary(raw: RawPostSummary): PostSummary {
  const recruitment = raw.recruitment;
  return {
    ...raw,
    type: raw.type as PostType,
    status: raw.status as PostStatus,
    scope: raw.scope as PostScope,
    recruitment:
      recruitment?.status &&
      recruitment.employmentType &&
      recruitment.workMode &&
      recruitment.experienceLevel
        ? (recruitment as RecruitmentDetails)
        : undefined,
  };
}

export function toPostViewSource(raw: {
  summary: RawPostSummary;
  content?: PostContent;
}): PostViewSource {
  return {
    summary: toPostSummary(raw.summary),
    content: raw.content,
  };
}
