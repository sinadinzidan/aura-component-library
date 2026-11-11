import { useLookDefinition } from '../../looks/useLook';
import { cx, formatNumber, toneLine, type Tone } from '../tones';

import type { OrbitPoint } from './signal';

type OrbitPlotProps = {
  /** Which bearing and what the shape is: "Shaft orbit, compressor drive end". */
  label: string;
  points: readonly OrbitPoint[];
  /** Bearing clearance as a diameter, drawn as the boundary circle. */
  clearance: number;
  unit?: string;
  tone?: Tone;
  /** Edge of the square plot in px. */
  size?: number;
  /** A word for the shape under the plot: "Ellipse — unbalance". */
  caption?: string;
  className?: string;
};

/**
 * The path of the shaft centre over one revolution, inside its bearing clearance. The dot is the
 * keyphasor mark; the shape tells unbalance (ellipse) from misalignment (banana, figure of eight).
 */
export function OrbitPlot({ label, points, clearance, unit = 'µm', tone = 'accent', size = 200, caption, className }: OrbitPlotProps) {
  const { id: look, chart } = useLookDefinition();
  const radius = clearance / 2;
  const scale = 44 / radius;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const color = toneLine(tone);
  const first = points[0] ?? { x: 0, y: 0 };

  return (
    <figure data-look={look} className={cx('flex min-w-0 flex-col items-center gap-2', className)}>
      <svg role="img" aria-label={label} viewBox="-50 -50 100 100" width={size} height={size} className="shrink-0">
        <circle r="44" fill="var(--kit-track)" stroke="var(--kit-rule-strong)" strokeDasharray="2 2.5" strokeWidth="0.6" />
        <circle r="22" fill="none" stroke="var(--kit-grid)" strokeWidth="0.5" />
        <line x1="-48" x2="48" stroke="var(--kit-grid)" strokeWidth="0.5" />
        <line y1="-48" y2="48" stroke="var(--kit-grid)" strokeWidth="0.5" />
        <polygon
          points={points.map((point) => `${(point.x * scale).toFixed(2)},${(-point.y * scale).toFixed(2)}`).join(' ')}
          fill={chart.area === 'none' ? 'none' : `color-mix(in oklab, ${color} 14%, transparent)`}
          stroke={color}
          strokeWidth={Math.min(chart.strokeWidth, 2.5) * 0.55}
          strokeLinejoin="round"
          style={look === 'glass' ? { filter: `drop-shadow(0 0 2px ${color})` } : undefined}
        />
        <circle cx={first.x * scale} cy={-first.y * scale} r="2.6" fill="var(--kit-surface)" stroke={color} strokeWidth="1.4" />
      </svg>
      <figcaption className="flex flex-col items-center gap-0.5 text-center">
        {caption ? <span className="text-sm font-semibold text-(--kit-text)">{caption}</span> : null}
        <span className="text-xs text-(--kit-text-2) tabular-nums">
          X {formatNumber(spanX)} · Y {formatNumber(spanY)} {unit} pp · clearance {formatNumber(clearance)}
        </span>
      </figcaption>
    </figure>
  );
}
