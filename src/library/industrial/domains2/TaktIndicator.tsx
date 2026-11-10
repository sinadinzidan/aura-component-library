import { cn } from '../../../lib/utils';
import { toFraction } from '../geometry';
import { LABEL_TEXT, SCALE_TEXT, TONE_MARK_BG, TONE_TEXT, formatDelta, formatValue } from '../status';
import { ValueReadout } from '../ValueReadout';

import { judgeTakt } from './lines';

export type TaktIndicatorProps = {
  /** What is timed, e.g. "Cycle time" or a station name. */
  label?: string;
  /** Measured cycle time. */
  cycleTime: number;
  /** Takt time: the pace the customer demand sets. */
  takt: number;
  unit?: string;
  decimals?: number;
  /** End of the bar's scale. Defaults to one and a half takt. */
  max?: number;
  /** Label and readout above the bar. Turn off in table cells that already show them. */
  showHeader?: boolean;
  className?: string;
};

/**
 * Cycle time against takt: a bar that should end before the takt tick. Past the tick the station
 * cannot keep up with demand, and the indicator says by how much in words.
 */
export function TaktIndicator({ label = 'Cycle time', cycleTime, takt, unit = 's', decimals = 1, max, showHeader = true, className }: TaktIndicatorProps) {
  const verdict = judgeTakt(cycleTime, takt);
  const scaleMax = max ?? Math.max(takt * 1.5, cycleTime);
  const gapText = `${formatDelta(verdict.gap, decimals)} ${unit} ${verdict.gap > 0 ? 'over' : 'to'} takt`;

  return (
    <div data-slot="takt-indicator" data-tone={verdict.tone} className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      {showHeader ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className={cn(LABEL_TEXT, 'truncate')}>{label}</span>
          <ValueReadout size="sm" value={cycleTime} unit={unit} decimals={decimals} tone={verdict.tone} />
        </div>
      ) : null}
      <div
        role="img"
        aria-label={`${label}: ${formatValue(cycleTime, decimals)} ${unit} against a takt of ${formatValue(takt, decimals)} ${unit}, ${verdict.label.toLowerCase()}`}
        className="relative"
      >
        <div className="h-2 overflow-hidden rounded-full bg-chart-neutral-100">
          <div data-slot="takt-fill" className={cn('h-full rounded-full', TONE_MARK_BG[verdict.tone])} style={{ width: `${toFraction(cycleTime, 0, scaleMax) * 100}%` }} />
        </div>
        <span data-slot="takt-tick" className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-base-foreground" style={{ left: `${toFraction(takt, 0, scaleMax) * 100}%` }} />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className={SCALE_TEXT}>
          Takt {formatValue(takt, decimals)} {unit}
        </span>
        <span data-slot="takt-gap" className={cn('whitespace-nowrap text-xs tabular-nums', verdict.tone === 'neutral' ? 'text-muted-foreground' : cn('font-medium', TONE_TEXT[verdict.tone]))}>
          {gapText}
        </span>
      </div>
    </div>
  );
}
