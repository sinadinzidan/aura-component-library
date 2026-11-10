import { Button } from '@cognite/aura/components/button';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../display/PersonAvatar';

import { isOpenApproval } from './approvalState';
import type { ApprovalState } from './approvalState';
import { ApprovalStateBadge } from './ApprovalStateBadge';

export type ApprovalRequester = { id: string; name: string; initials?: string; role?: string };

export type ApprovalCardProps = {
  /** What is asked for: "Raise high alarm limit on 23-TT-92532". */
  title: string;
  /** Kind of request, above the title: "Alarm limit change". */
  kind?: string;
  /** Request number, in monospace. */
  reference?: string;
  requester: ApprovalRequester;
  /** When it was requested, already formatted. */
  requestedAt: string;
  /** Why the requester wants it. */
  reason?: ReactNode;
  state: ApprovalState;
  /** Who decided and when, shown once the request is no longer pending. */
  decision?: ReactNode;
  /** The substance of the request: a before and after, a list of fields. */
  children?: ReactNode;
  /** Start of the footer: time left, a delegation note. */
  footerNote?: ReactNode;
  /** The decision buttons show only while the request is pending and a handler is given. */
  onApprove?: () => void;
  onReject?: () => void;
  onRequestChanges?: () => void;
};

/**
 * One approval request, complete enough to decide on without opening anything: who asks, for
 * what, why, and the buttons to answer. Once decided, the buttons give way to who decided.
 */
export function ApprovalCard({
  title,
  kind,
  reference,
  requester,
  requestedAt,
  reason,
  state,
  decision,
  children,
  footerNote,
  onApprove,
  onReject,
  onRequestChanges,
}: ApprovalCardProps) {
  const pending = isOpenApproval(state);
  const hasActions = pending && (onApprove || onReject || onRequestChanges);
  const footerStart = pending ? footerNote : (decision ?? footerNote);

  return (
    <article data-slot="approval-card" data-state={state} aria-label={title} className="flex w-full min-w-0 flex-col gap-3 rounded-xl border border-default bg-base-background p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          {kind || reference ? (
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              {kind}
              {reference ? <span className="font-mono">{reference}</span> : null}
            </p>
          ) : null}
          <h3 className="text-base font-semibold text-base-foreground">{title}</h3>
        </div>
        <span className="shrink-0">
          <ApprovalStateBadge state={state} />
        </span>
      </header>

      <div className="flex items-center gap-2">
        <PersonAvatar name={requester.name} initials={requester.initials} colorKey={requester.id} sizes="xsm" />
        <p className="min-w-0 text-sm text-muted-foreground">
          <span className="font-medium text-base-foreground">{requester.name}</span>
          {requester.role ? ` · ${requester.role}` : ''} · requested {requestedAt}
        </p>
      </div>

      {reason ? (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Reason</span>
          <p className="text-sm text-base-foreground">{reason}</p>
        </div>
      ) : null}

      {children}

      {footerStart || hasActions ? (
        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="min-w-0 text-xs text-muted-foreground">{footerStart}</span>
          {hasActions ? (
            <span className="ml-auto flex flex-wrap items-center gap-2">
              {onRequestChanges ? (
                <Button variant="ghost" size="sm" onClick={onRequestChanges}>
                  Request changes
                </Button>
              ) : null}
              {onReject ? (
                <Button variant="secondary" size="sm" onClick={onReject}>
                  Reject
                </Button>
              ) : null}
              {onApprove ? (
                <Button size="sm" onClick={onApprove}>
                  Approve
                </Button>
              ) : null}
            </span>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}
