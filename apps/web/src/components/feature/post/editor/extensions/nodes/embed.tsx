import {
  ArrowSquareOutIcon,
  BrowsersIcon,
  LinkSimpleIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import {
  Node,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  nodePasteRule,
} from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { type EmbedNodeAttributes, embedNodeSchema } from './embed.schema';

export type { EmbedNodeAttributes };

type EmbedProviderId =
  | 'youtube'
  | 'vimeo'
  | 'loom'
  | 'figma'
  | 'codesandbox'
  | 'stackblitz'
  | 'codepen'
  | 'replit'
  | 'gist'
  | 'google-docs'
  | 'google-maps'
  | 'spotify'
  | 'x'
  | 'generic';

interface ResolvedEmbed {
  provider: EmbedProviderId;
  src: string;
  aspectRatio: string | null;
  height: number;
}

type EmbedFrame = Omit<ResolvedEmbed, 'provider'>;

interface EmbedProvider {
  id: EmbedProviderId;
  hosts: string[];
  resolve: (url: URL) => EmbedFrame | null;
}

const DEFAULT_EMBED_HEIGHT = 480;
const MIN_EMBED_HEIGHT = 160;
const MAX_EMBED_HEIGHT = 1200;

const VIDEO_RATIO = '16 / 9';

function video(src: string): EmbedFrame {
  return { src, aspectRatio: VIDEO_RATIO, height: DEFAULT_EMBED_HEIGHT };
}

function fixed(src: string, height: number): EmbedFrame {
  return { src, aspectRatio: null, height };
}

const providers: EmbedProvider[] = [
  {
    id: 'youtube',
    hosts: ['youtube.com', 'youtu.be', 'm.youtube.com', 'youtube-nocookie.com'],
    resolve: (url) => {
      const params = new URLSearchParams();
      const start = url.searchParams.get('t') ?? url.searchParams.get('start');
      if (start) {
        params.set('start', start.replace(/[^\d]/g, ''));
      }

      const list = url.searchParams.get('list');
      const id = url.hostname.endsWith('youtu.be')
        ? url.pathname.slice(1)
        : (url.searchParams.get('v') ??
          url.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]+)/)?.[1]);

      if (id) {
        if (list) {
          params.set('list', list);
        }

        return video(`https://www.youtube.com/embed/${id}${query(params)}`);
      }

      if (list) {
        params.set('list', list);
        return video(
          `https://www.youtube.com/embed/videoseries${query(params)}`,
        );
      }

      return null;
    },
  },
  {
    id: 'vimeo',
    hosts: ['vimeo.com', 'player.vimeo.com'],
    resolve: (url) => {
      const id = url.pathname.match(/(\d{6,})/)?.[1];
      return id ? video(`https://player.vimeo.com/video/${id}`) : null;
    },
  },
  {
    id: 'loom',
    hosts: ['loom.com'],
    resolve: (url) => {
      const id = url.pathname.match(/\/(?:share|embed|v)\/([\w-]+)/)?.[1];
      return id ? video(`https://www.loom.com/embed/${id}`) : null;
    },
  },
  {
    id: 'figma',
    hosts: ['figma.com', 'embed.figma.com'],
    resolve: (url) => {
      if (!/^\/(file|design|board|proto|slides)\//.test(url.pathname)) {
        return null;
      }

      const embedUrl = new URL(url.toString());
      embedUrl.hostname = 'embed.figma.com';
      embedUrl.searchParams.set('embed-host', 'sync');

      return video(embedUrl.toString());
    },
  },
  {
    id: 'codesandbox',
    hosts: ['codesandbox.io'],
    resolve: (url) => {
      const id = url.pathname.match(
        /^\/(?:s|embed)\/([\w-]+)|^\/p\/(?:sandbox|devbox)\/([\w-]+)/,
      );
      const sandboxId = id?.[1] ?? id?.[2];

      return sandboxId
        ? fixed(`https://codesandbox.io/embed/${sandboxId}`, 500)
        : null;
    },
  },
  {
    id: 'stackblitz',
    hosts: ['stackblitz.com'],
    resolve: (url) => {
      if (!/^\/(edit|github|fork|run)\//.test(url.pathname)) {
        return null;
      }

      const embedUrl = new URL(url.toString());
      embedUrl.searchParams.set('embed', '1');

      return fixed(embedUrl.toString(), 500);
    },
  },
  {
    id: 'codepen',
    hosts: ['codepen.io'],
    resolve: (url) => {
      const match = url.pathname.match(/^\/([\w-]+)\/(?:pen|embed)\/([\w-]+)/);
      if (!match) {
        return null;
      }

      return fixed(
        `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result`,
        400,
      );
    },
  },
  {
    id: 'replit',
    hosts: ['replit.com'],
    resolve: (url) => {
      if (!url.pathname.startsWith('/@')) {
        return null;
      }

      const embedUrl = new URL(url.toString());
      embedUrl.searchParams.set('embed', 'true');

      return fixed(embedUrl.toString(), 500);
    },
  },
  {
    id: 'gist',
    hosts: ['gist.github.com'],
    resolve: (url) => {
      const match = url.pathname.match(/^\/([\w-]+)\/([0-9a-f]+)/);
      return match
        ? fixed(`https://gist.github.com/${match[1]}/${match[2]}.pibb`, 400)
        : null;
    },
  },
  {
    id: 'google-docs',
    hosts: ['docs.google.com'],
    resolve: (url) => {
      const match = url.pathname.match(
        /^\/(document|spreadsheets|presentation|forms)\/d\/(?:e\/)?([\w-]+)/,
      );
      if (!match) {
        return null;
      }

      const [, kind, id] = match;
      const base = `https://docs.google.com/${kind}/d/${url.pathname.includes('/d/e/') ? 'e/' : ''}${id}`;

      if (kind === 'presentation') {
        return fixed(`${base}/embed`, 480);
      }
      if (kind === 'forms') {
        return fixed(`${base}/viewform?embedded=true`, 720);
      }

      return fixed(`${base}/preview`, 720);
    },
  },
  {
    id: 'google-maps',
    hosts: ['google.com', 'maps.google.com', 'maps.app.goo.gl'],
    resolve: (url) => {
      if (url.pathname.startsWith('/maps/embed')) {
        return fixed(url.toString(), 400);
      }

      if (
        !url.pathname.startsWith('/maps') &&
        url.hostname !== 'maps.google.com'
      ) {
        return null;
      }

      const place = url.pathname.match(/\/place\/([^/]+)/)?.[1];
      const coordinates = url.pathname.match(/@(-?[\d.]+),(-?[\d.]+)/);
      const query =
        (place ? decodeURIComponent(place).replace(/\+/g, ' ') : null) ??
        (coordinates ? `${coordinates[1]},${coordinates[2]}` : null) ??
        url.searchParams.get('q');

      return query
        ? fixed(
            `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`,
            400,
          )
        : null;
    },
  },
  {
    id: 'spotify',
    hosts: ['open.spotify.com'],
    resolve: (url) => {
      const match = url.pathname.match(
        /\/(track|album|playlist|episode|show|artist)\/(\w+)/,
      );
      if (!match) {
        return null;
      }

      const [, kind, id] = match;
      const compact = kind === 'track' || kind === 'episode';

      return fixed(
        `https://open.spotify.com/embed/${kind}/${id}`,
        compact ? 152 : 352,
      );
    },
  },
  {
    id: 'x',
    hosts: ['x.com', 'twitter.com', 'mobile.twitter.com'],
    resolve: (url) => {
      const id = url.pathname.match(/\/status(?:es)?\/(\d+)/)?.[1];
      return id
        ? fixed(`https://platform.twitter.com/embed/Tweet.html?id=${id}`, 550)
        : null;
    },
  },
];

function query(params: URLSearchParams): string {
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function parseUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );

    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

function resolveEmbed(input: string): ResolvedEmbed | null {
  const url = parseUrl(input);
  if (!url) {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  for (const provider of providers) {
    if (!provider.hosts.includes(host)) {
      continue;
    }

    const frame = provider.resolve(url);
    if (frame) {
      return { provider: provider.id, ...frame };
    }
  }

  return {
    provider: 'generic',
    src: url.toString(),
    aspectRatio: null,
    height: DEFAULT_EMBED_HEIGHT,
  };
}

function findPastedEmbedUrl(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return null;
  }

  const resolved = resolveEmbed(trimmed);
  return resolved && resolved.provider !== 'generic' ? trimmed : null;
}

function clampEmbedHeight(height: number): number {
  return Math.min(
    MAX_EMBED_HEIGHT,
    Math.max(MIN_EMBED_HEIGHT, Math.round(height)),
  );
}

const IFRAME_SANDBOX =
  'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation';

const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture';

export const EmbedNode = Node.create({
  ...embedNodeSchema,
  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeComponent);
  },
  addPasteRules() {
    return [
      nodePasteRule({
        find: (text) => {
          const url = findPastedEmbedUrl(text);
          return url ? [{ index: 0, text: url }] : null;
        },
        type: this.type,
        getAttributes: (match) => ({ url: match[0], height: null }),
      }),
    ];
  },
});

export const ReadOnlyEmbedNode = Node.create({
  ...embedNodeSchema,
  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyEmbedNodeComponent);
  },
});

function getEmbedFrameStyle(
  resolved: ResolvedEmbed | null,
  height: number | null,
) {
  if (!resolved) {
    return { height: height ?? DEFAULT_EMBED_HEIGHT };
  }

  if (height) {
    return { height };
  }

  return resolved.aspectRatio
    ? { aspectRatio: resolved.aspectRatio }
    : { height: resolved.height };
}

function EmbedFrame({
  resolved,
  title,
  className,
}: {
  resolved: ResolvedEmbed;
  title: string;
  className?: string;
}) {
  return (
    <iframe
      src={resolved.src}
      title={title}
      loading="lazy"
      sandbox={IFRAME_SANDBOX}
      allow={IFRAME_ALLOW}
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className={cn('size-full border-0 bg-muted', className)}
    />
  );
}

function EmbedNodeComponent({
  node,
  selected,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const { url, height } = node.attrs as EmbedNodeAttributes;
  const t = useTranslations('components.editor.embed');

  const [draft, setDraft] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);

  const resolved = url ? resolveEmbed(url) : null;
  const frameStyle = getEmbedFrameStyle(resolved, height);

  const submit = () => {
    if (!resolveEmbed(draft)) {
      setIsInvalid(true);
      return;
    }

    setIsInvalid(false);
    updateAttributes({ url: draft.trim(), height: null });
  };

  const startResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const startY = event.clientY;
      const startHeight =
        frameRef.current?.offsetHeight ?? DEFAULT_EMBED_HEIGHT;

      setIsResizing(true);

      const handleMove = (moveEvent: PointerEvent) => {
        updateAttributes({
          height: clampEmbedHeight(startHeight + moveEvent.clientY - startY),
        });
      };

      const handleUp = () => {
        setIsResizing(false);
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [updateAttributes],
  );

  if (!resolved) {
    return (
      <NodeViewWrapper>
        <div
          className={cn(
            'my-2 flex flex-col gap-2 rounded-lg border border-dashed bg-muted/40 p-4',
            selected && 'border-primary',
          )}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BrowsersIcon className="size-4" />
            <span>{t('placeholders.description')}</span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={draft}
              placeholder={t('placeholders.url')}
              onChange={(event) => {
                setDraft(event.target.value);
                setIsInvalid(false);
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                event.stopPropagation();

                if (event.key === 'Enter') {
                  event.preventDefault();
                  submit();
                }

                if (event.key === 'Escape') {
                  event.preventDefault();
                  deleteNode();
                }
              }}
              aria-invalid={isInvalid}
            />

            <Button size="sm" onClick={submit} disabled={draft.trim() === ''}>
              <LinkSimpleIcon className="size-4" />
              {t('actions.submit')}
            </Button>
          </div>

          {isInvalid && (
            <span className="text-xs text-destructive">
              {t('errors.invalid-url')}
            </span>
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div
        className={cn(
          'group relative my-2 rounded-lg border transition-colors',
          selected
            ? 'border-primary'
            : 'border-transparent hover:border-border',
        )}
      >
        <div className="absolute -top-3 right-2 z-10 flex items-center gap-1 rounded-md border bg-popover p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <span className="px-1 text-xs text-muted-foreground">
            {t(`providers.${resolved.provider}`)}
          </span>

          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('actions.open')}
            onClick={() => window.open(url ?? '', '_blank', 'noopener')}
          >
            <ArrowSquareOutIcon className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('actions.replace')}
            onClick={() => {
              setDraft(url ?? '');
              updateAttributes({ url: null, height: null });
            }}
          >
            <PencilSimpleIcon className="size-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('actions.remove')}
            onClick={deleteNode}
          >
            <TrashIcon className="size-3.5" />
          </Button>
        </div>

        <div
          ref={frameRef}
          className="relative w-full overflow-hidden rounded-lg"
          style={frameStyle}
        >
          <EmbedFrame
            resolved={resolved}
            title={t('label')}
            className={cn((!selected || isResizing) && 'pointer-events-none')}
          />

          {!selected && (
            <button
              type="button"
              aria-label={t('actions.select')}
              className="absolute inset-0 cursor-pointer"
              onClick={() => {
                const position = getPos();
                if (position !== undefined) {
                  editor.commands.setNodeSelection(position);
                }
              }}
            />
          )}
        </div>

        <div
          role="separator"
          aria-orientation="horizontal"
          className={cn(
            'absolute inset-x-0 -bottom-1 mx-auto h-2 w-24 cursor-ns-resize rounded-full bg-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100',
            isResizing && 'opacity-100',
          )}
          onPointerDown={startResize}
        />
      </div>
    </NodeViewWrapper>
  );
}

function ReadOnlyEmbedNodeComponent({ node }: NodeViewProps) {
  const { url, height } = node.attrs as EmbedNodeAttributes;
  const t = useTranslations('components.editor.embed');

  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolved = url ? resolveEmbed(url) : null;
  const frameStyle = getEmbedFrameStyle(resolved, height);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  if (!resolved) {
    return <NodeViewWrapper />;
  }

  return (
    <NodeViewWrapper>
      <div
        ref={containerRef}
        className="relative my-2 w-full overflow-hidden rounded-lg border"
        style={frameStyle}
      >
        {isVisible ? (
          <EmbedFrame resolved={resolved} title={t('label')} />
        ) : (
          <div className="size-full bg-muted" />
        )}
      </div>
    </NodeViewWrapper>
  );
}
