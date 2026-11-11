import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { afterClipPath, dividerAfterKey, dividerFromPointer, dividerPercent } from './compareSliderLogic';

export type CompareSliderProps = {
  /** What is being compared, for the accessible name: "Compressor hall, before and after the repair". */
  label: string;
  /** The earlier frame, on the left of the divider. */
  before: ReactNode;
  /** The later frame, on the right. Rendered at the same size as `before`. */
  after: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  /** Starting position of the divider, 0–1. */
  initial?: number;
  className?: string;
};

/**
 * A before/after comparison. Drag the handle, click anywhere on the frame, or focus the handle and
 * use the arrow keys (Shift or Page keys for bigger steps, Home and End for the extremes). The
 * position is announced as the percentage of the "before" image shown.
 */
export function CompareSlider({ label, before, after, beforeLabel = 'Before', afterLabel = 'After', initial = 0.5, className }: CompareSliderProps) {
  const [position, setPosition] = useState(initial);
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const moveTo = (clientX: number) => {
    const bounds = frame.current?.getBoundingClientRect();
    if (bounds) setPosition(dividerFromPointer(clientX, bounds.left, bounds.width));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = dividerAfterKey(position, event.key, event.shiftKey);
    if (next === null) return;
    event.preventDefault();
    setPosition(next);
  };

  return (
    <div
      ref={frame}
      data-slot="compare-slider"
      className={cn('relative w-full touch-none select-none overflow-hidden rounded-lg', className)}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        moveTo(event.clientX);
      }}
      onPointerMove={(event) => {
        if (dragging.current) moveTo(event.clientX);
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      <div data-slot="compare-before">{before}</div>
      <div data-slot="compare-after" aria-hidden="true" className="absolute inset-0" style={{ clipPath: afterClipPath(position) }}>
        {after}
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute left-2 bottom-2 rounded-xs bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)] px-1.5 py-0.5 text-xs font-medium text-base-foreground">
        {beforeLabel}
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute right-2 bottom-2 rounded-xs bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)] px-1.5 py-0.5 text-xs font-medium text-base-foreground">
        {afterLabel}
      </span>
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={dividerPercent(position)}
        aria-valuetext={`${dividerPercent(position)} % ${beforeLabel.toLowerCase()}, ${100 - dividerPercent(position)} % ${afterLabel.toLowerCase()}`}
        data-slot="compare-handle"
        onKeyDown={onKeyDown}
        className="group absolute inset-y-0 flex w-8 -translate-x-1/2 cursor-ew-resize items-center justify-center outline-none"
        style={{ left: `${position * 100}%` }}
      >
        <span aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-base-foreground" />
        <span aria-hidden="true" className="relative flex size-7 items-center justify-center rounded-full border border-emphasized bg-card-background text-xs text-base-foreground group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--ring-default)]">
          ↔
        </span>
      </div>
    </div>
  );
}
