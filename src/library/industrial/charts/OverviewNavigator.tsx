import { Slider } from '@cognite/aura/components/slider';

import { cn } from '../../../lib/utils';
import { Sparkline } from '../Sparkline';

import { formatRange } from './timeAxis';
import type { TimeWindow } from './timeWindow';
import { timeFraction } from './trendData';

export type OverviewNavigatorProps = {
  /** Values of the whole period, oldest first, evenly spaced from `from` to `to`. */
  values: readonly number[];
  /** Extent of the whole period. */
  from: number;
  to: number;
  /** The part shown in the detail chart. */
  value: TimeWindow;
  onValueChange: (window: [number, number]) => void;
  /** Smallest window and slider step. */
  stepMs: number;
  /** What the overview shows, e.g. "Discharge pressure, last 7 days". */
  label: string;
  timeZone?: string;
  className?: string;
};

/**
 * Overview strip for a detail chart: the whole period as a small trend with the visible window
 * highlighted, and a two-thumb slider underneath that moves and resizes the window. The slider is
 * the control, so the navigator works with keyboard and touch.
 */
export function OverviewNavigator({ values, from, to, value, onValueChange, stepMs, label, timeZone = 'UTC', className }: OverviewNavigatorProps) {
  const start = timeFraction(value[0], from, to);
  const end = timeFraction(value[1], from, to);

  return (
    <div data-slot="overview-navigator" className={cn('flex w-full flex-col gap-1', className)}>
      <div className="relative h-10 w-full overflow-hidden rounded-md bg-muted-background">
        <Sparkline variant="area" height={40} values={values} label={label} tone="neutral" />
        <span aria-hidden="true" data-slot="navigator-dim" className="absolute inset-y-0 left-0 bg-base-background/70" style={{ width: `${start}%` }} />
        <span aria-hidden="true" data-slot="navigator-dim" className="absolute inset-y-0 right-0 bg-base-background/70" style={{ width: `${100 - end}%` }} />
        <span
          aria-hidden="true"
          data-slot="navigator-window"
          className="absolute inset-y-0 rounded-xs border-x-2 border-chart-1-450"
          style={{ left: `${start}%`, width: `${Math.max(end - start, 0)}%` }}
        />
      </div>
      <Slider
        aria-label={`Visible window of ${label}`}
        min={from}
        max={to}
        step={stepMs}
        minStepsBetweenValues={1}
        value={[value[0], value[1]]}
        onValueChange={(next) => {
          const [nextStart, nextEnd] = next;
          if (nextStart !== undefined && nextEnd !== undefined && nextEnd > nextStart) onValueChange([nextStart, nextEnd]);
        }}
      />
      <span data-slot="navigator-range" className="text-xs text-muted-foreground tabular-nums">
        {formatRange(value[0], value[1], timeZone)}
      </span>
    </div>
  );
}
