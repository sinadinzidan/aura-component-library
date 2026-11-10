import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type DiagramCanvasProps = {
  /** What the diagram shows, in one sentence. Read out instead of the drawing. */
  label: string;
  /** Size of the drawing in diagram units. One unit is one pixel at full size. */
  width: number;
  height: number;
  /**
   * Set when the diagram holds controls, such as selectable units. The frame then becomes a
   * labelled group, so the controls inside stay reachable.
   */
  interactive?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * The frame every schematic is drawn in: a sized SVG with an accessible name. It shrinks to fit
 * a narrow container and never grows past its drawn size, so strokes and text stay crisp.
 */
export function DiagramCanvas({ label, width, height, interactive = false, children, className }: DiagramCanvasProps) {
  return (
    <svg
      role={interactive ? 'group' : 'img'}
      aria-label={label}
      data-slot="diagram-canvas"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: width }}
      fill="none"
      className={cn('mx-auto block h-auto text-medium-foreground', className)}
    >
      {children}
    </svg>
  );
}
