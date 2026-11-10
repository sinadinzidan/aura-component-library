import { cn } from '../../../lib/utils';
import { usePrefersReducedMotion } from '../../three/usePrefersReducedMotion';

import { contourPaths } from './contours';

export type ContourBackdropProps = {
  /** Number of contour lines. */
  lines?: number;
  /** Every nth line carries a bright dashed stream that flows along it. 0 turns streams off. */
  streamEvery?: number;
  /** Lets the streams move. Motion also stops when the user prefers reduced motion. */
  animated?: boolean;
  className?: string;
};

const WIDTH = 1200;
const HEIGHT = 720;

const GLOW_A =
  'bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary-background)_38%,transparent),transparent)]';
const GLOW_B = 'bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--chart-2-450)_26%,transparent),transparent)]';
const LINE = 'stroke-[color-mix(in_oklab,var(--primary-background)_34%,transparent)]';
const STREAM = 'stroke-[color-mix(in_oklab,var(--primary-background)_90%,var(--base-foreground))]';

/**
 * A full-bleed living backdrop: a field of flowing contour lines over two soft pools of accent
 * light, with dashed streams drifting along some of the lines. It is decoration, hidden from
 * assistive technology, and fills its nearest positioned ancestor. Pick it behind glass panels,
 * where the blur needs something to work on.
 */
export function ContourBackdrop({ lines = 16, streamEvery = 4, animated = true, className }: ContourBackdropProps) {
  const reducedMotion = usePrefersReducedMotion();
  const moving = animated && !reducedMotion;
  const paths = contourPaths({ width: WIDTH, height: HEIGHT, count: lines });

  return (
    <div
      data-slot="contour-backdrop"
      data-moving={moving}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-base-background', className)}
    >
      <div className={cn('absolute -top-1/4 -left-1/4 h-full w-3/4', GLOW_A)} />
      <div className={cn('absolute -right-1/4 -bottom-1/3 h-full w-3/4', GLOW_B)} />
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" fill="none" className="absolute inset-0 h-full w-full">
        {paths.map((path, index) => (
          <path key={path} data-slot="contour-line" d={path} strokeWidth={index % 4 === 0 ? 1.5 : 1} vectorEffect="non-scaling-stroke" className={LINE} />
        ))}
        {streamEvery > 0
          ? paths
              .filter((_, index) => index % streamEvery === 1)
              .map((path, index) => (
                <path
                  key={path}
                  data-slot="contour-stream"
                  d={path}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="4 132"
                  vectorEffect="non-scaling-stroke"
                  className={STREAM}
                >
                  {moving ? (
                    <animate attributeName="stroke-dashoffset" from="0" to={index % 2 === 0 ? '-272' : '272'} dur={`${14 + index * 3}s`} repeatCount="indefinite" />
                  ) : null}
                </path>
              ))
          : null}
      </svg>
    </div>
  );
}
