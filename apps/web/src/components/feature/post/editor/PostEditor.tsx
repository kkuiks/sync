'use client';

import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { PostScope, PostStatus, PostType } from '../types/post';
import { EditorBubbleMenu } from './components/EditorBubbleMenu';
import { EditorTemplates } from './components/EditorTemplates';
import { TagInput } from './components/TagInput';
import { CommandsExtension } from './extensions/commands';
import { ImageNode } from './extensions/nodes/image';
import { serialize } from './utils/serializer';

interface PostEditorProps {
  type: PostType;
  scope: PostScope;
  project?: {
    handle: string;
    name: string;
  };
  isSubmitting?: boolean;
  onSubmit: (data: {
    title: string;
    type: PostType;
    scope: PostScope;
    status: PostStatus;
    tags: string[];
    project?: { handle: string };
    content: {
      json: string;
      text: string;
      media: {
        id: string;
      }[];
    };
  }) => void;
}

function getContentPlaceholder(
  t: ReturnType<typeof useTranslations<'components.editor'>>,
  type: PostType,
): string {
  if (type === PostType.SHORT) return t('placeholders.content-short');
  if (type === PostType.QUESTION) return t('placeholders.content-question');
  return t('placeholders.content-long');
}

export default function PostEditor({
  type: initialType,
  scope,
  project,
  isSubmitting = false,
  onSubmit,
}: PostEditorProps) {
  const t = useTranslations('components.editor');
  const tType = useTranslations('components.post.type');
  const locale = useLocale();

  const [type, setType] = useState<PostType>(initialType);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: getContentPlaceholder(t, type),
      }),
      CharacterCount,
      CommandsExtension,
      ImageNode,
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'focus:outline-none focus:ring-0',
      },
    },
    onUpdate: ({ editor }) => {
      setIsEditorEmpty(editor.isEmpty);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const ext = editor.extensionManager.extensions.find(
      (e) => e.name === 'placeholder',
    );
    if (ext) {
      ext.options.placeholder = getContentPlaceholder(t, type);
      editor.view.dispatch(editor.state.tr);
    }
  }, [type, editor, t]);

  const handleSubmit = (status: PostStatus) => {
    if (!editor) {
      return;
    }

    if (
      status === PostStatus.PUBLISHED &&
      type !== PostType.SHORT &&
      title.trim().length === 0
    ) {
      setValidationMessage(t('validation.title-required'));
      return;
    }

    if (status === PostStatus.PUBLISHED && tags.length === 0) {
      setValidationMessage(t('validation.tags-required'));
      return;
    }

    setValidationMessage(null);

    onSubmit({
      title,
      type,
      scope,
      status,
      tags,
      project: project ? { handle: project.handle } : undefined,
      content: serialize(editor),
    });
  };

  const showTitle = type !== PostType.SHORT;
  const titlePlaceholder =
    type === PostType.QUESTION
      ? t('placeholders.title-question')
      : t('placeholders.title-long');
  const scopeLabel =
    scope === PostScope.WORKSPACE
      ? t('scope.workspace', {
          workspace: project?.name ?? t('scope.workspace-loading'),
        })
      : t('scope.public');

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 border-b px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="secondary" className="shrink-0">
            {scopeLabel}
          </Badge>
          <span className="truncate text-sm text-muted-foreground">
            {t('status.ready')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleSubmit(PostStatus.DRAFT)}
          >
            {t('actions.save-draft')}
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() => handleSubmit(PostStatus.PUBLISHED)}
          >
            {t('actions.publish')}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-12 flex flex-col gap-4">
        <Tabs
          value={type}
          onValueChange={(value) => {
            setType(value as PostType);
          }}
        >
          <TabsList>
            {Object.values(PostType).map((pt) => (
              <TabsTrigger key={pt} value={pt}>
                {tType(pt)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {showTitle && (
          <input
            className="w-full shrink-0 resize-none bg-transparent text-4xl font-bold outline-none placeholder:text-muted-foreground leading-tight"
            placeholder={titlePlaceholder}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}

        <ScrollArea className="flex-1 min-h-0 max-h-screen">
          <EditorContent editor={editor} />
          {editor && <EditorBubbleMenu editor={editor} />}
          {isEditorEmpty && type === PostType.LONG && (
            <EditorTemplates
              locale={locale}
              onSelect={(template) => {
                setTitle(template.title);
                editor?.commands.setContent(template.content);
              }}
            />
          )}
        </ScrollArea>
      </div>

      <Separator />

      <div className="px-6 py-3 flex flex-col gap-3 shrink-0">
        <TagInput tags={tags} onChange={setTags} />
        {validationMessage && (
          <p className="text-sm text-destructive">{validationMessage}</p>
        )}
      </div>
    </div>
  );
}
