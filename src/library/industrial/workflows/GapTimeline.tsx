import { cn } from '../../../lib/utils';

import { coveragePercent, formatDuration, missingDuration, normalizeGaps, presentSegments } from './workflow';
import type { Interval } from './workflow';

export type GapTimelineProps = {
  /** Period shown, epoch milliseconds. */
  start: number;
  end: number;
  /** Where data is missing. May overlap or run past the period. */
  gaps: readonly Interval[];
  /** What the timeline covers, e.g. "23-PT-92531, last 24 hours". */
  label: string;
  /** Captions under the two ends, e.g. "13 Mar 14:00" and "Now". */
  startLabel?: string;
  endLabel?: string;
  /** Prints coverage, gap count and missing time above the bar. */
  showSummary?: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Where a time series has data and where it does not: a filled bar with holes for the gaps.
 * The accessible name gives coverage, the number of gaps and the total time missing.
 */
export function GapTimeline({ start, end, gaps, label, startLabel, endLabel, showSummary = false, size = 'md', className }: GapTimelineProps) {
  const gapCount = normalizeGaps(start, end, gaps).length;
  const coverage = coveragePercent(start, end, gaps);
  const missing = missingDuration(start, end, gaps);
  const summary =
    gapCount === 0 ? `${coverage}% covered, no gaps` : `${coverage}% covered, ${gapCount} ${gapCount === 1 ? 'gap' : 'gaps'}, ${formatDuration(missing)} missing`;

  return (
    <div data-slot="gap-timeline" className={cn('flex w-full flex-col gap-1.5', className)}>
      {showSummary ? <span className="text-xs text-muted-foreground tabular-nums">{summary}</span> : null}
      <div
        role="img"
        aria-label={`${label}: ${summary}`}
        className={cn('relative w-full overflow-hidden rounded-xs border border-dashed border-emphasized', size === 'sm' ? 'h-2.5' : 'h-4')}
      >
        {presentSegments(start, end, gaps).map((segment) => (
          <span
            key={segment.left}
            data-slot="gap-timeline-present"
            className="absolute inset-y-0 bg-chart-1-300"
            style={{ left: `${segment.left}%`, width: `${segment.width}%` }}
          />
        ))}
      </div>
      {startLabel || endLabel ? (
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
