'use client';

import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { DEFAULT_CODE_LANGUAGE, baseCodeBlock, lowlight } from './code.schema';

export { DEFAULT_CODE_LANGUAGE };

const LANGUAGES: { id: string; label: string }[] = [
  { id: DEFAULT_CODE_LANGUAGE, label: 'Plain Text' },
  ...lowlight
    .listLanguages()
    .filter((id) => id !== DEFAULT_CODE_LANGUAGE)
    .sort((a, b) => a.localeCompare(b))
    .map((id) => ({ id, label: id })),
];

function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const t = useTranslations('components.editor.code-block');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const language =
    (node.attrs.language as string | null) ?? DEFAULT_CODE_LANGUAGE;
  const activeLabel = useMemo(
    () => LANGUAGES.find((lang) => lang.id === language)?.label ?? language,
    [language],
  );

  const handleCopy = () => {
    void navigator.clipboard.writeText(node.textContent).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <NodeViewWrapper className="group relative my-4 overflow-hidden rounded-lg border bg-muted/40">
      <div
        className="flex items-center justify-between border-b bg-muted/60 px-2 py-1"
        contentEditable={false}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-medium text-muted-foreground"
            >
              {activeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command>
              <CommandInput
                placeholder={t('search-placeholder')}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>{t('no-language')}</CommandEmpty>
                <CommandGroup>
                  {LANGUAGES.map((lang) => (
                    <CommandItem
                      key={lang.id}
                      value={lang.id}
                      onSelect={() => {
                        updateAttributes({ language: lang.id });
                        setOpen(false);
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          'mr-2 size-4',
                          language === lang.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {lang.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          contentEditable={false}
          onClick={handleCopy}
        >
          {copied ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
          {copied ? t('copied') : t('copy')}
        </Button>
      </div>

      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <NodeViewContent<'code'> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}

/**
 * Notion 스타일 코드 블록 (편집 모드).
 * lowlight(highlight.js) 문법 강조 + 언어 선택 드롭다운 + 복사 버튼을 제공한다.
 * 문법 강조 색상은 globals.css의 `.hljs-*` 클래스로 정의된다.
 */
export const CodeBlockNode = baseCodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});

/**
 * 읽기 전용 뷰어용 코드 블록.
 * 편집 UI(드롭다운/복사 버튼) 없이 문법 강조만 렌더링한다.
 */
export const ReadOnlyCodeBlockNode = baseCodeBlock;
