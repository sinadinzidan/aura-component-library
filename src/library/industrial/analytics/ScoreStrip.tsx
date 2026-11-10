import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

import { anomalyRegions, flaggedScores } from './anomaly';
import type { ScorePoint } from './anomaly';

export type ScoreStripProps = {
  /** What was scored, e.g. "Anomaly score, drive-end vibration". The finding is appended. */
  label: string;
  /** One score per sample, oldest first, 0–1. */
  scores: readonly ScorePoint[];
  /** Samples at or above this score are flagged. */
  threshold: number;
  /** Formats a timestamp for the accessible description of the flagged periods. */
  formatTime?: (timestamp: number) => string;
  /** Pixels to inset the strip so it lines up with the plot of a `TrendChart` above it. */
  insetLeft?: number;
  insetRight?: number;
  /** Caption with the threshold and the flagged count under the strip. */
  showCaption?: boolean;
  /** Tailwind height of the strip, e.g. `h-3`. */
  heightClassName?: string;
  className?: string;
};

/** Quiet steps for scores under the threshold, so a rising score is visible before it is flagged. */
const QUIET = ['bg-chart-neutral-100', 'bg-chart-neutral-200', 'bg-chart-neutral-300'] as const;

function cellClass(score: number, threshold: number): string {
  if (score >= threshold) return 'bg-chart-warning-450';
  const step = threshold > 0 ? Math.min(QUIET.length - 1, Math.floor((score / threshold) * QUIET.length)) : 0;
  return QUIET[Math.max(step, 0)];
}

/**
 * The anomaly score of a series as a strip of cells on the time axis, to sit directly under its
 * trend. Scores under the threshold stay grey and darken as they rise; flagged samples take the
 * warning colour, and the caption says how many there are so the strip never relies on colour.
 */
export function ScoreStrip({
  label,
  scores,
  threshold,
  formatTime,
  insetLeft = 0,
  insetRight = 0,
  showCaption = true,
  heightClassName = 'h-3',
  className,
}: ScoreStripProps) {
  const flagged = flaggedScores(scores, threshold).length;
  const regions = anomalyRegions(scores, threshold, 1);
  const periods = formatTime && regions.length > 0 ? `: ${regions.map((region) => `${formatTime(region.from)} to ${formatTime(region.to)}`).join(', ')}` : '';
  const finding = flagged === 0 ? 'no samples flagged' : `${flagged} of ${scores.length} samples flagged in ${regions.length} ${regions.length === 1 ? 'period' : 'periods'}${periods}`;

  return (
    <div data-slot="score-strip" className={cn('flex w-full min-w-0 flex-col gap-1.5', className)} style={{ paddingLeft: insetLeft, paddingRight: insetRight }}>
      <div role="img" aria-label={`${label}: ${finding}`} className={cn('flex w-full overflow-hidden rounded-sm', heightClassName)}>
        {scores.map((point) => (
          <span key={point.t} data-slot="score-cell" data-flagged={point.score >= threshold} className={cn('h-full min-w-0 flex-1', cellClass(point.score, threshold))} />
        ))}
      </div>
      {showCaption ? (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-xs bg-chart-warning-450" />
            Score at or above {formatValue(threshold, 2)}
          </span>
          <span className="tabular-nums">{flagged === 0 ? 'No samples flagged' : `${flagged} of ${scores.length} samples flagged`}</span>
        </p>
      ) : null}
    </div>
  );
}
