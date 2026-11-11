import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

import { dragFraction, nearestSnap, snapLabel, SNAP_FRACTION } from './bottomSheet';
import type { SheetSnap } from './bottomSheet';

export type BottomSheetProps = {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  /** Name of the sheet and its heading: "Filter work orders". */
  title: string;
  children: ReactNode;
  /** Fixed area at the bottom of the sheet, such as the apply button. */
  footer?: ReactNode;
};

/**
 * A sheet that rises over a phone screen at half or full height. The handle on top works with a
 * finger or a mouse (drag, then release to snap) and from the keyboard: Up expands, Down collapses
 * and finally closes, Enter toggles between half and full, Escape closes. It reports the snap
 * point as a slider value for assistive technology. Place it inside the relatively positioned area
 * it should cover; it renders nothing while closed.
 */
export function BottomSheet({ snap, onSnapChange, title, children, footer }: BottomSheetProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const start = useRef<{ y: number; fraction: number; height: number } | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (snap !== 'closed' && !wasOpen.current) panel.current?.focus();
    wasOpen.current = snap !== 'closed';
  }, [snap]);

  if (snap === 'closed' && dragging === null) return null;

  const fraction = dragging ?? SNAP_FRACTION[snap];

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const height = host.current?.getBoundingClientRect().height ?? 0;
    start.current = { y: event.clientY, fraction: SNAP_FRACTION[snap], height };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(SNAP_FRACTION[snap]);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const origin = start.current;
    if (!origin) return;
    setDragging(dragFraction(origin.fraction, event.clientY - origin.y, origin.height));
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const origin = start.current;
    if (!origin) return;
    start.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const moved = Math.abs(event.clientY - origin.y) > 4;
    setDragging(null);
    onSnapChange(moved ? nearestSnap(dragFraction(origin.fraction, event.clientY - origin.y, origin.height)) : snap === 'half' ? 'full' : 'half');
  };

  const onHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onSnapChange(snap === 'closed' ? 'half' : 'full');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      onSnapChange(snap === 'full' ? 'half' : 'closed');
    } else if (event.key === 'Home') {
      event.preventDefault();
      onSnapChange('closed');
    } else if (event.key === 'End') {
      event.preventDefault();
      onSnapChange('full');
    }
  };

  const value = snap === 'closed' ? 0 : snap === 'half' ? 1 : 2;

  return (
    <div
      ref={host}
      data-slot="bottom-sheet"
      data-snap={snap}
      className="absolute inset-0 z-30 flex flex-col justify-end"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onSnapChange('closed');
        }
      }}
    >
      <button type="button" aria-label="Close sheet" tabIndex={-1} onClick={() => onSnapChange('closed')} className="min-h-0 flex-1 cursor-default bg-overlay-background" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="flex flex-col overflow-hidden rounded-t-2xl bg-base-background outline-none motion-safe:transition-[height] motion-safe:duration-200"
        style={{ height: `${fraction * 100}%`, transitionDuration: dragging === null ? undefined : '0ms' }}
      >
        <button
          type="button"
          role="slider"
          aria-label="Sheet height"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={2}
          aria-valuenow={value}
          aria-valuetext={snapLabel(snap)}
          className="flex h-6 w-full shrink-0 cursor-grab touch-none items-center justify-center outline-none focus-visible:shadow-focus-ring"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            start.current = null;
            setDragging(null);
          }}
          onKeyDown={onHandleKeyDown}
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-medium-background" />
        </button>
        <h2 className="px-4 pb-2 text-base font-semibold text-base-foreground">{title}</h2>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">{children}</div>
        {footer ? <div className="shrink-0 border-t border-default p-3">{footer}</div> : null}
      </div>
    </div>
  );
}
