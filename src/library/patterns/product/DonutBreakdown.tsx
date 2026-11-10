import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { donutArcs, formatShare } from './donutGeometry';

export type DonutSegment = {
  id: string;
  label: string;
  value: number;
};

export type DonutBreakdownProps = {
  /** What the whole ring adds up to: "Work orders by type". Part of the accessible name. */
  label: string;
  /** Up to five parts, largest first. Group the rest into "Other". */
  segments: readonly DonutSegment[];
  /** Caption under the total in the middle of the ring: "work orders". */
  totalLabel?: string;
  unit?: string;
  format?: (value: number) => string;
  /** `side` puts the legend beside the ring; `below` stacks it for narrow widgets. */
  legend?: 'side' | 'below';
  /** Tailwind size of the ring. */
  sizeClassName?: string;
  /** Replaces the total in the middle of the ring. */
  center?: ReactNode;
  className?: string;
};

const RADIUS = 40;
const STROKE = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 1.5;

const SERIES_STROKE = ['stroke-chart-1-450', 'stroke-chart-2-450', 'stroke-chart-3-450', 'stroke-chart-4-450', 'stroke-chart-5-450'] as const;
const SERIES_BG = ['bg-chart-1-450', 'bg-chart-2-450', 'bg-chart-3-450', 'bg-chart-4-450', 'bg-chart-5-450'] as const;

const NUMBER = new Intl.NumberFormat('en-US');
const defaultFormat = (value: number) => NUMBER.format(value);

/**
 * A donut for how one total splits into a few parts, with the total in the middle and a legend
 * that repeats every part as a label, a number and a share. The legend is what people read; the
 * ring only gives the proportions at a glance, so never ship it without the legend.
 */
export function DonutBreakdown({
  label,
  segments,
  totalLabel,
  unit,
  format = defaultFormat,
  legend = 'side',
  sizeClassName = 'size-32',
  center,
  className,
}: DonutBreakdownProps) {
  const arcs = donutArcs(
    segments.map((segment) => segment.value),
    CIRCUMFERENCE,
    GAP
  );
  const total = segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0);
  const suffix = unit ? `\u00a0${unit}` : '';
  const description = `${label}: ${segments.map((segment, index) => `${segment.label} ${formatShare(arcs[index].share)}`).join(', ')}`;

  return (
    <div
      data-slot="donut-breakdown"
      className={cn('flex w-full min-w-0 gap-6', legend === 'side' ? 'flex-row items-center' : 'flex-col items-center', className)}
    >
      <div className={cn('relative shrink-0', sizeClassName)}>
        <svg role="img" aria-label={description} viewBox="0 0 100 100" className="size-full -rotate-90" fill="none">
          <circle cx={50} cy={50} r={RADIUS} strokeWidth={STROKE} className="stroke-chart-neutral-100" />
          {arcs.map((arc, index) =>
            arc.length > 0 ? (
              <circle
                key={segments[index].id}
                data-slot="donut-arc"
                cx={50}
                cy={50}
                r={RADIUS}
                strokeWidth={STROKE}
                strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                strokeDashoffset={-arc.offset}
                className={SERIES_STROKE[index % SERIES_STROKE.length]}
              />
            ) : null
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {center ?? (
            <>
              <span data-slot="donut-total" className="text-xl font-semibold tabular-nums text-base-foreground">
                {format(total)}
              </span>
              {totalLabel ? <span className="text-xs text-muted-foreground">{totalLabel}</span> : null}
            </>
          )}
        </div>
      </div>
      <ul aria-label={`${label}, by part`} className="flex w-full min-w-0 flex-1 flex-col gap-2">
        {segments.map((segment, index) => (
          <li key={segment.id} className="flex items-center gap-2 text-sm">
            <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-xs', SERIES_BG[index % SERIES_BG.length])} />
            <span className="min-w-0 flex-1 text-medium-foreground">{segment.label}</span>
            <span className="tabular-nums whitespace-nowrap text-base-foreground">
              {format(segment.value)}
              {suffix}
            </span>
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{formatShare(arcs[index].share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
