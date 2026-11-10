import { IconAlertTriangle, IconHexagon } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { formatCount, usageLevel, usagePercent, usageShare } from './usage';
import type { UsageLevel } from './usage';

export type UsageMeterProps = {
  /** What is metered: "API requests". Also the accessible name. */
  label: string;
  used: number;
  limit: number;
  /** Unit after the numbers: "GB", "seats". Leave out for plain counts. */
  unit?: string;
  /** Formats both numbers. Defaults to short counts such as "12.4 k". */
  format?: (value: number) => string;
  /** Share of the limit from which the meter reads "Near limit". */
  warnAt?: number;
  /** Line under the bar: when the meter resets, or what happens at the limit. */
  hint?: ReactNode;
  /** `row` puts label, bar and numbers on one line for tables of meters. */
  layout?: 'stacked' | 'row';
  className?: string;
};

const LEVEL_LABEL: Record<UsageLevel, string | null> = {
  normal: null,
  near: 'Near limit',
  reached: 'Limit reached',
  over: 'Over limit',
};

const LEVEL_BAR: Record<UsageLevel, string> = {
  normal: 'bg-primary-background',
  near: 'bg-warning-foreground-strong',
  reached: 'bg-critical-foreground-strong',
  over: 'bg-critical-foreground-strong',
};

const LEVEL_TEXT: Record<UsageLevel, string> = {
  normal: 'text-muted-foreground',
  near: 'text-warning-foreground-strong',
  reached: 'text-critical-foreground-strong',
  over: 'text-critical-foreground-strong',
};

/**
 * Usage against a plan limit: what is metered, how much is used of how much, and a bar. The bar
 * stays neutral until usage nears the limit; from there the state is also written out and given an
 * icon, so it never depends on colour.
 */
export function UsageMeter({
  label,
  used,
  limit,
  unit,
  format = formatCount,
  warnAt = 0.8,
  hint,
  layout = 'stacked',
  className,
}: UsageMeterProps) {
  const level = usageLevel(used, limit, warnAt);
  const percent = usagePercent(used, limit);
  const suffix = unit ? `\u00a0${unit}` : '';
  const valueText = `${format(used)} of ${format(limit)}${suffix}`;
  const stateLabel = LEVEL_LABEL[level];
  const StateIcon = level === 'near' ? IconAlertTriangle : IconHexagon;

  const state = stateLabel ? (
    <span data-slot="usage-state" className={cn('inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap', LEVEL_TEXT[level])}>
      <StateIcon aria-hidden className="size-3.5" />
      {stateLabel}
    </span>
  ) : null;

  const bar = (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={used}
      aria-valuetext={`${valueText}, ${percent}%${stateLabel ? `, ${stateLabel.toLowerCase()}` : ''}`}
      className="h-2 w-full min-w-0 overflow-hidden rounded-full bg-muted-background"
    >
      <div data-slot="usage-fill" className={cn('h-full rounded-full', LEVEL_BAR[level])} style={{ width: `${usageShare(used, limit) * 100}%` }} />
    </div>
  );

  if (layout === 'row') {
    return (
      <div data-slot="usage-meter" data-level={level} className={cn('grid w-full grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-x-4 gap-y-1', className)}>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-base-foreground">{label}</span>
          {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
        </div>
        {bar}
        <div className="flex flex-col items-end">
          <span className="text-sm tabular-nums whitespace-nowrap text-base-foreground">{valueText}</span>
          {state ?? <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>}
        </div>
      </div>
    );
  }

  return (
    <div data-slot="usage-meter" data-level={level} className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium text-base-foreground">{label}</span>
        <span className="text-sm tabular-nums whitespace-nowrap text-medium-foreground">{valueText}</span>
      </div>
      {bar}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-xs text-muted-foreground">{hint}</span>
        {state ?? <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>}
      </div>
    </div>
  );
}
