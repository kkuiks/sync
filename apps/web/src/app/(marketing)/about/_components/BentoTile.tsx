import { cn } from '@/lib/utils';

import { MONO } from '../../_components/primitives';

const BENTO_TONES = {
  deepest: 'from-primary/12',
  deep: 'from-primary/10',
  mid: 'from-primary/8',
  soft: 'from-primary/7',
  softer: 'from-primary/6',
  subtle: 'from-primary/5',
  faint: 'from-primary/4',
  faintest: 'from-primary/2',
} as const;

export type BentoTone = keyof typeof BENTO_TONES;

export default function BentoTile({
  className,
  tone,
  title,
  description,
  badge,
  children,
}: {
  className?: string;
  tone: BentoTone;
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card bg-gradient-to-b to-card to-60% p-5 shadow-sm shadow-foreground/5 dark:shadow-black/40',
        BENTO_TONES[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="max-w-2xl text-lg font-semibold leading-snug">
          {title}
        </h3>
        {badge !== undefined && (
          <span
            className={cn(
              MONO,
              'shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground',
            )}
          >
            {badge}
          </span>
        )}
      </div>
      {description !== undefined && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
