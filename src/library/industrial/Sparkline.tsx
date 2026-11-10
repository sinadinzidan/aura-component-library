import { cn } from '../../lib/utils';

import { areaPath, barRects, linePath, scalePoints, scaleY, valueDomain } from './sparklinePath';
import type { Domain } from './sparklinePath';
import {
  TONE_AREA_FILL,
  TONE_MARK_FILL,
  TONE_MARK_FILL_SOFT,
  TONE_MARK_STROKE,
  formatReading,
  formatValue,
} from './status';
import type { Tone } from './status';

export type SparklineVariant = 'line' | 'area' | 'bar';

export type SparklineProps = {
  /** Oldest first. */
  values: readonly number[];
  /** What the trend shows, e.g. "Discharge pressure, last 24 hours". The latest value is appended. */
  label: string;
  variant?: SparklineVariant;
  /** Pixel width. Leave out to fill the container. */
  width?: number;
  height?: number;
  /** Neutral is the default data colour; set a status tone only when the series is in that state. */
  tone?: Tone;
  /** Dot on the latest value (line and area). */
  showLast?: boolean;
  /** Dashed reference line, such as a high limit. Bars above it take `limitTone`. */
  limit?: number;
  limitTone?: Tone;
  /** Shaded normal operating band behind the line. */
  band?: { low: number; high: number };
  /** Fixed y range. Defaults to the data, the limit and the band. */
  domain?: Domain;
  /** Used for the value in the accessible name. */
  unit?: string;
  decimals?: number;
  className?: string;
};

/** Width of the viewBox. The drawing stretches horizontally; strokes and dots do not. */
const VIEW_WIDTH = 100;
const PADDING_X = 3;
const PADDING_Y = 3;

function describe(label: string, values: readonly number[], unit: string | undefined, decimals: number): string {
  if (values.length === 0) return `${label}: no data`;
  const latest = formatReading(values[values.length - 1], unit, decimals);
  const min = formatValue(Math.min(...values), decimals);
  const max = formatValue(Math.max(...values), decimals);
  return `${label}: latest ${latest}, range ${min} to ${max}`;
}

/**
 * A word-sized trend with no axes: line, area or bars. Dependency-free inline SVG that fills its
 * container, so it sits in table cells, tiles and list rows. Use a full chart when people need to
 * read values off it.
 */
export function Sparkline({
  values,
  label,
  variant = 'line',
  width,
  height = 32,
  tone = 'neutral',
  showLast = false,
  limit,
  limitTone = 'warning',
  band,
  domain,
  unit,
  decimals = 1,
  className,
}: SparklineProps) {
  const box = { width: VIEW_WIDTH, height, paddingX: variant === 'bar' ? 0 : PADDING_X, paddingY: variant === 'bar' ? 0 : PADDING_Y };
  const include = [...(limit === undefined ? [] : [limit]), ...(band ? [band.low, band.high] : [])];
  const resolvedDomain = domain ?? valueDomain(values, variant === 'bar' ? [0, ...include] : include);
  const points = scalePoints(values, resolvedDomain, box);
  const last = points[points.length - 1];
  const baseline = height - PADDING_Y;
  const limitY = limit === undefined ? undefined : scaleY(limit, resolvedDomain, box);

  return (
    <svg
      role="img"
      aria-label={describe(label, values, unit, decimals)}
      data-slot="sparkline"
      data-variant={variant}
      viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
      preserveAspectRatio="none"
      width={width ?? '100%'}
      height={height}
      fill="none"
      className={cn('block shrink-0 overflow-visible', className)}
    >
      {band ? (
        <rect
          data-slot="sparkline-band"
          x={box.paddingX}
          width={VIEW_WIDTH - box.paddingX * 2}
          y={scaleY(band.high, resolvedDomain, box)}
          height={Math.max(scaleY(band.low, resolvedDomain, box) - scaleY(band.high, resolvedDomain, box), 0)}
          className="fill-chart-neutral-100"
        />
      ) : null}

      {values.length === 0 ? (
        <line
          data-slot="sparkline-empty"
          x1={0}
          x2={VIEW_WIDTH}
          y1={height / 2}
          y2={height / 2}
          strokeWidth={1}
          strokeDasharray="2 3"
          vectorEffect="non-scaling-stroke"
          className="stroke-chart-neutral-300"
        />
      ) : null}

      {variant === 'bar'
        ? barRects(values, resolvedDomain, box).map((rect, index) => {
            const over = limit !== undefined && values[index] > limit;
            return (
              <rect
                key={index}
                data-slot="sparkline-bar"
                data-over={over ? 'true' : undefined}
                {...rect}
                className={over ? TONE_MARK_FILL[limitTone] : TONE_MARK_FILL_SOFT[tone]}
              />
            );
          })
        : null}

      {variant === 'area' && points.length > 1 ? (
        <path data-slot="sparkline-area" d={areaPath(points, baseline)} className={TONE_AREA_FILL[tone]} />
      ) : null}

      {variant !== 'bar' && points.length > 1 ? (
        <path
          data-slot="sparkline-line"
          d={linePath(points)}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={TONE_MARK_STROKE[tone]}
        />
      ) : null}

      {limitY !== undefined ? (
        <line
          data-slot="sparkline-limit"
          x1={box.paddingX}
          x2={VIEW_WIDTH - box.paddingX}
          y1={limitY}
          y2={limitY}
          strokeWidth={1}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
          className="stroke-chart-neutral-450"
        />
      ) : null}

      {variant !== 'bar' && last && (showLast || points.length === 1) ? (
        // A zero-length round-capped stroke: a dot that stays round while the drawing stretches.
        <path
          data-slot="sparkline-last"
          d={`M ${last.x} ${last.y} h 0.01`}
          strokeWidth={5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className={TONE_MARK_STROKE[tone]}
        />
      ) : null}
    </svg>
  );
}
