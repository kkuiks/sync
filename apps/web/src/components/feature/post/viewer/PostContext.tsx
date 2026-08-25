'use client';

import { ReactNode, createContext, useContext, useMemo, useState } from 'react';

export interface PostTocItem {
  id: string;
  level: number;
  itemIndex: number;
  textContent: string;
  isActive: boolean;
}

interface PostContextValue {
  toc: PostTocItem[];
  setToc: (items: PostTocItem[]) => void;
  /**
   * 서버가 미리 그려 둔 본문 HTML. 편집기는 브라우저에서만 만들어지므로, 그 전까지
   * 본문 자리를 채워 크롤러와 첫 화면 모두에 내용이 보이게 한다.
   */
  serverBodyHtml?: string | null;
}

const PostContext = createContext<PostContextValue>({
  toc: [],
  setToc: () => {},
});

export function PostProvider({
  children,
  serverBodyHtml,
}: {
  children: ReactNode;
  serverBodyHtml?: string | null;
}) {
  const [toc, setToc] = useState<PostTocItem[]>([]);
  const value = useMemo(
    () => ({ toc, setToc, serverBodyHtml }),
    [toc, serverBodyHtml],
  );

  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
}

export function usePostContext() {
  return useContext(PostContext);
}
