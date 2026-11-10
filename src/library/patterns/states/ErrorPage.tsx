import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import type { ReactNode } from 'react';

import { CopyButton } from '../../actions/CopyButton';

type ErrorPageProps = {
  /** Picks the default icon and its tint. */
  type: 'error-generic' | 'not-found' | 'no-access' | 'unknown';
  /** Replaces the default icon, for example a cloud-off icon for offline. */
  icon?: ReactNode;
  /** Short technical label above the title, such as "404" or "Scheduled maintenance". */
  code?: string;
  /** What happened, in plain words. */
  title: string;
  /** Why, if known, and what the user can do. */
  description: string;
  /** Facts that help, such as a maintenance window. Rendered between the text and the actions. */
  details?: ReactNode;
  /** One primary Button, optionally a quiet second one. */
  actions?: ReactNode;
  /** An ID support can look up. Shown with a copy button under the actions. */
  reference?: string;
  /** Clipboard writer for the reference; inject a fake in tests. */
  writeText?: (text: string) => Promise<void>;
};

/**
 * A page-sized error: one icon, what happened, what to do, and one primary action. The optional
 * reference line gives support something to search for without showing a stack trace.
 */
export function ErrorPage({
  type,
  icon,
  code,
  title,
  description,
  details,
  actions,
  reference,
  writeText,
}: ErrorPageProps) {
  return (
    <EmptyState variant="full" type={type}>
      <EmptyStateIcon>{icon}</EmptyStateIcon>
      <div className="flex flex-col items-center gap-2">
        {code ? <p className="text-sm font-medium tabular-nums text-muted-foreground">{code}</p> : null}
        <EmptyStateTitle as="h2">{title}</EmptyStateTitle>
        <EmptyStateDescription>{description}</EmptyStateDescription>
      </div>
      {details}
      {actions ? <EmptyStateActions>{actions}</EmptyStateActions> : null}
      {reference ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            Reference <span className="font-medium tabular-nums text-medium-foreground">{reference}</span>
          </span>
          <CopyButton text={reference} variant="ghost" size="sm" label="Copy" writeText={writeText} />
        </div>
      ) : null}
    </EmptyState>
  );
}
