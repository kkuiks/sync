'use client';

import type { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';

import { usePostContext } from '../PostContext';
import { PostPreviewBody } from './PostPreviewBody';

export interface PostBodyProps {
  editor: Editor | null;
  className?: string;
  /**
   * 유료 게이트(`accessLevel === 'PREVIEW'`)로 본문이 잠긴 경우 대신 보여줄 미리보기 텍스트.
   * 지정되면 에디터 본문 대신 이 텍스트만 렌더링한다.
   */
  lockedPreview?: string;
}

export function PostBody({ editor, className, lockedPreview }: PostBodyProps) {
  const { serverBodyHtml } = usePostContext();

  if (lockedPreview !== undefined) {
    return <PostPreviewBody preview={lockedPreview} className={className} />;
  }

  // 편집기는 hydration 이후에야 생긴다(`immediatelyRender: false`). 그때까지는 서버가
  // 그려 둔 본문을 그대로 놓아둔다 — 서버와 클라이언트의 첫 렌더가 같은 마크업이라
  // hydration 이 어긋나지 않고, 편집기가 뜨면 같은 자리를 넘겨받는다.
  if (!editor && serverBodyHtml) {
    return (
      <div className={className}>
        <div
          className="tiptap ProseMirror"
          dangerouslySetInnerHTML={{ __html: serverBodyHtml }}
        />
      </div>
    );
  }

  return <EditorContent editor={editor} className={className} />;
}
