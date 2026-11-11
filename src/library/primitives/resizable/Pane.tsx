import { cn } from '@cognite/aura/utils';
import { useContext } from 'react';
import type { ReactNode } from 'react';

import { ResizableIndexContext, useResizableContext } from './resizableContext';

export type PaneProps = {
  /** Accessible name, also used in the handle label and in announcements: "Navigation". */
  label: string;
  /** Size on first render and after a reset, in percent of the group. */
  defaultSize?: number;
  /** Smallest size while expanded, in percent. Default 10. */
  minSize?: number;
  /** Largest size, in percent. Default 100. */
  maxSize?: number;
  /** Lets the pane snap shut when dragged below half its minimum, or with Enter on its handle. */
  collapsible?: boolean;
  /** Size while collapsed, in percent: 0 hides the pane, a few percent leaves an icon rail. */
  collapsedSize?: number;
  /** Rendered instead of `children` while collapsed, for an icon rail. */
  collapsedContent?: ReactNode;
  /** Layout classes only. */
  className?: string;
  children: ReactNode;
};

/**
 * One pane of a `ResizablePanes` group. It takes its share of the group and clips what does not
 * fit; put a scrolling container inside when the content is long. Must be a direct child of
 * `ResizablePanes`.
 */
export function Pane({ label, collapsedContent, className, children }: PaneProps) {
  const index = useContext(ResizableIndexContext);
  const { layout, paneIds, dragging } = useResizableContext();
  const size = layout.sizes[index] ?? 0;
  const collapsed = layout.collapsed[index] ?? false;
  const showRail = collapsed && collapsedContent !== undefined;

  return (
    <div
      id={paneIds[index]}
      role="group"
      aria-label={label}
      data-slot="pane"
      data-collapsed={collapsed ? '' : undefined}
      style={{ flex: `${size} ${size} 0%` }}
      className={cn(
        'min-h-0 min-w-0 overflow-hidden',
        dragging ? '' : 'transition-[flex-grow] duration-150 motion-reduce:transition-none',
        className
      )}
    >
      {showRail ? collapsedContent : null}
      <div
        data-slot="pane-content"
        aria-hidden={collapsed || undefined}
        className={cn('size-full min-h-0 min-w-0', showRail ? 'hidden' : '', collapsed ? 'invisible' : '')}
      >
        {children}
      </div>
    </div>
  );
}
