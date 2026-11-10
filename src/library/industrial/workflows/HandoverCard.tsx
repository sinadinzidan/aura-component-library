import { Card } from '@cognite/aura/components/card';
import { IconArrowNarrowRight } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../display/PersonAvatar';
import type { StatusDescriptor } from '../status';
import { StatusIndicator } from '../StatusIndicator';

export type HandoverParty = { name: string; initials?: string; shift: string };

export type HandoverState = 'draft' | 'awaiting' | 'accepted';

export type HandoverCardProps = {
  outgoing: HandoverParty;
  incoming: HandoverParty;
  state: HandoverState;
  /** When the incoming shift accepted, e.g. "12 Mar, 14:02". */
  acceptedAt?: string;
  /** The note itself: summary, open items, actions. */
  children?: ReactNode;
  className?: string;
};

const STATE: Record<HandoverState, StatusDescriptor> = {
  draft: { tone: 'neutral', label: 'Draft', shape: 'ring' },
  awaiting: { tone: 'info', label: 'Awaiting acceptance', shape: 'ring' },
  accepted: { tone: 'success', label: 'Accepted', shape: 'dot' },
};

function Party({ party, role }: { party: HandoverParty; role: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <PersonAvatar name={party.name} initials={party.initials} sizes="xsm" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-base-foreground">{party.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {role} · {party.shift}
        </span>
      </div>
    </div>
  );
}

/**
 * A shift handover: who hands over to whom, whether the incoming shift has accepted, and the note
 * between them. The arrow is the direction of responsibility.
 */
export function HandoverCard({ outgoing, incoming, state, acceptedAt, children, className }: HandoverCardProps) {
  return (
    <Card data-slot="handover-card" data-state={state} className={className}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-3">
          <Party party={outgoing} role="Outgoing" />
          <IconArrowNarrowRight aria-label="hands over to" role="img" className="size-5 shrink-0 text-muted-foreground" />
          <Party party={incoming} role="Incoming" />
        </div>
        <StatusIndicator variant="badge" {...STATE[state]} detail={state === 'accepted' ? acceptedAt : undefined} />
      </div>
      {children}
    </Card>
  );
}
