import { cn } from '../../../lib/utils';
import { LABEL_TEXT, NBSP, TONE_MARK_BG } from '../status';
import type { Tone } from '../status';

export type DistributionSegment = {
  id: string;
  label: string;
  value: number;
  /** Status tone, when the segment is a state (good, watch, poor). */
  tone?: Tone;
  /** Background class for a category that is not a state, e.g. `bg-chart-2-450`. Wins over `tone`. */
  colorClass?: string;
};

export type DistributionBarProps = {
  segments: readonly DistributionSegment[];
  /** What the bar shows, for the accessible name: "Fleet health". */
  label: string;
  /** Legend with label, count and share under the bar. */
  showLegend?: boolean;
  /** Unit after each count in the legend, e.g. "h". */
  unit?: string;
  size?: 'sm' | 'md';
  className?: string;
};

const share = (value: number, total: number): number => (total > 0 ? (value / total) * 100 : 0);

/**
 * One stacked bar for parts of a whole: assets by health, alarms by severity, work by type.
 * The legend repeats every segment in words and numbers, so the bar never depends on colour.
 */
export function DistributionBar({ segments, label, showLegend = true, unit, size = 'md', className }: DistributionBarProps) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  const summary = segments.map((segment) => `${segment.label} ${segment.value}`).join(', ');

  return (
    <div data-slot="distribution-bar" className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <div
        role="img"
        aria-label={`${label}: ${summary}`}
        className={cn('flex w-full gap-0.5 overflow-hidden rounded-full', size === 'sm' ? 'h-1.5' : 'h-2.5', total === 0 ? 'bg-chart-neutral-100' : undefined)}
      >
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <span
              key={segment.id}
              data-slot="distribution-segment"
              data-segment={segment.id}
              className={cn('h-full', segment.colorClass ?? TONE_MARK_BG[segment.tone ?? 'neutral'])}
              style={{ width: `${share(segment.value, total)}%` }}
            />
          ))}
      </div>
      {showLegend ? (
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {segments.map((segment) => (
            <li key={segment.id} className="flex items-center gap-2">
              <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-xs', segment.colorClass ?? TONE_MARK_BG[segment.tone ?? 'neutral'])} />
              <span className={LABEL_TEXT}>{segment.label}</span>
              <span className="text-xs font-medium text-base-foreground tabular-nums">
                {segment.value}
                {unit ? `${NBSP}${unit}` : null}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">{Math.round(share(segment.value, total))}%</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
