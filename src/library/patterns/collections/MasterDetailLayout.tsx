import { Button } from '@cognite/aura/components/button';
import { IconArrowLeft } from '@cognite/aura/icons';
import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

type MasterDetailLayoutProps = {
  /** The list. Scrolls on its own. */
  master: ReactNode;
  /** The selected record, or an empty state when nothing is selected. Scrolls on its own. */
  detail: ReactNode;
  /** Accessible names of the two panes, for example "Assets" and "Asset details". */
  masterLabel: string;
  detailLabel: string;
  /** Optional first column, such as a hierarchy tree that scopes the list. */
  navigation?: ReactNode;
  navigationLabel?: string;
  /** Share of the width the master pane takes, in percent. */
  masterWidth?: number;
  /** Adds a drag handle between master and detail. Also works with the arrow keys. */
  resizable?: boolean;
  /** `stacked` shows one pane at a time, for narrow containers. */
  mode?: 'split' | 'stacked';
  /** Stacked mode: show the detail instead of the list. */
  detailOpen?: boolean;
  /** Stacked mode: called by the back button above the detail. */
  onBack?: () => void;
  backLabel?: string;
  /** Layout classes for the frame. Give it a height, such as `h-96`. */
  className?: string;
};

const MIN_WIDTH = 24;
const MAX_WIDTH = 60;
const STEP = 4;

function clamp(value: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(value)));
}

/**
 * The frame for a list beside the selected record: one bordered container, a master pane, a
 * detail pane, and optionally a navigation column in front or a resize handle between. Panes
 * scroll independently so the list keeps its place. In `stacked` mode it shows one pane at a
 * time with a back button, for side panels and small screens.
 */
export function MasterDetailLayout({
  master,
  detail,
  masterLabel,
  detailLabel,
  navigation,
  navigationLabel = 'Navigation',
  masterWidth = 36,
  resizable = false,
  mode = 'split',
  detailOpen = false,
  onBack,
  backLabel = 'Back to list',
  className = 'h-96',
}: MasterDetailLayoutProps) {
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(() => clamp(masterWidth));
  const [dragging, setDragging] = useState(false);
  const shell = `flex w-full overflow-hidden rounded-xl border border-default bg-base-background ${className}`;

  if (mode === 'stacked') {
    return (
      <div className={`${shell} flex-col`}>
        {detailOpen ? (
          <section aria-label={detailLabel} className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center border-b border-default px-2 py-2">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <IconArrowLeft /> {backLabel}
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{detail}</div>
          </section>
        ) : (
          <section aria-label={masterLabel} className="min-h-0 flex-1 overflow-y-auto">
            {master}
          </section>
        )}
      </div>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') setWidth((current) => clamp(current - STEP));
    else if (event.key === 'ArrowRight') setWidth((current) => clamp(current + STEP));
    else if (event.key === 'Home') setWidth(MIN_WIDTH);
    else if (event.key === 'End') setWidth(MAX_WIDTH);
    else return;
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = frame.current?.getBoundingClientRect();
    if (!dragging || !box || box.width === 0) return;
    setWidth(clamp(((event.clientX - box.left) / box.width) * 100));
  };

  return (
    <div ref={frame} className={shell}>
      {navigation ? (
        <nav aria-label={navigationLabel} className="w-1/5 min-w-40 shrink-0 overflow-y-auto border-r border-default">
          {navigation}
        </nav>
      ) : null}
      <section
        aria-label={masterLabel}
        data-slot="master-pane"
        className="flex min-w-0 shrink-0 flex-col overflow-y-auto"
        style={{ width: `${width}%` }}
      >
        {master}
      </section>
      {resizable ? (
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={`Resize ${masterLabel.toLowerCase()} pane`}
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          data-dragging={dragging ? '' : undefined}
          onKeyDown={onKeyDown}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          className="group/handle relative flex w-2 shrink-0 cursor-col-resize touch-none items-center justify-center border-l border-default outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring data-dragging:bg-base-background-hover"
        >
          <span aria-hidden="true" className="h-8 w-0.5 rounded-full bg-medium-background group-hover/handle:bg-muted-foreground" />
        </div>
      ) : (
        <div aria-hidden="true" className="shrink-0 border-l border-default" />
      )}
      <section aria-label={detailLabel} className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {detail}
      </section>
    </div>
  );
}
