import type { ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { cx } from './tones';

type CanvasProps = {
  /** `none` when the content brings its own edge, such as console panels that run edge to edge. */
  padding?: 'look' | 'none';
  /** Take the height of the parent and scroll inside it, for a canvas in a fixed-height shell. */
  fill?: boolean;
  /** Layout classes; padding utilities override the look's padding. */
  className?: string;
  children: ReactNode;
};

/**
 * The page backdrop of a look: tinted in studio, hairline-coloured in console, a gradient in
 * glass, grid paper in blueprint. Everything on a kit screen sits on one.
 */
export function Canvas({ padding = 'look', fill = false, className, children }: CanvasProps) {
  const look = useLook();
  return (
    <div data-look={look} data-pad={padding} data-fill={fill ? 'true' : undefined} className={cx('kit-canvas', className)}>
      {children}
    </div>
  );
}
