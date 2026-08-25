import { TableOfContents } from '@tiptap/extension-table-of-contents';
import type { JSONContent } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import type { GetPostResponse } from '@/api/__generated__/types';

import { ReadOnlyCodeBlockNode } from '../../editor/extensions/nodes/code';
import { ReadOnlyEmbedNode } from '../../editor/extensions/nodes/embed';
import { ReadOnlyFileNode } from '../../editor/extensions/nodes/file';
import { ReadOnlyImageNode } from '../../editor/extensions/nodes/image';
import { ReadOnlyMathNode } from '../../editor/extensions/nodes/math';
import { ReadOnlyTableNode } from '../../editor/extensions/nodes/table';
import {
  TaskItemNode,
  TaskListNode,
} from '../../editor/extensions/nodes/tasks';
import { deserialize } from '../../editor/utils/serializer';
import { usePostContext } from '../PostContext';

const EMPTY_DOC: JSONContent = { type: 'doc', content: [] };

export function useReadOnlyPostEditor(
  content:
    | Pick<NonNullable<GetPostResponse['content']>, 'json' | 'media'>
    | undefined,
  slug: string | null = null,
) {
  let doc: JSONContent;
  if (content === undefined || !content.json) {
    // 유료 게이트(PREVIEW)처럼 서버가 본문을 아예 내려주지 않는 경우, 또는 아직 변환되지 않은
    // Markdown 초안이라 Tiptap JSON 이 없는 경우. 잠긴 본문 대신 무엇을 보여줄지는
    // 호출부(PostCard)가 결정하고, 에디터는 빈 문서를 유지한다.
    doc = EMPTY_DOC;
  } else {
    try {
      doc = deserialize(content.json, content.media);
    } catch (error) {
      console.error('Failed to parse post content', error);
      doc = EMPTY_DOC;
    }
  }

  const { setToc } = usePostContext();

  return useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      ReadOnlyCodeBlockNode,
      TaskListNode,
      TaskItemNode,
      ReadOnlyImageNode,
      ReadOnlyFileNode.configure({ slug }),
      ReadOnlyEmbedNode,
      ReadOnlyTableNode,
      ReadOnlyMathNode,
      TableOfContents.configure({
        scrollParent: () =>
          document.querySelector<HTMLElement>('[data-slot="sidebar-inset"]') ??
          window,
        onUpdate: (items) =>
          setToc(
            items.map((item) => ({
              id: item.id,
              level: item.level,
              itemIndex: item.itemIndex,
              textContent: item.textContent,
              isActive: item.isActive,
            })),
          ),
      }),
    ],
    content: doc,
    editable: false,
    immediatelyRender: false,
  });
}
