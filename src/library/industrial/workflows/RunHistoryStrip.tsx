import { IconMinus, IconX } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

import { summarizeRuns } from './workflow';
import type { RunStatus } from './workflow';

export type RunHistoryRun = { id: string; status: RunStatus };

export type RunHistoryStripProps = {
  /** Oldest first. */
  runs: readonly RunHistoryRun[];
  /** What ran, e.g. "OPC UA extractor, last 14 runs". The counts are appended. */
  label: string;
  size?: 'sm' | 'md';
  /** Prints the counts under the strip. */
  showSummary?: boolean;
  className?: string;
};

const SQUARE: Record<RunStatus, string> = {
  success: 'bg-chart-success-300',
  failed: 'bg-critical-background text-critical-foreground',
  running: 'border-2 border-info-foreground-strong',
  skipped: 'border border-dashed border-emphasized text-muted-foreground',
};

/**
 * The last runs of a job as one square each, oldest to newest. A plain square succeeded; a failed
 * run carries a cross, a skipped one a dash, a running one is hollow — so the pattern reads
 * without colour. The strip is one image with the counts as its accessible name.
 */
export function RunHistoryStrip({ runs, label, size = 'md', showSummary = false, className }: RunHistoryStripProps) {
  const summary = summarizeRuns(runs);
  const square = size === 'sm' ? 'size-3' : 'size-4';
  const glyph = size === 'sm' ? 'size-2.5' : 'size-3';
  return (
    <div data-slot="run-history" className={cn('inline-flex flex-col gap-1.5', className)}>
      <div role="img" aria-label={`${label}: ${summary.text}`} className="flex items-center gap-1">
        {runs.map((run) => (
          <span
            key={run.id}
            data-slot="run"
            data-status={run.status}
            className={cn('inline-flex shrink-0 items-center justify-center rounded-xs', square, SQUARE[run.status])}
          >
            {run.status === 'failed' ? <IconX aria-hidden className={glyph} /> : null}
            {run.status === 'skipped' ? <IconMinus aria-hidden className={glyph} /> : null}
          </span>
        ))}
      </div>
      {showSummary ? <span className="text-xs text-muted-foreground tabular-nums">{summary.text}</span> : null}
    </div>
  );
}
