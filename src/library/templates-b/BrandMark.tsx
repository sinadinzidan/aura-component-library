import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type BrandMarkProps = {
  /** Product or organisation name, shown beside the mark. */
  name: string;
  /** A quiet second word after the name: "Docs", "Status". */
  section?: string;
  /** Replaces the default initial with an icon. */
  icon?: ReactNode;
  size?: 'sm' | 'md';
  /** Hides the name and keeps it as the accessible name, for narrow rails. */
  markOnly?: boolean;
  className?: string;
};

/**
 * A placeholder product mark drawn from tokens: a square with the product's initial (or an icon)
 * and its name. Stands in for the real logo in page templates so headers, auth cards and footers
 * have something of the right size and weight in the logo position.
 */
export function BrandMark({ name, section, icon, size = 'md', markOnly = false, className }: BrandMarkProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <span data-slot="brand-mark" className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md bg-primary-background font-semibold text-primary-foreground [&>svg]:size-4',
          size === 'sm' ? 'size-6 text-xs' : 'size-8 text-sm'
        )}
      >
        {icon ?? initial}
      </span>
      {markOnly ? (
        <span className="sr-only">{name}</span>
      ) : (
        <span className={cn('min-w-0 truncate font-semibold text-base-foreground', size === 'sm' ? 'text-sm' : 'text-base')}>
          {name}
          {section ? <span className="font-normal text-muted-foreground"> {section}</span> : null}
        </span>
      )}
    </span>
  );
}
