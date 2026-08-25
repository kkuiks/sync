import { cn } from '@/lib/utils';

export const MONO = 'font-mono tracking-tight';

export function TypeTag({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        MONO,
        'rounded-sm border px-1.5 py-0.5 text-[10px] uppercase',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

/** 카드 안에서 반복되는 모노스페이스 대문자 소제목. */
export function MonoLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        MONO,
        'text-[11px] uppercase text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-3', className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 해결됨 / 채택됨을 표시하는 알약형 배지. */
export function ResolvedPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary',
        className,
      )}
    >
      <CheckIcon />
      {children}
    </span>
  );
}
