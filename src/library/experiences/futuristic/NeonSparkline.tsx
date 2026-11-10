import { useId } from 'react';

import { cn } from '../../../lib/utils';
import { areaPath, linePath, scalePoints, scaleY, valueDomain } from '../../industrial/sparklinePath';
import { formatReading, formatValue } from '../../industrial/status';

import { NEON_STROKE, NEON_SVG_GLOW, NEON_TONE } from './neon';
import type { NeonTone } from './neon';

export type NeonSparklineProps = {
  /** Oldest first. */
  values: readonly number[];
  /** What the trend shows, e.g. "Load, last 24 hours". Latest value and range are appended. */
  label: string;
  tone?: NeonTone;
  height?: number;
  /** Dashed reference line, such as a high limit. */
  limit?: number;
  unit?: string;
  decimals?: number;
  className?: string;
};

const VIEW_WIDTH = 100;
const PADDING = 4;

/**
 * A trend line that glows: a bright core, a halo and a fade to nothing underneath, with a dot on
 * the latest value. It fills the width of its container. For futuristic panels; on ordinary
 * screens use the plain `Sparkline`.
 */
export function NeonSparkline({ values, label, tone = 'accent', height = 48, limit, unit, decimals = 1, className }: NeonSparklineProps) {
  const fadeId = useId();
  const box = { width: VIEW_WIDTH, height, paddingX: PADDING, paddingY: PADDING };
  const domain = valueDomain(values, limit === undefined ? [] : [limit]);
  const points = scalePoints(values, domain, box);
  const last = points[points.length - 1];
  const limitY = limit === undefined ? undefined : scaleY(limit, domain, box);
  const description =
    values.length === 0
      ? `${label}: no data`
      : `${label}: latest ${formatReading(values[values.length - 1], unit, decimals)}, range ${formatValue(Math.min(...values), decimals)} to ${formatValue(Math.max(...values), decimals)}`;

  return (
    <svg
      data-slot="neon-sparkline"
      role="img"
      aria-label={description}
      viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      fill="none"
      className={cn(NEON_TONE[tone], 'block shrink-0 overflow-visible', className)}
    >
      <defs>
        <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--neon)', stopOpacity: 0.35 }} />
          <stop offset="1" style={{ stopColor: 'var(--neon)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      {points.length > 1 ? <path data-slot="neon-sparkline-area" d={areaPath(points, height)} fill={`url(#${fadeId})`} /> : null}
      {limitY !== undefined ? (
        <line
          data-slot="neon-sparkline-limit"
          x1={PADDING}
          x2={VIEW_WIDTH - PADDING}
          y1={limitY}
          y2={limitY}
          strokeWidth={1}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
          className="stroke-muted-foreground"
        />
      ) : null}
      {points.length > 1 ? (
        <path
          data-slot="neon-sparkline-line"
          d={linePath(points)}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={cn(NEON_STROKE, NEON_SVG_GLOW)}
        />
      ) : null}
      {last ? (
        <path
          data-slot="neon-sparkline-last"
          d={`M ${last.x} ${last.y} h 0.01`}
          strokeWidth={6}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className={cn(NEON_STROKE, NEON_SVG_GLOW)}
        />
      ) : null}
    </svg>
  );
}
