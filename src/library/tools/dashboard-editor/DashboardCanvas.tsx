import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import type { EditorAction, EditorDrag, EditorWidget } from './editorReducer';
import { bottom, describePlacement } from './gridLayout';
import { cellsToPixels, deltaToCells, gridMetrics } from './gridMetrics';
import type { GridMetrics } from './gridMetrics';
import { WidgetChrome } from './WidgetChrome';
import type { ResizeAxis } from './WidgetChrome';

type DashboardCanvasProps = {
  /** Accessible name of the grid: "Compression overview dashboard". */
  label: string;
  widgets: readonly EditorWidget[];
  /** Number of grid columns. Use 1 for the stacked layout on narrow screens. */
  cols?: number;
  /** Height of one grid row in pixels. */
  rowHeight?: number;
  /** Gap between cells in pixels. */
  gap?: number;
  /** Shows outlines and handles and turns on dragging and the keyboard. */
  editing?: boolean;
  selectedId?: string | null;
  /** The drag in progress, from the editor state. */
  drag?: EditorDrag | null;
  /** Draws one widget. It is rendered inert while editing. */
  renderWidget: (widget: EditorWidget) => ReactNode;
  /** Icon buttons shown on a widget in edit mode. */
  renderActions?: (widget: EditorWidget) => ReactNode;
  /** Every interaction is reported as an editor action. */
  onAction?: (action: EditorAction) => void;
  /** Shown instead of the grid when there are no widgets. */
  empty?: ReactNode;
  className?: string;
};

type PointerDrag = {
  id: string;
  kind: 'move' | 'resize';
  axis: ResizeAxis;
  pointerId: number;
  startX: number;
  startY: number;
  origin: EditorWidget;
  metrics: GridMetrics;
  started: boolean;
};

/** What the dragged widget needs to stay under the pointer while its cell snaps. */
type Follow = { id: string; dx: number; dy: number; originX: number; originY: number; metrics: GridMetrics };

/** Pointer travel, in pixels, before a press becomes a drag. */
const DRAG_THRESHOLD = 4;

const ARROWS: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const noop = () => undefined;

/**
 * The dashboard grid. Widgets sit in CSS grid cells, so the layout holds in every theme and at
 * every width; pixels are only measured while dragging, to turn pointer travel into cells. In edit
 * mode a widget can be dragged to move, resized from its corner or edges, and driven from the
 * keyboard: arrow keys move, Shift+arrows resize, Enter picks up and drops, Escape cancels, Delete
 * removes. The canvas keeps no layout of its own — it reports actions and draws what it is given.
 */
export function DashboardCanvas({
  label,
  widgets,
  cols = 12,
  rowHeight = 72,
  gap = 16,
  editing = false,
  selectedId = null,
  drag = null,
  renderWidget,
  renderActions,
  onAction = noop,
  empty,
  className,
}: DashboardCanvasProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<PointerDrag | null>(null);
  const [follow, setFollow] = useState<Follow | null>(null);

  if (widgets.length === 0 && empty) return <div className={cn('w-full', className)}>{empty}</div>;

  const beginPointer = (widget: EditorWidget, kind: 'move' | 'resize', axis: ResizeAxis, event: PointerEvent<HTMLElement>) => {
    if (!editing || event.button !== 0 || pointer.current || drag) return;
    const width = gridRef.current?.getBoundingClientRect().width ?? 0;
    pointer.current = {
      id: widget.id,
      kind,
      axis,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: widget,
      metrics: gridMetrics(width, cols, rowHeight, gap),
      started: false,
    };
    const item = gridRef.current?.querySelector<HTMLElement>(`[data-widget-id="${widget.id}"]`);
    item?.focus();
    if (item && typeof item.setPointerCapture === 'function') item.setPointerCapture(event.pointerId);
    onAction({ type: 'select', id: widget.id });
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const active = pointer.current;
    if (!active || event.pointerId !== active.pointerId) return;
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    if (!active.started) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      active.started = true;
      onAction({ type: 'dragStart', id: active.id, kind: active.kind });
    }
    const cells = deltaToCells(dx, dy, active.metrics);
    if (active.kind === 'move') {
      setFollow({ id: active.id, dx, dy, originX: active.origin.x, originY: active.origin.y, metrics: active.metrics });
      onAction({ type: 'dragMove', x: active.origin.x + cells.cols, y: active.origin.y + cells.rows });
    } else {
      const w = active.axis === 'height' ? active.origin.w : active.origin.w + cells.cols;
      const h = active.axis === 'width' ? active.origin.h : active.origin.h + cells.rows;
      onAction({ type: 'dragResize', w, h });
    }
  };

  const finishPointer = (event: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const active = pointer.current;
    if (!active || event.pointerId !== active.pointerId) return;
    pointer.current = null;
    setFollow(null);
    if (active.started) onAction({ type: cancelled ? 'dragCancel' : 'dragEnd' });
  };

  const onKeyDown = (widget: EditorWidget, event: KeyboardEvent<HTMLElement>) => {
    if (!editing || event.target !== event.currentTarget) return;
    const dragging = drag?.id === widget.id;
    const arrow = ARROWS[event.key];
    if (event.key === 'Escape' && (dragging || pointer.current)) {
      event.preventDefault();
      pointer.current = null;
      setFollow(null);
      onAction({ type: 'dragCancel' });
      return;
    }
    if (pointer.current) return;
    if (arrow) {
      event.preventDefault();
      const [dx, dy] = arrow;
      if (dragging) onAction({ type: 'dragNudge', dx, dy });
      else if (event.shiftKey) onAction({ type: 'grow', id: widget.id, dw: dx, dh: dy });
      else onAction({ type: 'nudge', id: widget.id, dx, dy });
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onAction(dragging ? { type: 'dragEnd' } : { type: 'dragStart', id: widget.id, kind: event.shiftKey ? 'resize' : 'move' });
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && !dragging) {
      event.preventDefault();
      onAction({ type: 'remove', id: widget.id });
      gridRef.current?.focus();
    }
  };

  const rows = bottom(widgets);

  return (
    <div
      ref={gridRef}
      role="group"
      aria-label={label}
      tabIndex={-1}
      data-slot="dashboard-canvas"
      data-editing={editing ? 'true' : undefined}
      className={cn('relative grid w-full outline-none', className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: `${rowHeight}px`, gap: `${gap}px` }}
    >
      {editing && drag
        ? Array.from({ length: cols }, (_, column) => (
            <div
              key={`guide-${column}`}
              aria-hidden="true"
              data-slot="grid-guide"
              className="pointer-events-none rounded-md bg-muted-background"
              style={{ gridColumn: column + 1, gridRow: `1 / span ${Math.max(rows, 1)}` }}
            />
          ))
        : null}
      {widgets.map((widget) => {
        const dragging = drag?.id === widget.id;
        const selected = selectedId === widget.id;
        const snapped = follow && follow.id === widget.id && dragging ? cellsToPixels(widget.x - follow.originX, widget.y - follow.originY, follow.metrics) : null;
        const cell = { gridColumn: `${widget.x + 1} / span ${widget.w}`, gridRow: `${widget.y + 1} / span ${widget.h}` };
        return (
          <div key={widget.id} className="contents">
            {dragging && drag.kind === 'move' ? (
              <div aria-hidden="true" data-slot="drop-placeholder" className="rounded-xl border-2 border-dashed border-primary-background bg-muted-background" style={cell} />
            ) : null}
            <div
              role="group"
              aria-label={editing ? `${widget.title} widget, ${describePlacement(widget)}` : widget.title}
              aria-roledescription={editing ? 'movable widget' : undefined}
              tabIndex={editing ? 0 : undefined}
              data-widget-id={widget.id}
              data-selected={selected ? 'true' : undefined}
              data-dragging={dragging ? 'true' : undefined}
              className={cn(
                'min-w-0 rounded-xl outline-none',
                editing ? 'touch-none focus-visible:shadow-focus-ring' : undefined,
                editing && !dragging ? 'cursor-grab' : undefined,
                dragging ? 'z-20 cursor-grabbing' : undefined,
              )}
              style={{
                ...cell,
                transform: follow && snapped ? `translate(${follow.dx - snapped.x}px, ${follow.dy - snapped.y}px)` : undefined,
              }}
              onFocus={(event) => {
                if (editing && !pointer.current && event.target === event.currentTarget && !selected) onAction({ type: 'select', id: widget.id });
              }}
              onPointerDown={(event) => {
                // Popovers render in a portal but their events still bubble through React.
                if (!(event.target instanceof Element) || !event.currentTarget.contains(event.target) || event.target.closest('[data-no-drag]')) return;
                beginPointer(widget, 'move', 'both', event);
              }}
              onPointerMove={onPointerMove}
              onPointerUp={(event) => finishPointer(event, false)}
              onPointerCancel={(event) => finishPointer(event, true)}
              onKeyDown={(event) => onKeyDown(widget, event)}
            >
              <WidgetChrome
                editing={editing}
                selected={selected}
                dragging={dragging}
                sizeLabel={`${widget.w} × ${widget.h}`}
                actions={editing && !drag ? renderActions?.(widget) : undefined}
                onResizeStart={editing && cols > 1 ? (axis, event) => beginPointer(widget, 'resize', axis, event) : undefined}
              >
                {renderWidget(widget)}
              </WidgetChrome>
            </div>
          </div>
        );
      })}
    </div>
  );
}
