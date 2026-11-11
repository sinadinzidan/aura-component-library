import { IconAlertTriangle, IconLock } from '@cognite/aura/icons';

import type { SelectionStats } from './selectionStats';

export type SheetStatusBarProps = {
  /** The selected range as text: "B2" or "B2:C6". */
  range: string;
  stats: SelectionStats;
  /** Why the active cell is invalid, when it is. */
  invalidReason?: string | null;
  /** The active cell cannot be edited. */
  readOnly?: boolean;
  /** Number of invalid cells in the whole sheet. */
  invalidCount?: number;
  /** Decimals for the sum and the average. */
  decimals?: number;
};

function formatStat(value: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(value);
}

/**
 * The strip under a spreadsheet: which range is selected, why the active cell is invalid or locked,
 * and the count, sum and average of the selected numbers. Sum and average only appear when at least
 * two numbers are selected, the way a spreadsheet does it.
 */
export function SheetStatusBar({ range, stats, invalidReason = null, readOnly = false, invalidCount = 0, decimals = 2 }: SheetStatusBarProps) {
  const showMaths = stats.numericCount >= 2 && stats.average !== null;

  return (
    <div data-slot="sheet-status-bar" className="flex min-h-8 w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-default bg-muted-background px-3 py-1.5 text-xs text-muted-foreground">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-base-foreground">{range}</span>
        {invalidReason ? (
          <span className="flex items-center gap-1 text-critical-foreground-strong">
            <IconAlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
            {invalidReason}
          </span>
        ) : readOnly ? (
          <span className="flex items-center gap-1">
            <IconLock aria-hidden="true" className="size-3.5 shrink-0" />
            Read-only
          </span>
        ) : null}
        {invalidCount > 0 && !invalidReason ? (
          <span className="flex items-center gap-1">
            <IconAlertTriangle aria-hidden="true" className="size-3.5 shrink-0 text-critical-foreground-strong" />
            {invalidCount} invalid {invalidCount === 1 ? 'cell' : 'cells'}
          </span>
        ) : null}
      </div>
      <dl className="flex shrink-0 items-center gap-4 tabular-nums">
        <div className="flex gap-1">
          <dt>Count</dt>
          <dd className="font-medium text-base-foreground">{stats.count}</dd>
        </div>
        {showMaths && stats.average !== null ? (
          <>
            <div className="flex gap-1">
              <dt>Sum</dt>
              <dd className="font-medium text-base-foreground">{formatStat(stats.sum, decimals)}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Average</dt>
              <dd className="font-medium text-base-foreground">{formatStat(stats.average, decimals)}</dd>
            </div>
          </>
        ) : null}
      </dl>
    </div>
  );
}
