import { mergeAttributes } from '@tiptap/core';

import { NodeType } from '.';

/**
 * 노드뷰(React 컴포넌트)와 떨어져 있는 스키마 정의.
 *
 * 서버 렌더링 경로(`renderPostBodyHtml`)가 이 스키마를 가져다 쓰는데, 노드뷰가 든 파일은
 * `useState` 같은 훅을 import 하고 있어서 서버 그래프에 들어오는 순간 Turbopack 이 빌드를
 * 막는다. 그래서 브라우저 코드가 섞이지 않은 이 파일로 스키마만 떼어 둔다.
 */

export type ImageNodeAttributes = {
  src: string | null;
  status: 'none' | 'loaded' | 'uploading' | 'uploaded' | 'error';
  mediaId: string | null;
  pendingId: string | null;
};

export const imageNodeSchema = {
  name: NodeType.Image,
  group: 'block',
  content: '',
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: null,
      },
      status: {
        default: 'none',
        rendered: false,
      },
      mediaId: {
        default: null,
        parseHTML: (element: Element) => element.getAttribute('data-media-id'),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.mediaId ? { 'data-media-id': attributes.mediaId } : {},
      },
      pendingId: {
        default: null,
        rendered: false,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element: Element) => ({
          status: element.getAttribute('src') ? 'uploaded' : 'none',
        }),
      },
    ];
  },
  renderHTML({
    HTMLAttributes,
  }: {
    HTMLAttributes: Record<string, unknown>;
  }): [string, Record<string, unknown>] {
    return ['img', mergeAttributes(HTMLAttributes)];
  },
};
