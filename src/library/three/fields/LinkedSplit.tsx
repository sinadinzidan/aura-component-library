import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { DEFAULT_SPLIT_LIMITS, clampRatio, describeSplit, ratioFromKey, ratioFromPointer } from './splitRatio';
import type { SplitLimits } from './splitRatio';

export type LinkedSplitProps = {
  /** The left pane. */
  start: ReactNode;
  /** The right pane. */
  end: ReactNode;
  /** Names of the panes, used by the separator and the announcement. */
  startLabel: string;
  endLabel: string;
  /** Share of the width the left pane takes, in percent. Controlled. */
  ratio: number;
  onRatioChange: (ratio: number) => void;
  limits?: SplitLimits;
  className?: string;
};

/**
 * Two panes side by side with a draggable divider. The divider is a `separator` that can be
 * focused and moved with the arrow keys, Page keys, Home and End as well as by pointer, and every
 * change is announced in a live region. It only lays out: the panes own their content.
 */
export function LinkedSplit({ start, end, startLabel, endLabel, ratio, onRatioChange, limits = DEFAULT_SPLIT_LIMITS, className }: LinkedSplitProps) {
  const container = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const current = clampRatio(ratio, limits);

  const change = (next: number) => {
    if (next === current) return;
    onRatioChange(next);
    setAnnouncement(describeSplit(next, startLabel, endLabel));
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = container.current?.getBoundingClientRect();
    if (!dragging || !box) return;
    change(ratioFromPointer(event.clientX, box.left, box.width, limits));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = ratioFromKey(event.key, current, limits);
    if (next === null) return;
    event.preventDefault();
    change(next);
  };

  return (
    <div ref={container} data-slot="linked-split" className={cn('flex min-h-0 min-w-0 flex-1', className)}>
      <div style={{ width: `${current}%` }} className="min-h-0 min-w-0 shrink-0">
        {start}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label={`Resize ${startLabel} and ${endLabel}`}
        aria-valuenow={Math.round(current)}
        aria-valuemin={limits.min}
        aria-valuemax={limits.max}
        aria-valuetext={describeSplit(current, startLabel, endLabel)}
        data-dragging={dragging}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          setDragging(false);
        }}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={onKeyDown}
        className="group relative z-10 flex w-3 shrink-0 cursor-col-resize touch-none items-center justify-center outline-none"
      >
        <span className="h-full w-px bg-emphasized transition-colors group-hover:bg-[var(--primary-background)] group-focus-visible:w-0.5 group-focus-visible:bg-[var(--ring-default)] group-data-[dragging=true]:w-0.5 group-data-[dragging=true]:bg-[var(--primary-background)]" />
        <span aria-hidden="true" className="absolute top-1/2 h-8 w-1.5 -translate-y-1/2 rounded-full border border-emphasized bg-card-background group-hover:border-[var(--primary-background)] group-focus-visible:border-[var(--ring-default)]" />
      </div>
      <div className="min-h-0 min-w-0 flex-1">{end}</div>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
