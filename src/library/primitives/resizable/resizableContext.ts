import { createContext, useContext } from 'react';
import type { RefObject } from 'react';

import type { PaneAction, PaneLayout, PaneSpec } from './paneSizing';

export type ResizableContextValue = {
  orientation: 'horizontal' | 'vertical';
  specs: readonly PaneSpec[];
  layout: PaneLayout;
  dispatch: (action: PaneAction) => void;
  /** The group element, measured to turn pointer distance into percent. */
  groupRef: RefObject<HTMLDivElement>;
  /** DOM id of each pane, for `aria-controls`. */
  paneIds: readonly string[];
  /** Accessible name of each pane, for handle labels and announcements. */
  paneLabels: readonly string[];
  /** True while a handle is being dragged; panes skip their size transition. */
  dragging: boolean;
  setDragging: (dragging: boolean) => void;
  /** Asks the group to announce the size of the pane before `handle` after the next change. */
  announce: (handle: number) => void;
};

export const ResizableContext = createContext<ResizableContextValue | null>(null);

/** Position of a `Pane` or `PaneHandle` among its siblings, set by `ResizablePanes`. */
export const ResizableIndexContext = createContext<number>(-1);

/** Reads the nearest `ResizablePanes`. Throws when a part is rendered outside one. */
export function useResizableContext(): ResizableContextValue {
  const context = useContext(ResizableContext);
  if (!context) throw new Error('Pane and PaneHandle must be direct children of <ResizablePanes>.');
  return context;
}
