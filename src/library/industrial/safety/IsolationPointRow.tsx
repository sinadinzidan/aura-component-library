import { IconLock, IconTag } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { StatusIndicator } from '../StatusIndicator';

import { ENERGY_LABEL, isolationStatus } from './isolationOrder';
import type { EnergyType, IsolationState } from './isolationOrder';

export type IsolationPointRowProps = {
  /** Position in the order of application (or of removal, in a de-isolation list). */
  step: number;
  /** Tag of the valve, breaker or blind. */
  tag: string;
  description: string;
  /** What kind of device it is: "Valve", "Breaker", "Spectacle blind". */
  device: string;
  /** The position it must be left in: "Closed", "Open", "Racked out". */
  requiredPosition: string;
  energy?: EnergyType;
  /** Number of the isolation lock on the point. */
  lock?: string;
  /** Number of the danger tag hung on it. */
  tagNo?: string;
  state: IsolationState;
  appliedBy?: string;
  /** The second person who checked the point at the equipment. */
  verifiedBy?: string;
  /** Buttons for the next step: apply, verify. */
  actions?: ReactNode;
  className?: string;
};

/**
 * One isolation point: what is isolated, the position it must be in, the lock and tag on it, and
 * who applied and who verified it. The state is a shape and words; "applied" is deliberately not
 * green, because an isolation only counts once a second person has verified it.
 */
export function IsolationPointRow({ step, tag, description, device, requiredPosition, energy, lock, tagNo, state, appliedBy, verifiedBy, actions, className }: IsolationPointRowProps) {
  const people = [appliedBy ? `Applied ${appliedBy}` : null, verifiedBy ? `verified ${verifiedBy}` : state === 'applied' ? 'awaiting second person' : null].filter(Boolean).join(' · ');
  return (
    <div data-slot="isolation-point" data-state={state} className={cn('grid w-full min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2', className)}>
      <span data-slot="isolation-step" className="pt-0.5 text-xs tabular-nums text-muted-foreground">
        {step}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-baseline gap-x-2 text-sm text-base-foreground">
          {description}
          <span className="font-mono text-xs text-muted-foreground">{tag}</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>
            {device} · <span className="font-medium text-medium-foreground">{requiredPosition}</span>
            {energy ? ` · ${ENERGY_LABEL[energy]}` : ''}
          </span>
          {lock ? (
            <span className="flex items-center gap-1">
              <IconLock aria-hidden="true" className="size-3.5" />
              <span className="sr-only">Lock</span>
              <span className="font-mono">{lock}</span>
            </span>
          ) : null}
          {tagNo ? (
            <span className="flex items-center gap-1">
              <IconTag aria-hidden="true" className="size-3.5" />
              <span className="sr-only">Tag</span>
              <span className="font-mono">{tagNo}</span>
            </span>
          ) : null}
        </span>
        {people ? (
          <span data-slot="isolation-people" className="text-xs text-muted-foreground">
            {people}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusIndicator size="sm" className="pt-0.5" {...isolationStatus(state)} />
        {actions}
      </div>
    </div>
  );
}
