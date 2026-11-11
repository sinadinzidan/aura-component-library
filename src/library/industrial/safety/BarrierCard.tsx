import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { barrierStatus } from '../domains/safety';
import type { BarrierState } from '../domains/safety';
import { StatusIndicator } from '../StatusIndicator';

import { BarrierTypeMark } from './BarrierTypeMark';
import type { BarrierType } from './bowTieLayout';

export type BarrierWorkOrder = { id: string; title: string };

export type BarrierCardProps = {
  name: string;
  type: BarrierType;
  state: BarrierState;
  /** What the barrier does in the bow-tie: "Prevention" or "Mitigation". */
  role?: string;
  /** The person or function accountable for the barrier. */
  owner?: string;
  lastTest?: string;
  nextTest?: string;
  /** What the barrier must achieve to count as working, with its reference. */
  performanceStandard?: string;
  /** What is wrong with it now. Shown on a tinted strip; expected whenever the state is not healthy. */
  impairments?: readonly string[];
  /** What can defeat the barrier, and what keeps that in check. */
  escalation?: string;
  workOrders?: readonly BarrierWorkOrder[];
  actions?: ReactNode;
  className?: string;
};

const STRIP: Record<Exclude<BarrierState, 'healthy'>, string> = {
  degraded: 'bg-warning-background text-warning-foreground',
  impaired: 'bg-critical-background text-critical-foreground',
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-base-foreground">{children}</dd>
    </div>
  );
}

/**
 * Everything known about one barrier: its type, state, owner, last test, the performance standard
 * it is held to, what is wrong with it and the work orders that will put it right. The state is
 * a word and a shape; a weakened barrier always says why.
 */
export function BarrierCard({ name, type, state, role, owner, lastTest, nextTest, performanceStandard, impairments = [], escalation, workOrders = [], actions, className }: BarrierCardProps) {
  return (
    <section data-slot="barrier-card" data-state={state} aria-label={`Barrier: ${name}`} className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h4 className="text-sm font-medium text-base-foreground">{name}</h4>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <BarrierTypeMark type={type} />
            {role ? <span className="text-xs text-muted-foreground">{role}</span> : null}
          </span>
        </div>
        <StatusIndicator variant="badge" {...barrierStatus(state)} />
      </div>

      {state !== 'healthy' && impairments.length > 0 ? (
        <ul data-slot="barrier-impairments" aria-label="Impairments" className={cn('flex flex-col gap-1 rounded-lg px-3 py-2 text-sm', STRIP[state])}>
          {impairments.map((impairment) => (
            <li key={impairment}>{impairment}</li>
          ))}
        </ul>
      ) : null}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        {owner ? <Field label="Owner">{owner}</Field> : null}
        {lastTest ? (
          <Field label="Last test">
            <span className="tabular-nums">{lastTest}</span>
          </Field>
        ) : null}
        {nextTest ? (
          <Field label="Next test">
            <span className="tabular-nums">{nextTest}</span>
          </Field>
        ) : null}
        {performanceStandard ? (
          <div className="col-span-2">
            <Field label="Performance standard">{performanceStandard}</Field>
          </div>
        ) : null}
        {escalation ? (
          <div className="col-span-2">
            <Field label="Escalation factor">{escalation}</Field>
          </div>
        ) : null}
      </dl>

      {workOrders.length > 0 ? (
        <div className="flex flex-col gap-1.5 border-t border-default pt-3">
          <span className="text-xs text-muted-foreground">Linked work orders</span>
          <ul className="flex flex-col gap-1">
            {workOrders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-baseline gap-x-2 text-sm text-base-foreground">
                <span className="font-mono text-xs text-medium-foreground">{order.id}</span>
                {order.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
    </section>
  );
}
