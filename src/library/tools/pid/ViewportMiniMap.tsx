import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import type { PlanRect } from '../../experiences/drilldown/planLayout';

import { clipRect, overviewPoint } from './viewport';
import type { ViewPoint } from './viewport';

export type ViewportMiniMapProps = {
  /** The whole drawing, in world units. */
  world: PlanRect;
  /** The part currently on screen, in world units. */
  viewport: PlanRect;
  /** Accessible name, e.g. "Mini-map of NK-23-PID-0001". */
  label: string;
  /** Asks the viewer to centre on a world point: a click, a drag or an arrow key. */
  onRecentre: (point: ViewPoint) => void;
  /** A simplified drawing in world units. */
  children: ReactNode;
  className?: string;
};

/** Share of the viewport one arrow-key press moves the frame. */
const KEY_STEP = 0.25;

/**
 * An overview of a zoomable canvas with a frame marking what is on screen. Click or drag on it to
 * move the view there; with focus, the arrow keys nudge the frame. It is one button, so it takes a
 * single tab stop however much it draws.
 */
export function ViewportMiniMap({ world, viewport, label, onRecentre, children, className }: ViewportMiniMapProps) {
  const frame = clipRect(viewport, world);
  const centre = { x: viewport.x + viewport.width / 2, y: viewport.y + viewport.height / 2 };

  const recentreFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    onRecentre(overviewPoint(world, box, event.clientX, event.clientY));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step: Record<string, ViewPoint> = {
      ArrowLeft: { x: -viewport.width * KEY_STEP, y: 0 },
      ArrowRight: { x: viewport.width * KEY_STEP, y: 0 },
      ArrowUp: { x: 0, y: -viewport.height * KEY_STEP },
      ArrowDown: { x: 0, y: viewport.height * KEY_STEP },
    };
    const delta = step[event.key];
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    onRecentre({ x: centre.x + delta.x, y: centre.y + delta.y });
  };

  return (
    <button
      type="button"
      data-slot="viewport-mini-map"
      aria-label={label}
      aria-description="Click or drag to move the view. Arrow keys nudge it."
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        recentreFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons === 1) recentreFromPointer(event);
      }}
      onKeyDown={handleKeyDown}
      className={cn(
        'block w-44 cursor-crosshair touch-none overflow-hidden rounded-md border border-default bg-base-background outline-none focus-visible:ring-2 focus-visible:ring-ring-default',
        className
      )}
    >
      <svg viewBox={`${world.x} ${world.y} ${world.width} ${world.height}`} preserveAspectRatio="none" fill="none" aria-hidden="true" className="pointer-events-none block w-full" style={{ aspectRatio: `${world.width} / ${world.height}` }}>
        {children}
        <rect
          data-slot="viewport-mini-map-frame"
          x={frame.x}
          y={frame.y}
          width={Math.max(frame.width, world.width * 0.03)}
          height={Math.max(frame.height, world.height * 0.03)}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          className="fill-info-background/40 stroke-info-foreground-strong"
        />
      </svg>
    </button>
  );
}
