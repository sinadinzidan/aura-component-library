import { TONE_MARK_BG } from '../../industrial/status';
import type { Tone } from '../../industrial/status';

export type DistributionSegment = {
  id: string;
  label: string;
  value: number;
  /** Status colour, when the segment is a state such as "Tripped". */
  tone?: Tone;
  /** Chart series colour 1–5, when segments are categories. Ignored when `tone` is set. */
  series?: 1 | 2 | 3 | 4 | 5;
};

type DistributionStripProps = {
  /** What the whole strip adds up to, for example "Work orders by status". */
  label: string;
  segments: readonly DistributionSegment[];
  unit?: string;
  /** Legend under the strip. `none` only when the same labels are listed right next to it. */
  legend?: 'values' | 'shares' | 'none';
  size?: 'sm' | 'md';
};

const SERIES_BG = {
  1: 'bg-chart-1-450',
  2: 'bg-chart-2-450',
  3: 'bg-chart-3-450',
  4: 'bg-chart-4-450',
  5: 'bg-chart-5-450',
} as const;

const SERIES_ORDER = [1, 2, 3, 4, 5] as const;

const NUMBER = new Intl.NumberFormat('en-US');

function fillOf(segment: DistributionSegment, index: number): string {
  if (segment.tone) return segment.tone === 'neutral' ? 'bg-chart-neutral-300' : TONE_MARK_BG[segment.tone];
  return SERIES_BG[segment.series ?? SERIES_ORDER[index % SERIES_ORDER.length]];
}

/**
 * One stacked bar that shows how a total splits into a few parts, with a legend that repeats
 * every part in words and numbers. For up to five segments; beyond that use a `BreakdownList`.
 * Empty segments keep their legend entry so a zero is still stated.
 */
export function DistributionStrip({ label, segments, unit, legend = 'values', size = 'md' }: DistributionStripProps) {
  const total = segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0);
  const shareOf = (segment: DistributionSegment) => (total > 0 ? Math.round((Math.max(segment.value, 0) / total) * 100) : 0);
  const summary = segments.map((segment) => `${segment.label} ${NUMBER.format(segment.value)}`).join(', ');

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        role="img"
        aria-label={`${label}: ${summary}${unit ? ` ${unit}` : ''}`}
        className={`flex w-full gap-0.5 overflow-hidden rounded-full bg-muted-background ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}
      >
        {segments.map((segment, index) =>
          segment.value > 0 ? (
            <span
              key={segment.id}
              data-slot="distribution-segment"
              className={`h-full ${fillOf(segment, index)}`}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ) : null
        )}
      </div>
      {legend === 'none' ? null : (
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {segments.map((segment, index) => (
            <li key={segment.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span aria-hidden="true" className={`size-2 shrink-0 rounded-xs ${fillOf(segment, index)}`} />
              <span>{segment.label}</span>
              <span className="font-medium tabular-nums text-base-foreground">
                {legend === 'shares' ? `${shareOf(segment)}%` : NUMBER.format(segment.value)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
