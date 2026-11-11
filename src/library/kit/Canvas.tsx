import type { ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { cx } from './tones';

type CanvasProps = {
  /** `none` when the content brings its own edge, such as console panels that run edge to edge. */
  padding?: 'look' | 'none';
  /** Layout classes. */
  className?: string;
  children: ReactNode;
};

/**
 * The page backdrop of a look: tinted in studio, hairline-coloured in console, a gradient in
 * glass, grid paper in blueprint. Everything on a kit screen sits on one.
 */
export function Canvas({ padding = 'look', className, children }: CanvasProps) {
  const look = useLook();
  return (
    <div data-look={look} data-pad={padding} className={cx('kit-canvas', className)}>
      {children}
    </div>
  );
}
