import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 사용자가 입력한 URL을 그대로 `href`에 넣으면 `javascript:` 같은 스킴으로
 * 클릭 기반 XSS가 가능하다. `http`/`https` 절대 URL만 통과시키고, 그 외
 * (파싱 실패 포함)는 `null`을 반환하니 호출부에서 링크 자체를 렌더링하지 않게
 * 한다.
 */
export function toSafeHttpUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null;
  } catch {
    return null;
  }
}
