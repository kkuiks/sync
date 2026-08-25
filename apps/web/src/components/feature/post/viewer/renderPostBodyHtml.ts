import { Node } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';

import { baseCodeBlock } from '../editor/extensions/nodes/code.schema';
import { embedNodeSchema } from '../editor/extensions/nodes/embed.schema';
import {
  type FileNodeOptions,
  fileNodeSchema,
} from '../editor/extensions/nodes/file/schema';
import {
  type ImageNodeAttributes,
  imageNodeSchema,
} from '../editor/extensions/nodes/image.schema';
import { ReadOnlyMathNode } from '../editor/extensions/nodes/math';
import { ReadOnlyTableNode } from '../editor/extensions/nodes/table';
import { TaskItemNode, TaskListNode } from '../editor/extensions/nodes/tasks';
import { deserialize } from '../editor/utils/serializer';
import type { PostContent } from './types';
import { normalizePostContent } from './utils/normalizePostContent';

/**
 * 서버에서 본문을 그릴 때 쓰는 확장 목록. `useReadOnlyPostEditor` 의 목록과 짝을 이루되
 * React 노드뷰가 붙지 않은 스키마만 모았다 — 노드뷰는 브라우저에서만 뜻이 있고,
 * `generateHTML` 은 스키마의 `renderHTML` 만 사용한다. 한쪽에 노드를 추가하면
 * 다른 쪽에도 추가해야 서버 HTML 과 클라이언트 렌더 결과가 어긋나지 않는다.
 *
 * 목차(`TableOfContents`)는 제외한다. 제목에 붙는 앵커 id 는 브라우저에서 매겨지고,
 * 크롤러는 그 값이 필요 없다.
 */
const SERVER_EXTENSIONS = [
  StarterKit.configure({ codeBlock: false }),
  baseCodeBlock,
  TaskListNode,
  TaskItemNode,
  Node.create<ImageNodeAttributes>(imageNodeSchema),
  Node.create<FileNodeOptions>({
    ...fileNodeSchema,
    addOptions() {
      return { slug: null };
    },
  }),
  Node.create(embedNodeSchema),
  ReadOnlyTableNode,
  ReadOnlyMathNode,
];

const SAFE_URL_PATTERN = /^(https?:|mailto:|\/|#)/i;

/**
 * 게시물 본문을 서버에서 HTML 로 그린다.
 *
 * 뷰어(`PostBody`)는 Tiptap 편집기 인스턴스로 본문을 그리는데, 편집기는 브라우저에서만
 * 만들어진다(`immediatelyRender: false`). 그래서 서버가 내려보내는 마크업에는 본문이
 * 통째로 빠져 있었고, 자바스크립트를 실행하지 않는 크롤러(네이버·다음)에게는 빈 글로 보였다.
 * 이 함수가 만든 HTML 을 첫 마크업으로 깔아 두고, 편집기가 뜨면 그 자리를 넘겨받는다.
 *
 * 본문을 그릴 수 없으면 `null` 을 돌려주고 호출부는 지금까지처럼 빈 자리로 시작한다 —
 * 색인은 아쉬워도 화면은 브라우저에서 그대로 채워진다.
 */
export function renderPostBodyHtml(
  content: PostContent | undefined,
): string | null {
  const normalized = normalizePostContent(content);

  if (!normalized) {
    return null;
  }

  try {
    const doc = deserialize(normalized.json, normalized.media);

    return generateHTML(withSafeUrls(doc), SERVER_EXTENSIONS);
  } catch (error) {
    console.error('본문을 서버에서 렌더링하지 못했습니다.', error);
    return null;
  }
}

/**
 * 본문에 담긴 링크·이미지 주소 중 `javascript:` 같은 실행 가능한 스킴을 걷어낸다.
 * 편집기는 붙여넣기 시점에 이미 스킴을 검사하지만, 저장된 JSON 은 API 로도 들어올 수
 * 있으므로 서버가 마크업으로 굳히기 직전에 한 번 더 본다.
 */
function withSafeUrls(node: JSONContent): JSONContent {
  const marks = node.marks?.map((mark) =>
    mark.type === 'link' && !isSafeUrl(mark.attrs?.href)
      ? { ...mark, attrs: { ...mark.attrs, href: null } }
      : mark,
  );

  const attrs =
    node.type === 'image' &&
    !isSafeUrl((node.attrs as ImageNodeAttributes)?.src)
      ? { ...node.attrs, src: null }
      : node.attrs;

  return {
    ...node,
    ...(attrs ? { attrs } : {}),
    ...(marks ? { marks } : {}),
    ...(node.content ? { content: node.content.map(withSafeUrls) } : {}),
  };
}

function isSafeUrl(value: unknown): boolean {
  return typeof value === 'string' && SAFE_URL_PATTERN.test(value.trim());
}
