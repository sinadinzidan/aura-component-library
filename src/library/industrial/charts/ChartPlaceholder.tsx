import { EmptyState, EmptyStateActions, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type ChartPlaceholderProps = {
  /** `loading` while the query runs, `empty` when it returned no points, `error` when it failed. */
  state: 'loading' | 'empty' | 'error';
  /** Headline for `empty` and `error`; the accessible name for `loading`. */
  title: string;
  /** What was asked for and what to try: the tag, the period, the reason. */
  description?: string;
  /** A way out, such as a button that widens the range or retries. */
  action?: ReactNode;
  /** Tailwind height matching the chart it stands in for, e.g. `h-56`. */
  heightClassName?: string;
  className?: string;
};

/**
 * Stands in for a chart at the chart's own size, so a dashboard does not jump when data arrives:
 * a skeleton while loading, and a short explanation with a way out when there is nothing to draw.
 */
export function ChartPlaceholder({ state, title, description, action, heightClassName = 'h-56', className }: ChartPlaceholderProps) {
  if (state === 'loading') {
    return (
      <div
        role="status"
        aria-label={title}
        data-slot="chart-placeholder"
        data-state="loading"
        className={cn('flex w-full gap-3', heightClassName, className)}
      >
        <div className="flex flex-col justify-between py-1">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-3 w-6" />
        </div>
        <Skeleton className="h-full min-w-0 flex-1" />
      </div>
    );
  }

  return (
    <div
      data-slot="chart-placeholder"
      data-state={state}
      className={cn('flex w-full items-center justify-center rounded-xl bg-muted-background', heightClassName, className)}
    >
      <EmptyState type={state === 'error' ? 'error-generic' : 'no-results'}>
        <EmptyStateIcon />
        <EmptyStateTitle as="p">{title}</EmptyStateTitle>
        {description ? <EmptyStateDescription>{description}</EmptyStateDescription> : null}
        {action ? <EmptyStateActions>{action}</EmptyStateActions> : null}
      </EmptyState>
    </div>
  );
}
