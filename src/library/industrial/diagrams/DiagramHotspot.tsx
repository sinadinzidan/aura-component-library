import type { KeyboardEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type DiagramHotspotProps = {
  /** Clickable area in diagram units. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Accessible name: what selecting this area shows. */
  label: string;
  selected?: boolean;
  onSelect: () => void;
  /** The symbols and labels inside the area. */
  children?: ReactNode;
  className?: string;
};

/**
 * A selectable region of a diagram: a unit, a feeder or an area. It behaves as a toggle button
 * for mouse and keyboard, shows hover and focus, and marks the selection with an outline and a
 * surface, not a colour. Use it inside an `interactive` `DiagramCanvas`.
 */
export function DiagramHotspot({ x, y, width, height, label, selected = false, onSelect, children, className }: DiagramHotspotProps) {
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      data-slot="diagram-hotspot"
      data-selected={selected}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn('group cursor-pointer outline-none', className)}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        strokeWidth={selected ? 1.5 : 1}
        vectorEffect="non-scaling-stroke"
        className={cn(
          'transition-colors group-focus-visible:stroke-ring-default',
          selected ? 'fill-muted-background stroke-emphasized' : 'fill-transparent stroke-transparent group-hover:fill-muted-background'
        )}
      />
      {children}
    </g>
  );
}
