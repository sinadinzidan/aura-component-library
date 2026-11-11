import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type TableCaptionProps = {
  /** `bottom` reads as a note under the table, `top` as its title. */
  side?: 'top' | 'bottom';
  /** Names the table for assistive technology without showing the text. */
  srOnly?: boolean;
  children: ReactNode;
};

/** The table's caption: its accessible name, and optionally a visible title or source note. */
export function TableCaption({ side = 'bottom', srOnly = false, children }: TableCaptionProps) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        srOnly
          ? 'sr-only'
          : cn('px-3 text-left text-xs leading-4 text-muted-foreground', side === 'top' ? 'caption-top pb-2' : 'caption-bottom pt-3')
      )}
    >
      {children}
    </caption>
  );
}
