import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import type { GetPostResponse } from '@/api/__generated__/types';

import { ReadOnlyImageNode } from '../../editor/extensions/nodes/image';
import { deserialize } from '../../editor/utils/serializer';

export function useReadOnlyPostEditor(
  content: Pick<GetPostResponse['content'], 'json' | 'media'>,
) {
  return useEditor({
    extensions: [StarterKit, ReadOnlyImageNode],
    content: deserialize(content.json, content.media),
    editable: false,
    immediatelyRender: false,
  });
}
