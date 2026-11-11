import { cn } from '@cognite/aura/utils';
import { useContext, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { collapseTarget, handleRange } from './paneSizing';
import { ResizableIndexContext, useResizableContext } from './resizableContext';

export type PaneHandleProps = {
  /** `line` is a hairline that thickens on hover; `grip` adds a visible pill for discoverability. */
  variant?: 'line' | 'grip';
  /** Percent moved per arrow key press. Shift moves five times as far. */
  step?: number;
  /** Replaces the default "Resize <pane>" label. */
  'aria-label'?: string;
  /** Layout classes only. */
  className?: string;
};

type DragOrigin = { position: number; sizes: readonly number[] };

/**
 * The divider between two panes. Drag it, or focus it and use the arrow keys; Home and End jump
 * to the limits, Enter collapses or expands a collapsible neighbour, a double-click resets the
 * group and Escape cancels a drag. It is a `role="separator"` that reports the size of the pane
 * before it. Must be a direct child of `ResizablePanes`, between two `Pane`s.
 */
export function PaneHandle({ variant = 'line', step = 2, 'aria-label': ariaLabel, className }: PaneHandleProps) {
  const handle = useContext(ResizableIndexContext);
  const { orientation, specs, layout, dispatch, groupRef, paneIds, paneLabels, dragging, setDragging, announce } =
    useResizableContext();
  const origin = useRef<DragOrigin | null>(null);
  const [active, setActive] = useState(false);
  const horizontal = orientation === 'horizontal';
  const range = handleRange(specs, layout, handle);
  const target = collapseTarget(specs, handle);
  const paneLabel = paneLabels[handle] ?? 'pane';

  const endDrag = () => {
    if (!origin.current) return;
    origin.current = null;
    setActive(false);
    setDragging(false);
    announce(handle);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    origin.current = { position: horizontal ? event.clientX : event.clientY, sizes: layout.sizes };
    setActive(true);
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = origin.current;
    const box = groupRef.current?.getBoundingClientRect();
    if (!start || !box) return;
    const extent = horizontal ? box.width : box.height;
    if (extent <= 0) return;
    const position = horizontal ? event.clientX : event.clientY;
    dispatch({ type: 'drag', handle, origin: start.sizes, delta: ((position - start.position) / extent) * 100 });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const distance = event.shiftKey ? step * 5 : step;
    const back = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const forward = horizontal ? 'ArrowRight' : 'ArrowDown';
    if (event.key === 'Escape' && origin.current) {
      dispatch({ type: 'set', sizes: origin.current.sizes });
      endDrag();
    } else if (event.key === back) dispatch({ type: 'nudge', handle, delta: -distance });
    else if (event.key === forward) dispatch({ type: 'nudge', handle, delta: distance });
    else if (event.key === 'Home') dispatch({ type: 'limit', handle, to: 'min' });
    else if (event.key === 'End') dispatch({ type: 'limit', handle, to: 'max' });
    else if (event.key === 'Enter' && target !== null) {
      dispatch({ type: 'toggle', pane: target, neighbour: target === handle ? handle + 1 : handle });
    } else return;
    event.preventDefault();
    announce(handle);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={horizontal ? 'vertical' : 'horizontal'}
      aria-label={ariaLabel ?? `Resize ${paneLabel}`}
      aria-controls={paneIds[handle]}
      aria-valuenow={Math.round(layout.sizes[handle] ?? 0)}
      aria-valuemin={Math.round(range.min)}
      aria-valuemax={Math.round(range.max)}
      aria-valuetext={layout.collapsed[handle] ? `${paneLabel} collapsed` : undefined}
      data-slot="pane-handle"
      data-variant={variant}
      data-orientation={orientation}
      data-dragging={dragging && active ? '' : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={() => {
        dispatch({ type: 'reset' });
        announce(handle);
      }}
      onKeyDown={onKeyDown}
      className={cn(
        'group/handle relative z-10 flex shrink-0 touch-none items-center justify-center bg-default outline-none select-none',
        'hover:bg-emphasized focus-visible:shadow-focus-ring data-dragging:bg-emphasized',
        'after:absolute after:content-[""]',
        horizontal
          ? 'cursor-col-resize after:inset-y-0 after:-right-1 after:-left-1'
          : 'cursor-row-resize after:inset-x-0 after:-top-1 after:-bottom-1',
        variant === 'grip' ? (horizontal ? 'w-2' : 'h-2') : horizontal ? 'w-px' : 'h-px',
        variant === 'grip' ? 'bg-muted-background hover:bg-medium-background data-dragging:bg-medium-background' : '',
        className
      )}
    >
      {variant === 'grip' ? (
        <span
          aria-hidden="true"
          className={cn(
            'rounded-full bg-muted-foreground opacity-60 group-hover/handle:opacity-100 group-data-dragging/handle:opacity-100',
            horizontal ? 'h-8 w-0.5' : 'h-0.5 w-8'
          )}
        />
      ) : null}
    </div>
  );
}
