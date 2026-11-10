import { cn } from '../../../lib/utils';
import { arcPath, toFraction } from '../../industrial/geometry';
import { formatValue } from '../../industrial/status';

export type ConcentricRing = {
  id: string;
  label: string;
  /** 0–100. */
  value: number;
};

export type ConcentricRingsProps = {
  cx: number;
  cy: number;
  /** Outer radius of the first ring; the others nest inside it. */
  radius: number;
  /** Outermost first. Up to five. */
  rings: readonly ConcentricRing[];
  thickness?: number;
  gap?: number;
  /** Headline printed in the middle. */
  value: number;
  unit?: string;
  decimals?: number;
  /** Name of the headline, printed under it. */
  caption: string;
  className?: string;
};

/** Series colour per ring, outermost first. Shared with the legend that names the rings. */
export const RING_STROKE: readonly string[] = ['stroke-chart-1-450', 'stroke-chart-2-450', 'stroke-chart-3-450', 'stroke-chart-4-450', 'stroke-chart-5-450'];
export const RING_SWATCH: readonly string[] = ['bg-chart-1-450', 'bg-chart-2-450', 'bg-chart-3-450', 'bg-chart-4-450', 'bg-chart-5-450'];

/**
 * A headline figure inside nested rings, one ring per factor that makes it up — OEE inside
 * availability, performance and quality. It is an SVG fragment. Pick it as the centre of a
 * dial-shaped screen; pair it with a legend, because ring colour alone does not name a factor.
 */
export function ConcentricRings({ cx, cy, radius, rings, thickness = 12, gap = 6, value, unit, decimals = 1, caption, className }: ConcentricRingsProps) {
  const summary = rings.map((ring) => `${ring.label} ${formatValue(ring.value, decimals)} %`).join(', ');

  return (
    <g
      data-slot="concentric-rings"
      role="img"
      aria-label={`${caption}: ${formatValue(value, decimals)}${unit ? ` ${unit}` : ''}. ${summary}`}
      className={className}
    >
      {rings.map((ring, index) => {
        const r = radius - thickness / 2 - index * (thickness + gap);
        const fraction = toFraction(ring.value, 0, 100);
        return (
          <g key={ring.id} data-slot="concentric-ring" data-ring={ring.id}>
            <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={thickness} className="stroke-[color-mix(in_oklab,var(--base-foreground)_9%,transparent)]" />
            {fraction > 0 ? (
              <path
                data-slot="concentric-ring-value"
                d={arcPath(cx, cy, r, 0, fraction * 360)}
                fill="none"
                strokeWidth={thickness}
                strokeLinecap="round"
                className={cn(RING_STROKE[index % RING_STROKE.length], '[filter:drop-shadow(0_0_4px_color-mix(in_oklab,currentColor_40%,transparent))]')}
              />
            ) : null}
          </g>
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" dominantBaseline="central" fontSize={radius * 0.34} className="fill-base-foreground font-semibold tabular-nums">
        {formatValue(value, decimals)}
        {unit ? (
          <tspan fontSize={radius * 0.15} dx={3} className="fill-muted-foreground font-normal">
            {unit}
          </tspan>
        ) : null}
      </text>
      <text x={cx} y={cy + radius * 0.22} textAnchor="middle" dominantBaseline="central" fontSize={radius * 0.12} className="fill-muted-foreground uppercase tracking-widest">
        {caption}
      </text>
    </g>
  );
}
