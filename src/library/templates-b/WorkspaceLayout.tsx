import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type WorkspaceLayoutProps = {
  /** Accessible name of the workspace: "Plant assistant". */
  label: string;
  /** A bar across the top: conversation title, model or scope, page actions. */
  header?: ReactNode;
  /** Left column: conversation history or navigation. */
  sidebar?: ReactNode;
  sidebarLabel?: string;
  /** The conversation. Give it a `ChatThread`; it gets the remaining height. */
  thread: ReactNode;
  threadLabel?: string;
  /** Pinned under the thread: the prompt input. */
  composer?: ReactNode;
  /** The work surface beside the thread: a chart, a document, a table, a plan. */
  canvas?: ReactNode;
  canvasLabel?: string;
  /** Right column: sources, context, run details. */
  rail?: ReactNode;
  railLabel?: string;
  /** Which side of the canvas the thread sits on. Only used with a canvas. */
  threadSide?: 'left' | 'right';
  /**
   * Width of the thread. `reading` centres it at a comfortable measure when it has the page to
   * itself; `column` fixes it as a side column next to a canvas; `fill` takes all the room.
   */
  threadWidth?: 'reading' | 'column' | 'fill';
  className?: string;
};

/**
 * The layout of an AI workspace as named slots: an optional history sidebar, the thread with its
 * composer, an optional canvas and an optional rail. Every slot scrolls on its own and the layout
 * fills the height of its container, so the prompt never leaves the screen. The canvas, when there
 * is one, gets the flexible width and the thread becomes a fixed column beside it.
 */
export function WorkspaceLayout({
  label,
  header,
  sidebar,
  sidebarLabel = 'Conversations',
  thread,
  threadLabel = 'Conversation',
  composer,
  canvas,
  canvasLabel = 'Canvas',
  rail,
  railLabel = 'Sources',
  threadSide = 'left',
  threadWidth,
  className,
}: WorkspaceLayoutProps) {
  const hasCanvas = canvas !== undefined && canvas !== null;
  const width = threadWidth ?? (hasCanvas ? 'column' : 'reading');

  return (
    <div
      role="region"
      aria-label={label}
      data-slot="workspace"
      className={cn('flex h-full min-h-0 w-full min-w-0 flex-col bg-base-background', className)}
    >
      {header ? (
        <header data-slot="workspace-header" className="flex min-h-12 shrink-0 items-center gap-3 border-b border-default px-4 py-2">
          {header}
        </header>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1">
        {sidebar ? (
          <nav
            aria-label={sidebarLabel}
            data-slot="workspace-sidebar"
            className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-default bg-muted-background"
          >
            {sidebar}
          </nav>
        ) : null}
        <section
          aria-label={threadLabel}
          data-slot="workspace-thread"
          data-width={width}
          className={cn(
            'flex min-h-0 min-w-0 flex-col',
            width === 'column' ? 'w-88 shrink-0' : 'flex-1',
            hasCanvas && threadSide === 'right' ? 'order-2 border-l border-default' : undefined,
            hasCanvas && threadSide === 'left' ? 'border-r border-default' : undefined
          )}
        >
          <div className={cn('flex min-h-0 w-full flex-1 flex-col px-4 pt-3', width === 'reading' ? 'mx-auto max-w-2xl' : undefined)}>
            {thread}
          </div>
          {composer ? (
            <div data-slot="workspace-composer" className={cn('w-full shrink-0 px-4 pb-4', width === 'reading' ? 'mx-auto max-w-2xl' : undefined)}>
              {composer}
            </div>
          ) : null}
        </section>
        {hasCanvas ? (
          <section
            aria-label={canvasLabel}
            data-slot="workspace-canvas"
            className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-muted-background', threadSide === 'right' ? 'order-1' : undefined)}
          >
            {canvas}
          </section>
        ) : null}
        {rail ? (
          <aside
            aria-label={railLabel}
            data-slot="workspace-rail"
            className="order-3 flex w-64 shrink-0 flex-col overflow-y-auto border-l border-default"
          >
            {rail}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
