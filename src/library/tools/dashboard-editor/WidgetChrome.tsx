import type { PointerEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type ResizeAxis = 'both' | 'width' | 'height';

type WidgetChromeProps = {
  /** The widget itself. In edit mode it is inert: pointer and keyboard go to the chrome. */
  children: ReactNode;
  /** Shows the outline, the action cluster and the resize handles. */
  editing?: boolean;
  selected?: boolean;
  /** Lifted from the grid and following the pointer or the arrow keys. */
  dragging?: boolean;
  /** Size in cells, shown in the corner while editing: "4 × 3". */
  sizeLabel?: string;
  /** Icon buttons for this widget: settings, duplicate, remove. */
  actions?: ReactNode;
  /** Starts a resize from the corner or an edge. Leave out to make the widget fixed-size. */
  onResizeStart?: (axis: ResizeAxis, event: PointerEvent<HTMLElement>) => void;
};

/** React 18 has no `inert` prop, so the attribute is set on the node. */
const setInert = (node: HTMLDivElement | null) => node?.setAttribute('inert', '');

const HANDLE = 'absolute z-10 touch-none rounded-sm outline-none';

/**
 * The edit-mode shell around one dashboard widget: a dashed outline that turns solid when the
 * widget is selected, a cluster of actions in the top corner, the size in cells, and resize
 * handles on the right edge, the bottom edge and the corner. In view mode it renders the widget
 * untouched, so switching modes never changes a widget's size.
 */
export function WidgetChrome({ children, editing = false, selected = false, dragging = false, sizeLabel, actions, onResizeStart }: WidgetChromeProps) {
  if (!editing) return <div className="h-full min-w-0">{children}</div>;

  return (
    <div
      data-slot="widget-chrome"
      data-selected={selected ? 'true' : undefined}
      data-dragging={dragging ? 'true' : undefined}
      className={cn(
        'relative h-full min-w-0 rounded-xl border border-dashed',
        selected || dragging ? 'border-solid border-primary-background' : 'border-emphasized',
        dragging ? 'opacity-90' : undefined,
      )}
    >
      <div ref={setInert} className="pointer-events-none h-full min-w-0 select-none">
        {children}
      </div>
      {actions ? (
        <div data-no-drag className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-card-background">
          {actions}
        </div>
      ) : null}
      {sizeLabel && (selected || dragging) ? (
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-2 z-10 rounded-md bg-muted-background px-2 py-0.5 text-xs font-medium tabular-nums text-medium-foreground"
        >
          {sizeLabel}
        </span>
      ) : null}
      {onResizeStart ? (
        <>
          <span
            aria-hidden="true"
            data-no-drag
            data-resize="width"
            onPointerDown={(event) => onResizeStart('width', event)}
            className={cn(HANDLE, 'top-1/4 -right-1 h-1/2 w-2 cursor-ew-resize hover:bg-primary-background')}
          />
          <span
            aria-hidden="true"
            data-no-drag
            data-resize="height"
            onPointerDown={(event) => onResizeStart('height', event)}
            className={cn(HANDLE, '-bottom-1 left-1/4 h-2 w-1/2 cursor-ns-resize hover:bg-primary-background')}
          />
          <span
            aria-hidden="true"
            data-no-drag
            data-resize="both"
            onPointerDown={(event) => onResizeStart('both', event)}
            className={cn(
              HANDLE,
              '-right-1 -bottom-1 size-4 cursor-nwse-resize border-r-2 border-b-2',
              selected || dragging ? 'border-primary-background' : 'border-emphasized hover:border-primary-background',
            )}
          />
        </>
      ) : null}
    </div>
  );
}
