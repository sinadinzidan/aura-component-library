import { formatDuration, layoutDurations } from './durationLayout';
import type { DurationPhase } from './durationLayout';

type DurationBarsProps = {
  /** Accessible name of the list: "Time in each phase". */
  label: string;
  phases: readonly DurationPhase[];
  /** The moment an unfinished phase is drawn up to. Passed in so the bars never read the clock. */
  now: number;
  /** Labels for the two ends of the shared scale, such as the first and last timestamp. */
  scaleStart?: string;
  scaleEnd?: string;
};

/**
 * Phases of one process as bars on a shared time scale, one row each: where the phase sat in the
 * whole, and how long it took in words at the end of the row. A phase that is still running is
 * hatched lighter and says "so far".
 */
export function DurationBars({ label, phases, now, scaleStart, scaleEnd }: DurationBarsProps) {
  const bars = layoutDurations(phases, now, 1.5);

  return (
    <div data-slot="duration-bars" className="flex w-full min-w-0 flex-col gap-2">
      <ul aria-label={label} className="flex w-full min-w-0 flex-col gap-2">
        {bars.map((bar) => (
          <li key={bar.id} data-ongoing={bar.ongoing || undefined} className="grid grid-cols-[7rem_minmax(0,1fr)_6rem] items-center gap-x-3 text-sm">
            <span className="text-base-foreground">{bar.label}</span>
            <span aria-hidden="true" className="relative block h-2 rounded-full bg-muted-background">
              <span
                data-slot="duration-bar"
                className={`absolute inset-y-0 rounded-full ${bar.ongoing ? 'border border-dashed border-chart-1-450 bg-chart-1-200' : 'bg-chart-1-450'}`}
                style={{ left: `${bar.offset}%`, width: `${bar.width}%` }}
              />
            </span>
            <span className="text-right tabular-nums text-muted-foreground">
              {formatDuration(bar.durationMs)}
              {bar.ongoing ? ' so far' : ''}
            </span>
          </li>
        ))}
      </ul>
      {scaleStart || scaleEnd ? (
        <div aria-hidden="true" className="grid grid-cols-[7rem_minmax(0,1fr)_6rem] gap-x-3 text-xs tabular-nums text-muted-foreground">
          <span />
          <span className="flex justify-between">
            <span>{scaleStart}</span>
            <span>{scaleEnd}</span>
          </span>
          <span />
        </div>
      ) : null}
    </div>
  );
}
