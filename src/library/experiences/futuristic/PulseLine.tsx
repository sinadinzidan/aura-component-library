import { cn } from '../../../lib/utils';

import { NEON_FILL, NEON_STROKE, NEON_SVG_GLOW, NEON_TONE } from './neon';
import type { NeonTone } from './neon';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export type PulseLineProps = {
  /** SVG path the line follows, in the user units of the surrounding `<svg>`. */
  d: string;
  tone?: NeonTone;
  /** Number of pulses travelling the line at once. */
  pulses?: number;
  /** Seconds one pulse takes to travel the line. */
  duration?: number;
  /** Dashed, for a route that is planned or idle. Idle lines carry no pulses. */
  idle?: boolean;
  /** Overrides the system motion preference. */
  animated?: boolean;
};

/**
 * A thin neon connector with pulses of light travelling along it, to show which way something
 * flows. An SVG fragment: place it inside an `<svg>`. Pulses are decoration — they stop when the
 * system asks for reduced motion, and the line alone still shows the route.
 */
export function PulseLine({ d, tone = 'accent', pulses = 1, duration = 4, idle = false, animated }: PulseLineProps) {
  const reducedMotion = usePrefersReducedMotion();
  const moving = !idle && (animated ?? !reducedMotion);
  const count = Math.max(0, Math.floor(pulses));

  return (
    <g data-slot="pulse-line" data-tone={tone} aria-hidden="true" fill="none" className={NEON_TONE[tone]}>
      <path d={d} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={0.14} className={NEON_STROKE} />
      <path
        d={d}
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={idle ? '5 5' : undefined}
        opacity={idle ? 0.6 : 0.9}
        className={NEON_STROKE}
      />
      {moving
        ? Array.from({ length: count }, (_, index) => (
            <circle key={index} data-slot="pulse" r={3} className={cn(NEON_FILL, NEON_SVG_GLOW)}>
              <animateMotion dur={`${duration}s`} begin={`${(-duration * index) / count}s`} repeatCount="indefinite" path={d} />
            </circle>
          ))
        : null}
    </g>
  );
}
