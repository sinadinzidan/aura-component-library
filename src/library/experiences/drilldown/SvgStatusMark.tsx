import type { DotShape, Tone } from '../../industrial/status';

export type SvgStatusMarkProps = {
  /** Centre, in the units of the surrounding SVG. */
  x: number;
  y: number;
  /** Width and height of the mark. */
  size?: number;
  tone: Tone;
  /** Repeats the state in shape, so it reads without colour. */
  shape?: DotShape;
  className?: string;
};

const FILL: Record<Tone, string> = {
  neutral: 'fill-neutral-foreground-strong stroke-neutral-foreground-strong',
  success: 'fill-success-foreground-strong stroke-success-foreground-strong',
  warning: 'fill-warning-foreground-strong stroke-warning-foreground-strong',
  critical: 'fill-critical-foreground-strong stroke-critical-foreground-strong',
  info: 'fill-info-foreground-strong stroke-info-foreground-strong',
};

/**
 * The status dot of the industrial grammar as an SVG mark, for plans, rings and other drawings
 * where an HTML dot cannot go: dot, ring, square or diamond in the tone of the state.
 */
export function SvgStatusMark({ x, y, size = 10, tone, shape = 'dot', className = '' }: SvgStatusMarkProps) {
  const half = size / 2;
  const shared = { 'data-slot': 'svg-status-mark', 'data-tone': tone, 'data-shape': shape, 'aria-hidden': true } as const;
  const classes = `${FILL[tone]} ${className}`.trim();

  if (shape === 'ring') {
    return <circle {...shared} cx={x} cy={y} r={half - 1} strokeWidth={2} fillOpacity={0} className={classes} />;
  }
  if (shape === 'square') {
    return <rect {...shared} x={x - half * 0.85} y={y - half * 0.85} width={size * 0.85} height={size * 0.85} rx={1} strokeWidth={0} className={classes} />;
  }
  if (shape === 'diamond') {
    const side = size * 0.74;
    return (
      <rect
        {...shared}
        x={x - side / 2}
        y={y - side / 2}
        width={side}
        height={side}
        rx={1}
        strokeWidth={0}
        transform={`rotate(45 ${x} ${y})`}
        className={classes}
      />
    );
  }
  return <circle {...shared} cx={x} cy={y} r={half} strokeWidth={0} className={classes} />;
}
