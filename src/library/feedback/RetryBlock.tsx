import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Loader } from '@cognite/aura/components/loader';
import { IconRefresh } from '@cognite/aura/icons';
import { useState } from 'react';

type RetryBlockProps = {
  /** What failed, for example "Couldn't load alarms". */
  title: string;
  /** Why, if known, and what to do. */
  description?: string;
  /** Runs the failed request again. The button stays busy until the promise settles. */
  onRetry: () => Promise<unknown>;
  retryLabel?: string;
  retryingLabel?: string;
};

/**
 * The error state for a region that failed to load: says what failed and offers one retry that
 * shows progress and cannot be double-submitted. A second failure is said out loud.
 */
export function RetryBlock({
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
  retryingLabel = 'Retrying…',
}: RetryBlockProps) {
  const [retrying, setRetrying] = useState(false);
  const [failedRetries, setFailedRetries] = useState(0);

  const retry = () => {
    if (retrying) return;
    setRetrying(true);
    void onRetry().then(
      () => setRetrying(false),
      () => {
        setRetrying(false);
        setFailedRetries((count) => count + 1);
      }
    );
  };

  return (
    <EmptyState type="error-generic">
      <EmptyStateIcon />
      <EmptyStateTitle as="h3">{title}</EmptyStateTitle>
      {description ? <EmptyStateDescription>{description}</EmptyStateDescription> : null}
      <EmptyStateActions>
        <Button variant="secondary" size="sm" aria-busy={retrying || undefined} onClick={retry}>
          {retrying ? <Loader size={16} aria-hidden /> : <IconRefresh />}
          {retrying ? retryingLabel : retryLabel}
        </Button>
        <p role="status" className="text-xs text-muted-foreground">
          {failedRetries > 0 && !retrying ? `Still failing after ${failedRetries + 1} attempts.` : null}
        </p>
      </EmptyStateActions>
    </EmptyState>
  );
}
