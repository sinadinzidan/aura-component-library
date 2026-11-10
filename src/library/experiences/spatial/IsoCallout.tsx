import { Button } from '@cognite/aura/components/button';
import { IconX } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { calloutPlacement } from './isoProjection';
import type { CalloutPlacement, IsoPoint } from './isoProjection';

export type IsoCalloutProps = {
  /** Where the callout points, as 0–1 fractions of the positioned drawing it sits in. */
  anchor: IsoPoint;
  title: string;
  /** Tag printed in monospace under the title. */
  tag?: string;
  /** State of the unit, usually a `StatusIndicator`. */
  status?: ReactNode;
  /** Opens to this side instead of the one chosen from the anchor position. */
  placement?: CalloutPlacement;
  /** Adds a close button. */
  onClose?: () => void;
  className?: string;
  children?: ReactNode;
};

/**
 * A card pinned to a point in a drawing by a dot and a short leader. It opens away from the
 * nearest edges so it stays inside the drawing, and keeps real text size however the drawing
 * scales. Place it in the same `relative` box as the SVG. Pick it for the details of the one
 * selected unit; for many labels at once use plain tags.
 */
export function IsoCallout({ anchor, title, tag, status, placement, onClose, className, children }: IsoCalloutProps) {
  const { side, vertical } = placement ?? calloutPlacement(anchor);
  const right = side === 'right';
  const below = vertical === 'below';

  return (
    <div
      data-slot="iso-callout"
      data-side={side}
      data-vertical={vertical}
      className="pointer-events-none absolute z-10 size-0"
      style={{ left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` }}
    >
      <span className="absolute -top-1 -left-1 size-2 rounded-full bg-[var(--primary-background)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary-background)_30%,transparent)]" />
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={cn('absolute size-6 overflow-visible', right ? 'left-0' : 'right-0', below ? 'top-0' : 'bottom-0')}
      >
        <line
          x1={right ? 0 : 24}
          y1={below ? 0 : 24}
          x2={right ? 24 : 0}
          y2={below ? 24 : 0}
          strokeWidth={1.5}
          className="stroke-[color:var(--primary-background)]"
        />
      </svg>
      <section
        aria-label={title}
        className={cn(
          'pointer-events-auto absolute flex w-60 flex-col gap-3 rounded-lg border border-[color-mix(in_oklab,var(--primary-background)_60%,transparent)] bg-[color-mix(in_oklab,var(--card-background)_92%,transparent)] p-3 shadow-[0_8px_24px_color-mix(in_oklab,var(--base-foreground)_14%,transparent)] backdrop-blur-sm',
          right ? 'left-6' : 'right-6',
          below ? 'top-6' : 'bottom-6',
          className
        )}
      >
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-base-foreground">{title}</h4>
            {tag ? <p className="truncate font-mono text-xs text-muted-foreground">{tag}</p> : null}
          </div>
          {onClose ? (
            <Button variant="ghost" size="icon-sm" aria-label={`Close ${title}`} onClick={onClose}>
              <IconX />
            </Button>
          ) : null}
        </header>
        {status}
        {children}
      </section>
    </div>
  );
}
