import { cn } from '../../../lib/utils';
import { LABEL_TEXT, TONE_ZONE_BG } from '../status';
import { StatusIndicator } from '../StatusIndicator';

import { barrierStatus, countBarrierStates, worstBarrierState } from './safety';
import type { BarrierState } from './safety';

export type Barrier = {
  id: string;
  name: string;
  state: BarrierState;
  /** What the barrier does: "Prevention", "Detection", "Mitigation". */
  kind?: string;
  /** Why it is degraded or impaired, and what compensates. */
  note?: string;
};

export type BarrierStatusProps = {
  /** The hazard or area the barriers protect, e.g. "Loss of containment, gas compression". */
  title: string;
  barriers: readonly Barrier[];
  /** One segment per barrier above the list, so the share of weakened barriers shows at a glance. */
  showStrip?: boolean;
  className?: string;
};

const STRIP: Record<BarrierState, string> = {
  healthy: 'bg-chart-neutral-300',
  degraded: TONE_ZONE_BG.warning,
  impaired: TONE_ZONE_BG.critical,
};

const STATES: readonly BarrierState[] = ['healthy', 'degraded', 'impaired'];

/**
 * The safety barriers of one hazard and the state of each: healthy, degraded or impaired, always
 * as a word next to its shape. The header carries the worst state and a count per state.
 */
export function BarrierStatus({ title, barriers, showStrip = true, className }: BarrierStatusProps) {
  const states = barriers.map((barrier) => barrier.state);
  const counts = countBarrierStates(states);
  const summary = STATES.filter((state) => counts[state] > 0)
    .map((state) => `${counts[state]} ${state}`)
    .join(' · ');

  return (
    <section data-slot="barrier-status" data-state={worstBarrierState(states)} aria-label={title} className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
          <span data-slot="barrier-summary" className={cn(LABEL_TEXT, 'tabular-nums')}>
            {summary}
          </span>
        </div>
        <StatusIndicator variant="badge" {...barrierStatus(worstBarrierState(states))} />
      </div>

      {showStrip ? (
        <div aria-hidden="true" className="flex h-1.5 gap-0.5">
          {barriers.map((barrier) => (
            <span key={barrier.id} data-slot="barrier-segment" className={cn('flex-1 rounded-full', STRIP[barrier.state])} />
          ))}
        </div>
      ) : null}

      <ul className="flex flex-col gap-3">
        {barriers.map((barrier) => (
          <li key={barrier.id} data-state={barrier.state} className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm text-base-foreground">
                {barrier.name}
                {barrier.kind ? <span className="pl-2 text-xs text-muted-foreground">{barrier.kind}</span> : null}
              </span>
              {barrier.note ? <span className={LABEL_TEXT}>{barrier.note}</span> : null}
            </div>
            <StatusIndicator size="sm" className="pt-0.5" {...barrierStatus(barrier.state)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
