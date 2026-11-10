import { cn } from '../../../lib/utils';
import { clamp } from '../../industrial/geometry';
import type { Tone } from '../../industrial/status';

import { annularSectorPath, polarPoint } from './polar';

export type ArcSegmentProps = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  /** Degrees, 0 at 12 o'clock, clockwise. */
  startAngle: number;
  endAngle: number;
  /** Filled share of the segment, 0–1, measured from `startAngle`. */
  fraction: number;
  /** Accessible description, such as "Discharge pressure: 48.6 barg". */
  label: string;
  /** Short key printed beyond the outer edge, to tie the segment to a legend row. */
  marker?: string;
  tone?: Tone;
  className?: string;
};

const SEGMENT_TONE: Record<Tone, string> = {
  neutral: '[--arc:var(--primary-background)]',
  success: '[--arc:var(--primary-background)]',
  info: '[--arc:var(--info-foreground-strong)]',
  warning: '[--arc:var(--warning-foreground-strong)]',
  critical: '[--arc:var(--critical-foreground-strong)]',
};

/**
 * One reading as a thick segment of a ring, filled from its start in proportion to the value.
 * It is an SVG fragment: place it inside an `<svg>`. Pick it to fan a few readings out around a
 * dial, where a straight bar would break the circular layout.
 */
export function ArcSegment({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fraction, label, marker, tone = 'neutral', className }: ArcSegmentProps) {
  const share = clamp(fraction, 0, 1);
  const filledEnd = startAngle + (endAngle - startAngle) * share;
  const markerAt = polarPoint(cx, cy, outerRadius + 12, (startAngle + endAngle) / 2);

  return (
    <g data-slot="arc-segment" data-tone={tone} role="img" aria-label={label} className={cn(SEGMENT_TONE[tone], className)}>
      <path
        data-slot="arc-segment-track"
        d={annularSectorPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle)}
        strokeWidth={1}
        className="fill-[color-mix(in_oklab,var(--arc)_14%,transparent)] stroke-[color-mix(in_oklab,var(--arc)_45%,transparent)]"
      />
      {share > 0 ? (
        <path
          data-slot="arc-segment-fill"
          d={annularSectorPath(cx, cy, innerRadius, outerRadius, startAngle, filledEnd)}
          className="fill-[var(--arc)] [filter:drop-shadow(0_0_5px_color-mix(in_oklab,var(--arc)_60%,transparent))]"
        />
      ) : null}
      {marker ? (
        <text x={markerAt.x} y={markerAt.y} textAnchor="middle" dominantBaseline="central" fontSize={13} className="fill-medium-foreground font-medium tabular-nums">
          {marker}
        </text>
      ) : null}
    </g>
  );
}
