'use client';

import { Separator as SeparatorPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch',
        className,
      )}
      {...props}
    />
  );
}

interface SeparatorWithTextProps {
  children?: React.ReactNode;
}

function SeparatorWithText({ children }: SeparatorWithTextProps) {
  return (
    <div className="relative flex items-center">
      <Separator className="flex-1" />
      <span className="px-3 text-xs text-muted-foreground">{children}</span>
      <Separator className="flex-1" />
    </div>
  );
}

export { Separator, SeparatorWithText };
