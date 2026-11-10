import { cn } from '../../../lib/utils';

import { NEON_STROKE, NEON_SVG_GLOW, NEON_TONE } from './neon';
import type { NeonTone } from './neon';

export type ReticleProps = {
  /** Centre, in the user units of the surrounding `<svg>`. */
  x: number;
  y: number;
  /** Half the side of the bracket square. */
  size?: number;
  /** Locked draws tight and bright with a turning ring; unlocked is a wide, dim idle mark. */
  locked?: boolean;
  tone?: NeonTone;
};

/**
 * A lock-on marker: four corner brackets, cross ticks and a slowly turning dashed ring. It
 * slides to its new position when `x` and `y` change, which is what makes a selection feel like
 * a target lock. An SVG fragment, purely decorative — the thing it marks carries the semantics.
 */
export function Reticle({ x, y, size = 14, locked = true, tone = 'accent' }: ReticleProps) {
  const half = locked ? size : size * 1.8;
  const arm = half * 0.45;
  const corners = [
    `M ${-half} ${-half + arm} V ${-half} H ${-half + arm}`,
    `M ${half - arm} ${-half} H ${half} V ${-half + arm}`,
    `M ${half} ${half - arm} V ${half} H ${half - arm}`,
    `M ${-half + arm} ${half} H ${-half} V ${half - arm}`,
  ];
  const ticks = [
    `M 0 ${-half - 6} V ${-half - 1}`,
    `M 0 ${half + 1} V ${half + 6}`,
    `M ${-half - 6} 0 H ${-half - 1}`,
    `M ${half + 1} 0 H ${half + 6}`,
  ];

  return (
    <g
      data-slot="reticle"
      data-locked={locked ? 'true' : 'false'}
      aria-hidden="true"
      fill="none"
      style={{ transform: `translate(${x}px, ${y}px)` }}
      className={cn(
        NEON_TONE[tone],
        NEON_STROKE,
        'pointer-events-none motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out',
        locked ? '' : 'opacity-50'
      )}
    >
      <g strokeWidth={2} strokeLinecap="square" className={locked ? NEON_SVG_GLOW : undefined}>
        {corners.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g strokeWidth={1}>
        {ticks.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {locked ? (
        <circle
          data-slot="reticle-ring"
          r={half * 1.75}
          strokeWidth={1}
          strokeDasharray="2 6"
          className="origin-center [transform-box:fill-box] motion-safe:animate-spin motion-safe:[animation-duration:12s]"
        />
      ) : null}
    </g>
  );
}
