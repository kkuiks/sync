import type { Editor, JSONContent } from '@tiptap/core';

import type { GetPostResponseContentMediaItem } from '@/api/__generated__/types';

import { NodeType } from '../extensions/nodes';
import type { FileNodeAttributes } from '../extensions/nodes/file/schema';
import type { ImageNodeAttributes } from '../extensions/nodes/image.schema';

type Media = {
  id: string;
};

export function serialize(editor: Editor): {
  json: string;
  text: string;
  media: Media[];
} {
  const doc = editor.getJSON();

  const nodes = doc.content.map((node) => serializeNode(node));

  const content = nodes.map((child) => child.node);
  const media = nodes.flatMap((child) => child.media);

  return {
    json: JSON.stringify({
      ...doc,
      content,
    }),
    text: editor.getText(),
    media,
  };
}

function serializeNode(node: JSONContent): {
  node: JSONContent;
  media: Media[];
} {
  switch (node.type) {
    case NodeType.Image: {
      const { mediaId } = node.attrs as ImageNodeAttributes;

      return {
        node: {
          ...node,
          attrs: {
            mediaId,
          },
        },
        media: mediaId ? [{ id: mediaId }] : [],
      };
    }

    case NodeType.File: {
      const { mediaId, showPreview } = node.attrs as FileNodeAttributes;

      return {
        node: {
          ...node,
          attrs: {
            mediaId,
            showPreview: showPreview === true,
          },
        },
        media: mediaId ? [{ id: mediaId }] : [],
      };
    }

    // 표 셀이나 인용구처럼 다른 노드를 품을 수 있는 노드는 그 안에 있는
    // 이미지도 미디어 목록에 올라와야 하므로 자식까지 내려간다.
    default: {
      if (!node.content) {
        return { node, media: [] };
      }

      const children = node.content.map((child) => serializeNode(child));

      return {
        node: { ...node, content: children.map((child) => child.node) },
        media: children.flatMap((child) => child.media),
      };
    }
  }
}

export function deserialize(
  json: string,
  media: GetPostResponseContentMediaItem[],
): JSONContent {
  const mediaById = new Map(media.map((item) => [String(item.id), item]));

  try {
    const doc = JSON.parse(json) as JSONContent;

    const nodes = (doc.content ?? []).map((node) =>
      deserializeNode(node, mediaById),
    );

    return {
      ...doc,
      content: nodes.filter((node) => node !== null),
    };
  } catch {
    throw new Error('Failed to deserialize content');
  }
}

function deserializeNode(
  node: JSONContent,
  mediaById: Map<string, GetPostResponseContentMediaItem>,
): JSONContent | null {
  switch (node.type) {
    case NodeType.Image: {
      const { mediaId } = node.attrs as ImageNodeAttributes;

      const item = mediaId ? mediaById.get(mediaId) : undefined;

      if (!item) {
        return null;
      }

      return {
        ...node,
        attrs: {
          ...node.attrs,
          mediaId,
          src: item.url ?? null,
          status: 'uploaded',
        },
      };
    }

    case NodeType.File: {
      const { mediaId } = node.attrs as FileNodeAttributes;

      const item = mediaId ? mediaById.get(mediaId) : undefined;

      if (!item) {
        return null;
      }

      return {
        ...node,
        attrs: {
          ...node.attrs,
          mediaId,
          url: item.url ?? null,
          fileName: item.fileName ?? null,
          fileSize: item.fileSize ?? null,
          mediaType: item.mediaType ?? null,
          status: 'uploaded',
        },
      };
    }

    default: {
      if (!node.content) {
        return node;
      }

      const children = node.content
        .map((child) => deserializeNode(child, mediaById))
        .filter((child): child is JSONContent => child !== null);

      return {
        ...node,
        content: children.length === 0 ? [{ type: 'paragraph' }] : children,
      };
    }
  }
}
