'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { CheckIcon, MONO } from '../../_components/primitives';
import { useReveal } from './Reveal';

const TYPE_MS = 32;

const TYPE_JITTER_MS = 13;

const BLOCK_PAUSE_MS = 440;

const SLASH_MS = 360;

const MENU_STEP_MS = 250;

const MENU_PICK_MS = 560;

const HOLD_MS = 2800;

const FADE_MS = 520;

const MENU_CLOSED = -1;

export interface CodeToken {
  text: string;
  token?: string;
}

export type EditorScriptStep =
  | { kind: 'heading' | 'paragraph' | 'todo'; text: string }
  | { kind: 'code'; language: string; tokens: CodeToken[] }
  | { kind: 'menu'; pick: number };

export interface EditorCommand {
  key: string;
  label: string;
}

interface Cursor {
  step: number;
  chars: number;
  highlight: number;
  fading: boolean;
}

const START: Cursor = {
  step: 0,
  chars: 0,
  highlight: MENU_CLOSED,
  fading: false,
};

function stepText(step: EditorScriptStep) {
  if (step.kind === 'menu') {
    return '';
  }

  if (step.kind === 'code') {
    return step.tokens.map((token) => token.text).join('');
  }

  return step.text;
}

function sliceTokens(tokens: CodeToken[], length: number) {
  let remaining = length;

  return tokens.reduce<CodeToken[]>((sliced, token) => {
    if (remaining <= 0) {
      return sliced;
    }

    sliced.push({ ...token, text: token.text.slice(0, remaining) });
    remaining -= token.text.length;

    return sliced;
  }, []);
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5 text-muted-foreground/60"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function Caret() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-[0.15em] rounded-full bg-primary motion-safe:animate-pulse" />
  );
}

function CommandIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    heading: <path d="M6 5v14M18 5v14M6 12h12" />,
    code: <path d="m9 8-5 4 5 4M15 8l5 4-5 4" />,
    todo: <path d="M4 6h3v3H4zM4 15h3v3H4zM11 7.5h9M11 16.5h9" />,
    quote: <path d="M9 7H5v5h4v5H5M19 7h-4v5h4v5h-4" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className="size-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/** 에디터 타일 안에서 글이 실제로 써지는 모습을 재생하는 가짜 에디터. */
export default function EditorTypingPreview({
  script,
  commands,
}: {
  script: EditorScriptStep[];
  commands: EditorCommand[];
}) {
  const { playing, reducedMotion } = useReveal();
  const [cursor, setCursor] = useState<Cursor>(START);

  const codeRef = useRef<HTMLPreElement>(null);

  const isPlaying = playing && !reducedMotion;

  useEffect(() => {
    const code = codeRef.current;
    if (code === null) {
      return;
    }

    if (script[cursor.step]?.kind === 'code') {
      code.scrollLeft = code.scrollWidth;

      return;
    }

    code.scrollTo({
      left: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  });

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const current = script[cursor.step];
    const advance: Cursor = { ...START, step: cursor.step + 1 };

    let delay: number;
    let next: Cursor;

    if (cursor.fading) {
      delay = FADE_MS;
      next = START;
    } else if (current === undefined) {
      delay = HOLD_MS;
      next = { ...cursor, fading: true };
    } else if (current.kind === 'menu') {
      if (cursor.highlight === MENU_CLOSED) {
        delay = SLASH_MS;
        next = { ...cursor, highlight: 0 };
      } else if (cursor.highlight < current.pick) {
        delay = MENU_STEP_MS;
        next = { ...cursor, highlight: cursor.highlight + 1 };
      } else {
        delay = MENU_PICK_MS;
        next = advance;
      }
    } else if (cursor.chars < stepText(current).length) {
      delay =
        TYPE_MS +
        (stepText(current).charCodeAt(cursor.chars) % 4) * TYPE_JITTER_MS;
      next = { ...cursor, chars: cursor.chars + 1 };
    } else {
      delay = BLOCK_PAUSE_MS;
      next = advance;
    }

    const timeout = window.setTimeout(() => setCursor(next), delay);

    return () => window.clearTimeout(timeout);
  }, [cursor, isPlaying, script]);

  const settled = reducedMotion ? { ...START, step: script.length } : cursor;

  const visibleSteps = script.slice(0, settled.step + 1);

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col" aria-hidden="true">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm shadow-foreground/5 dark:shadow-black/30">
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-3 py-1.5">
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
        </div>

        <div
          className="min-h-40 flex-1 overflow-hidden px-3.5 py-3 transition-opacity duration-500 lg:min-h-0"
          style={{ opacity: settled.fading ? 0 : 1 }}
        >
          <div className="flex flex-col gap-2">
            {visibleSteps.map((step, index) => {
              const isActive = index === settled.step;
              const caret = isActive ? <Caret /> : null;

              if (step.kind === 'menu') {
                if (!isActive) {
                  return null;
                }

                return (
                  <div key={index} className="relative">
                    <p className={cn(MONO, 'text-xs text-muted-foreground')}>
                      /{caret}
                    </p>

                    {isActive && settled.highlight !== MENU_CLOSED && (
                      <div className="absolute left-0 top-6 z-10 w-44 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 rounded-xl border border-border bg-popover p-1 shadow-xl shadow-foreground/10 duration-200 dark:shadow-black/50">
                        {commands.map((command, commandIndex) => (
                          <div
                            key={command.key}
                            className={cn(
                              'flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition-colors duration-200',
                              commandIndex === settled.highlight
                                ? 'bg-primary/10 font-medium text-primary'
                                : 'text-muted-foreground',
                            )}
                          >
                            <CommandIcon name={command.key} />
                            {command.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (step.kind === 'code') {
                const tokens = isActive
                  ? sliceTokens(step.tokens, settled.chars)
                  : step.tokens;

                return (
                  <div
                    key={index}
                    className="animate-in fade-in-0 slide-in-from-bottom-1 overflow-hidden rounded-lg border border-border bg-muted/40 duration-300"
                  >
                    <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {step.language}
                      </span>
                      <CopyIcon />
                    </div>
                    <pre
                      ref={codeRef}
                      className={cn(
                        MONO,
                        'no-scrollbar overflow-x-auto px-3 py-2.5 text-[0.72rem] leading-relaxed',
                      )}
                    >
                      <code>
                        {tokens.map((token, tokenIndex) => (
                          <span
                            key={tokenIndex}
                            className={
                              token.token === undefined
                                ? undefined
                                : `hljs-${token.token}`
                            }
                          >
                            {token.text}
                          </span>
                        ))}
                        {caret}
                      </code>
                    </pre>
                  </div>
                );
              }

              const text = isActive
                ? step.text.slice(0, settled.chars)
                : step.text;

              if (step.kind === 'heading') {
                return (
                  <p
                    key={index}
                    className="text-sm font-semibold tracking-tight"
                  >
                    {text}
                    {caret}
                  </p>
                );
              }

              if (step.kind === 'paragraph') {
                return (
                  <p
                    key={index}
                    className="text-xs leading-relaxed text-muted-foreground"
                  >
                    {text}
                    {caret}
                  </p>
                );
              }

              const isChecked = settled.step > index;

              return (
                <div
                  key={index}
                  className="flex animate-in items-start gap-2 fade-in-0 slide-in-from-bottom-1 text-xs duration-300"
                >
                  <span
                    className={cn(
                      'mt-px flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors duration-300',
                      isChecked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40',
                    )}
                  >
                    {isChecked && (
                      <CheckIcon className="size-2 animate-in zoom-in-50 duration-200" />
                    )}
                  </span>
                  <span
                    className={cn(
                      'transition-colors duration-300',
                      isChecked && 'text-muted-foreground line-through',
                    )}
                  >
                    {text}
                    {caret}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
