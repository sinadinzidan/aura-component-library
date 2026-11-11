import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { IconChip } from '../IconChip';
import { Panel } from '../Panel';
import { StatusPill } from '../StatusPill';
import { TagId } from '../TagId';
import { cx } from '../tones';

import { permitStatus, type PermitState } from './permits';

type PermitCardProps = {
  /** Permit number, e.g. `PTW-2291`. */
  number: string;
  /** The job the permit covers. */
  title: string;
  /** Kind of work: hot work, confined space entry, … */
  kind: string;
  icon: ReactNode;
  state: PermitState;
  location: string;
  /** Tag of the equipment worked on. */
  tag?: string;
  holder: string;
  validity: { from: string; to: string; elapsed: number; remaining: string };
  /** Controls the permit depends on, shown as short chips. */
  controls?: readonly string[];
  /** One line explaining a suspended or expired permit. */
  reason?: string;
  actions?: ReactNode;
  className?: string;
};

/**
 * A permit to work as a card: what the job is, where, who holds it, how much of its validity
 * is left and which controls it rests on. The panel takes the tone of the permit state, so a
 * look that fills panels by state (signal, poster) shows a suspended permit from across a room.
 */
export function PermitCard({ number, title, kind, icon, state, location, tag, holder, validity, controls = [], reason, actions, className }: PermitCardProps) {
  const look = useLook();
  const status = permitStatus(state);
  const elapsed = Math.round(Math.min(1, Math.max(0, validity.elapsed)) * 100);
  const filled = look === 'signal';

  return (
    <Panel tone={filled ? status.tone : 'neutral'} className={cx('h-full', className)} footer={actions}>
      <div className="flex flex-1 flex-col gap-4" data-state={state}>
        <div className="flex items-start gap-3">
          <IconChip tone={status.tone}>{icon}</IconChip>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-(--kit-text-2)">
              {kind} · <span className="tabular-nums">{number}</span>
            </p>
            <p className="text-base leading-snug font-semibold text-(--kit-text)">{title}</p>
          </div>
          <StatusPill tone={status.tone} variant={filled ? 'outline' : 'soft'}>
            {status.label}
          </StatusPill>
        </div>
        {reason ? <p className="text-sm text-(--kit-text-2)">{reason}</p> : null}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="min-w-0">
            <dt className="text-xs text-(--kit-text-3)">Location</dt>
            <dd className="font-medium text-(--kit-text)">{location}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-(--kit-text-3)">Permit holder</dt>
            <dd className="font-medium text-(--kit-text)">{holder}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-(--kit-text) tabular-nums">
              {validity.from} – {validity.to}
            </span>
            <span className="text-(--kit-text-2)">{validity.remaining}</span>
          </div>
          <div
            role="progressbar"
            aria-label={`Validity of ${number}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={elapsed}
            data-tone={status.tone}
            className="h-2 overflow-hidden bg-(--kit-track)"
            style={{ borderRadius: 'var(--kit-track-radius)' }}
          >
            <div className="h-full" style={{ width: `${elapsed}%`, background: filled ? 'currentColor' : 'var(--t-line)' }} />
          </div>
        </div>
        {controls.length > 0 || tag ? (
          <ul className="flex flex-wrap items-center gap-1.5" aria-label="Controls">
            {tag ? (
              <li>
                <TagId variant="chip">{tag}</TagId>
              </li>
            ) : null}
            {controls.map((control) => (
              <li key={control} className="px-2 py-0.5 text-xs font-medium text-(--kit-text-2)" style={{ borderRadius: 'var(--kit-radius-sm)', boxShadow: 'inset 0 0 0 1px var(--kit-rule-strong)' }}>
                {control}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Panel>
  );
}
