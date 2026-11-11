import { cn } from '@cognite/aura/utils';
import { Children, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { Pane } from './Pane';
import type { PaneProps } from './Pane';
import { PaneHandle } from './PaneHandle';
import { createLayout, normalizeSpecs, paneLayoutReducer } from './paneSizing';
import type { PaneAction, PaneLayout } from './paneSizing';
import { ResizableContext, ResizableIndexContext } from './resizableContext';

export type ResizablePanesProps = {
  /** `horizontal` puts panes side by side; `vertical` stacks them. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Sizes to start from, one percentage per pane, typically what `onLayoutChange` reported last
   * time. Ignored when the number of panes does not match.
   */
  defaultLayout?: readonly number[];
  /** Called with the new sizes after every change. Store them to restore the layout later. */
  onLayoutChange?: (sizes: readonly number[]) => void;
  /** Layout classes only. Give the group a height, such as `h-96`. */
  className?: string;
  /** `Pane` and `PaneHandle` elements, alternating, as direct children. */
  children: ReactNode;
};

function isPane(child: ReactNode): child is ReactElement<PaneProps> {
  return isValidElement(child) && child.type === Pane;
}

function isHandle(child: ReactNode): child is ReactElement {
  return isValidElement(child) && child.type === PaneHandle;
}

/**
 * A split view: two or more panes with a draggable, keyboard-operable divider between each pair.
 * Sizes are percentages, so the split survives a window resize. The group owns the layout,
 * enforces each pane's limits and announces keyboard changes to assistive technology.
 */
export function ResizablePanes({
  orientation = 'horizontal',
  defaultLayout,
  onLayoutChange,
  className,
  children,
}: ResizablePanesProps) {
  const baseId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);
  const panes = items.filter(isPane);
  const specKey = panes
    .map(({ props }) =>
      [props.defaultSize, props.minSize, props.maxSize, props.collapsible, props.collapsedSize].join(':')
    )
    .join('|');
  const labelKey = panes.map(({ props }) => props.label).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `specKey` captures every sizing prop.
  const specs = useMemo(() => normalizeSpecs(panes.map(({ props }) => props)), [specKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `labelKey` captures every label.
  const paneLabels = useMemo(() => panes.map(({ props }) => props.label), [labelKey]);
  const paneIds = useMemo(() => specs.map((_spec, index) => `${baseId}-pane-${index}`), [baseId, specs]);

  const [layout, setLayout] = useState<PaneLayout>(() => createLayout(specs, defaultLayout));
  const dispatch = useCallback(
    (action: PaneAction) => setLayout((state) => paneLayoutReducer(specs, state, action)),
    [specs]
  );
  const current = useMemo(
    () => (layout.sizes.length === specs.length ? layout : createLayout(specs)),
    [layout, specs]
  );

  const [dragging, setDraggingState] = useState(false);
  const [announced, setAnnounced] = useState<number | null>(null);
  const announce = useCallback((handle: number) => setAnnounced(handle), []);
  const setDragging = useCallback((next: boolean) => {
    if (next) setAnnounced(null);
    setDraggingState(next);
  }, []);
  const announcedLabel = announced === null ? '' : (paneLabels[announced] ?? 'Pane');
  const message =
    announced === null
      ? ''
      : current.collapsed[announced]
        ? `${announcedLabel} collapsed`
        : `${announcedLabel} ${Math.round(current.sizes[announced] ?? 0)} percent`;

  const sizesKey = current.sizes.join(',');
  const reported = useRef(sizesKey);
  useEffect(() => {
    if (reported.current === sizesKey) return;
    reported.current = sizesKey;
    onLayoutChange?.(current.sizes);
  }, [sizesKey, current.sizes, onLayoutChange]);

  const context = useMemo(
    () => ({
      orientation,
      specs,
      layout: current,
      dispatch,
      groupRef,
      paneIds,
      paneLabels,
      dragging,
      setDragging,
      announce,
    }),
    [orientation, specs, current, dispatch, paneIds, paneLabels, dragging, setDragging, announce]
  );

  const slots: ReactNode[] = [];
  let paneCount = 0;
  for (const [position, child] of items.entries()) {
    if (isPane(child)) {
      slots.push(
        <ResizableIndexContext.Provider key={child.key ?? position} value={paneCount}>
          {child}
        </ResizableIndexContext.Provider>
      );
      paneCount += 1;
    } else if (isHandle(child)) {
      slots.push(
        <ResizableIndexContext.Provider key={child.key ?? position} value={paneCount - 1}>
          {child}
        </ResizableIndexContext.Provider>
      );
    } else {
      slots.push(child);
    }
  }

  return (
    <ResizableContext.Provider value={context}>
      <div
        ref={groupRef}
        data-slot="resizable-panes"
        data-orientation={orientation}
        data-dragging={dragging ? '' : undefined}
        className={cn(
          'flex size-full min-h-0 min-w-0 overflow-hidden',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          className
        )}
      >
        {slots}
        <span data-slot="resizable-announcer" aria-live="polite" className="sr-only">
          {message}
        </span>
      </div>
    </ResizableContext.Provider>
  );
}
