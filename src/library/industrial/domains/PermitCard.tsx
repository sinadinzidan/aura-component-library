import { Card } from '@cognite/aura/components/card';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { LABEL_TEXT, TONE_SURFACE } from '../status';
import { StatusIndicator } from '../StatusIndicator';

import { permitStatus } from './safety';
import type { PermitState } from './safety';

export type PermitCardProps = {
  /** Permit number, printed in monospace. */
  permitId: string;
  /** Permit type: "Hot work", "Confined space entry", "Cold work". */
  type: string;
  /** The job the permit covers. */
  title: string;
  state: PermitState;
  location: string;
  /** Tag of the equipment worked on. */
  assetTag?: string;
  /** Validity window, already formatted. */
  validFrom: string;
  validTo: string;
  /** The person holding the permit at the work site. */
  holder: string;
  /** The area authority who issued it. */
  issuer?: string;
  /** Why the permit is in this state, e.g. the reason for a suspension. Shown on a tinted strip. */
  stateNote?: string;
  /** Conditions and linked certificates, as short phrases. */
  conditions?: readonly string[];
  /** Buttons for the next step in the permit's life cycle. */
  actions?: ReactNode;
  className?: string;
};

/**
 * One permit to work: what, where, for how long, who holds it and what state it is in. The state
 * is always written out, and a suspension or other exception explains itself on the card.
 */
export function PermitCard({
  permitId,
  type,
  title,
  state,
  location,
  assetTag,
  validFrom,
  validTo,
  holder,
  issuer,
  stateNote,
  conditions = [],
  actions,
  className,
}: PermitCardProps) {
  const status = permitStatus(state);
  const fields = [
    { label: 'Location', value: location },
    { label: 'Equipment', value: assetTag, mono: true },
    { label: 'Valid from', value: validFrom },
    { label: 'Valid to', value: validTo },
    { label: 'Permit holder', value: holder },
    { label: 'Issued by', value: issuer },
  ].filter((field) => field.value !== undefined);

  return (
    <Card data-slot="permit-card" data-state={state} role="group" aria-label={`${type} permit ${permitId}, ${status.label.toLowerCase()}`} className={cn('w-full min-w-0', className)}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className={cn(LABEL_TEXT, 'flex min-w-0 items-center gap-2')}>
            <span className="truncate">{type}</span>
            <span className="font-mono text-base-foreground">{permitId}</span>
          </span>
          <StatusIndicator variant="badge" {...status} />
        </div>
        <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
      </div>

      {stateNote ? (
        <p data-slot="permit-note" className={cn('rounded-md px-3 py-2 text-xs', TONE_SURFACE[status.tone])}>
          {stateNote}
        </p>
      ) : null}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((field) => (
          <div key={field.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className={LABEL_TEXT}>{field.label}</dt>
            <dd className={cn('truncate text-sm tabular-nums text-base-foreground', field.mono ? 'font-mono' : undefined)}>{field.value}</dd>
          </div>
        ))}
      </dl>

      {conditions.length > 0 ? (
        <ul aria-label="Conditions" className="flex flex-wrap gap-1.5">
          {conditions.map((condition) => (
            <li key={condition} className="rounded-md bg-muted-background px-2 py-1 text-xs text-medium-foreground">
              {condition}
            </li>
          ))}
        </ul>
      ) : null}

      {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
    </Card>
  );
}
