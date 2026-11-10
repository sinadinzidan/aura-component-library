import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import type { ReactNode } from 'react';

import { RetryBlock } from '../../feedback/RetryBlock';

/** What a region is showing in place of, or as, its content. */
export type RegionStatus = 'loading' | 'empty' | 'error' | 'no-access' | 'ready';

export type StateMessage = {
  /** Names the situation: "No work orders yet". */
  title: string;
  /** What will appear here, or what to do next. */
  description?: string;
  /** The one action that moves things forward, usually a Button. */
  action?: ReactNode;
};

type StateBlockProps = {
  status: RegionStatus;
  /** The real content, shown when `status` is `ready`. */
  children: ReactNode;
  /** A skeleton that mirrors the layout of the real content. */
  loading: ReactNode;
  empty: StateMessage;
  /** `new-object` when nothing exists yet, `no-results` when a search or filter removed everything. */
  emptyType?: 'new-object' | 'no-results';
  error: { title: string; description?: string; onRetry: () => Promise<unknown> };
  noAccess: StateMessage;
};

/**
 * One switch for everything a region can show: its content, a skeleton while it loads, and an
 * empty, error or no-access state in the same space. Keeping the four in one place means a list
 * never ends up with a loader and no error state, and the region keeps its size between them.
 */
export function StateBlock({
  status,
  children,
  loading,
  empty,
  emptyType = 'new-object',
  error,
  noAccess,
}: StateBlockProps) {
  if (status === 'ready') return <>{children}</>;

  if (status === 'loading') {
    return (
      <div aria-busy="true" className="w-full">
        {loading}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex w-full flex-1 items-center justify-center py-8">
        <RetryBlock title={error.title} description={error.description} onRetry={error.onRetry} />
      </div>
    );
  }

  const message = status === 'empty' ? empty : noAccess;

  return (
    <div className="flex w-full flex-1 items-center justify-center py-8">
      <EmptyState type={status === 'empty' ? emptyType : 'no-access'}>
        <EmptyStateIcon />
        <EmptyStateTitle as="h3">{message.title}</EmptyStateTitle>
        {message.description ? <EmptyStateDescription>{message.description}</EmptyStateDescription> : null}
        {message.action ? <EmptyStateActions>{message.action}</EmptyStateActions> : null}
      </EmptyState>
    </div>
  );
}
