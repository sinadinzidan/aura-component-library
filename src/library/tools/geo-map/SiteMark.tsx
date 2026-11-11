import type { DotShape, Tone } from '../../industrial/status';

const FILL: Record<Tone, string> = {
  neutral: 'fill-medium-foreground',
  success: 'fill-success-foreground-strong',
  warning: 'fill-warning-foreground-strong',
  critical: 'fill-critical-foreground-strong',
  info: 'fill-info-foreground-strong',
};

const STROKE: Record<Tone, string> = {
  neutral: 'stroke-medium-foreground',
  success: 'stroke-success-foreground-strong',
  warning: 'stroke-warning-foreground-strong',
  critical: 'stroke-critical-foreground-strong',
  info: 'stroke-info-foreground-strong',
};

type SiteMarkProps = {
  x: number;
  y: number;
  tone: Tone;
  /** The state also in shape: dot, ring (hollow), square or diamond. */
  shape: DotShape;
  /** Radius in pixels. */
  radius?: number;
  selected?: boolean;
};

/**
 * A map marker, drawn inside an SVG: the shape and the tone both say the state, so it reads
 * without colour. A halo in the page colour keeps it legible over coastlines and routes.
 */
export function SiteMark({ x, y, tone, shape, radius = 7, selected = false }: SiteMarkProps) {
  return (
    <g data-slot="site-mark" data-shape={shape} data-tone={tone}>
      {selected ? <circle cx={x} cy={y} r={radius + 6} strokeWidth={2} className="fill-none stroke-base-foreground" /> : null}
      {shape === 'dot' ? <circle cx={x} cy={y} r={radius} strokeWidth={2} className={`${FILL[tone]} stroke-base-background`} /> : null}
      {shape === 'ring' ? <circle cx={x} cy={y} r={radius - 1} strokeWidth={2.5} className={`fill-base-background ${STROKE[tone]}`} /> : null}
      {shape === 'square' ? <rect x={x - radius} y={y - radius} width={radius * 2} height={radius * 2} strokeWidth={2} className={`${FILL[tone]} stroke-base-background`} /> : null}
      {shape === 'diamond' ? (
        <rect x={x - radius} y={y - radius} width={radius * 2} height={radius * 2} strokeWidth={2} transform={`rotate(45 ${x} ${y})`} className={`${FILL[tone]} stroke-base-background`} />
      ) : null}
    </g>
  );
}

/** The mark on its own as a small image, for legends and tables. */
export function SiteMarkSwatch({ tone, shape, radius = 6, label }: { tone: Tone; shape: DotShape; radius?: number; label?: string }) {
  const size = radius * 2 + 8;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className="shrink-0">
      <SiteMark x={size / 2} y={size / 2} tone={tone} shape={shape} radius={radius} />
    </svg>
  );
}

