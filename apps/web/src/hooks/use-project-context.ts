'use client';

import { usePathname, useSearchParams } from 'next/navigation';

// `/projects/new` 는 프로젝트 생성 화면이라 핸들이 아니다.
const PROJECT_CONTEXT_PATTERN = /^\/projects\/(?!new(?:\/|$))([^/]+)/;

/**
 * 지금 보고 있는 화면이 어느 프로젝트 안인지 알려준다. 개인 화면이면
 * `undefined`. 사이드바가 개인/프로젝트 모드를 고르는 기준과 같은 규칙이라,
 * 사이드바와 게시물 카드가 항상 같은 맥락을 본다.
 *
 * 검색 결과 페이지(`/search`)는 경로가 아닌 `projectHandle` 쿼리 파라미터로
 * 맥락을 전달하므로, 그 화면에 한해서만 경로 대신 쿼리를 확인한다.
 */
export function useProjectContextHandle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromPath = pathname.match(PROJECT_CONTEXT_PATTERN)?.[1];
  if (fromPath) return fromPath;

  if (pathname === '/search') {
    return searchParams.get('projectHandle') ?? undefined;
  }

  return undefined;
}
