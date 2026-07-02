import { cn } from '@/lib/utils';

interface CopyrightProps {
  className?: string;
}

export function Copyright({ className }: CopyrightProps) {
  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      © {new Date().getFullYear()} SKKiL. All rights reserved.
    </span>
  );
}
