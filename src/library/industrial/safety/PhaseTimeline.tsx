import { IconCheck, IconPlayerPause } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

export type PhaseState = 'done' | 'current' | 'held' | 'upcoming';

export type TimelinePhase = {
  id: string;
  label: string;
  /** Expected duration from the recipe or the golden batch. */
  expected: number;
  /** Duration so far; `null` before the phase has started. */
  actual: number | null;
  state: PhaseState;
};

export type PhaseTimelineProps = {
  /** What runs through the phases, e.g. "Phases of batch B-2603-118". */
  label: string;
  phases: readonly TimelinePhase[];
  /** Unit of the durations. */
  unit?: string;
  className?: string;
};

const STATE_WORD: Record<PhaseState, string> = { done: 'Done', current: 'Current', held: 'On hold', upcoming: 'Not started' };

const FILL: Record<PhaseState, string> = {
  done: 'bg-chart-1-300',
  current: 'bg-chart-1-450',
  held: 'bg-chart-warning-450',
  upcoming: 'bg-transparent',
};

/**
 * The phases of a batch on one line, each as wide as it is expected to take: finished phases are
 * filled, the current one fills as it runs, phases to come are outlined. Under each sits its
 * time against the expected time, and any overrun in words.
 */
export function PhaseTimeline({ label, phases, unit = 'min', className }: PhaseTimelineProps) {
  return (
    <ol
      data-slot="phase-timeline"
      aria-label={label}
      className={cn('grid w-full min-w-0 gap-x-1', className)}
      style={{ gridTemplateColumns: phases.map((phase) => `minmax(0, ${Math.max(phase.expected, 1)}fr)`).join(' ') }}
    >
      {phases.map((phase) => {
        const started = phase.actual !== null;
        const progress = phase.state === 'done' ? 1 : started && phase.expected > 0 ? Math.min((phase.actual ?? 0) / phase.expected, 1) : 0;
        const overrun = started ? (phase.actual ?? 0) - phase.expected : 0;
        const active = phase.state === 'current' || phase.state === 'held';
        return (
          <li key={phase.id} data-slot="phase" data-state={phase.state} aria-current={active ? 'step' : undefined} className="flex min-w-0 flex-col gap-1.5">
            <span aria-hidden="true" className={cn('block h-2 overflow-hidden rounded-full', phase.state === 'upcoming' ? 'border border-dashed border-emphasized' : 'bg-muted-background')}>
              <span data-slot="phase-fill" className={cn('block h-full rounded-full', FILL[phase.state])} style={{ width: `${Math.round(progress * 100)}%` }} />
            </span>
            <span className={cn('flex items-center gap-1 text-xs', active ? 'font-medium text-base-foreground' : phase.state === 'done' ? 'text-base-foreground' : 'text-muted-foreground')}>
              {phase.state === 'done' ? <IconCheck aria-hidden="true" className="size-3 shrink-0" /> : null}
              {phase.state === 'held' ? <IconPlayerPause aria-hidden="true" className="size-3 shrink-0 text-warning-foreground-strong" /> : null}
              <span className="truncate">{phase.label}</span>
              <span className="sr-only">, {STATE_WORD[phase.state]}</span>
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {started ? `${formatValue(phase.actual)} of ${formatValue(phase.expected)}` : formatValue(phase.expected)}
              <span className="sr-only"> {unit}</span>
            </span>
            {active ? (
              <span data-slot="phase-state" className={cn('text-xs font-medium', phase.state === 'held' ? 'text-warning-foreground-strong' : 'text-base-foreground')}>
                {STATE_WORD[phase.state]}
              </span>
            ) : null}
            {overrun > 0 ? (
              <span data-slot="phase-overrun" className="text-xs tabular-nums text-warning-foreground-strong">
                {formatValue(overrun)} {unit} over
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
