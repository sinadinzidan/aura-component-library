import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type TableRowActionProps = {
  /** Makes the row a link. Leave out and pass `onClick` for a button. */
  href?: string;
  onClick?: () => void;
  /** The visible text, usually the row's identifier or title. It is also the name of the row's action. */
  children: ReactNode;
  className?: string;
};

const ACTION =
  'rounded-sm text-base-foreground outline-none after:absolute after:inset-0.5 after:rounded-md group-hover/row:underline focus-visible:after:shadow-focus-ring';

/**
 * The link or button that makes a whole `TableRow interactive`. It sits in the row's main cell and
 * stretches over the row, so a pointer can click anywhere while the keyboard and screen readers
 * get one ordinary link or button. Checkboxes and `actions` cells stay clickable above it.
 */
export function TableRowAction({ href, onClick, children, className }: TableRowActionProps) {
  if (href !== undefined) {
    return (
      <a data-slot="table-row-action" href={href} onClick={onClick} className={cn(ACTION, className)}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" data-slot="table-row-action" onClick={onClick} className={cn(ACTION, 'cursor-pointer text-left', className)}>
      {children}
    </button>
  );
}
