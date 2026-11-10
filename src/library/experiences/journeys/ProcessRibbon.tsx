import { IconChevronRight, IconMapPin } from '@cognite/aura/icons';
import { useEffect, useRef } from 'react';

import { cn } from '../../../lib/utils';
import type { Tone } from '../../industrial/status';
import { StatusIndicator } from '../../industrial/StatusIndicator';

export type RibbonStation = {
  id: string;
  label: string;
  /** Functional location or system tag, set in monospace. */
  tag?: string;
  /** One quiet line under the name, such as the conditions there: "13.1 barg · 28 °C". */
  caption?: string;
  /** Set only when something at this station is abnormal; shown as a labelled indicator. */
  status?: { tone: Tone; label: string };
};

export type ProcessRibbonProps = {
  stations: readonly RibbonStation[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Accessible name of the route, e.g. "Gas route, inlet to export". */
  label: string;
  markerLabel?: string;
  className?: string;
};

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A process drawn as one long horizontal line with a station per stage. The ribbon is wider than
 * its frame and scrolls sideways; the active station carries a "you are here" marker, the line up
 * to it is drawn as travelled, and changing the active station glides the ribbon so that station
 * is centred. Stations are buttons, so the route works by pointer and keyboard.
 */
export function ProcessRibbon({ stations, activeIndex, onSelect, label, markerLabel = 'You are here', className }: ProcessRibbonProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const count = stations.length;
  const active = Math.min(Math.max(activeIndex, 0), Math.max(count - 1, 0));

  useEffect(() => {
    const container = scroller.current;
    const station = container?.querySelector<HTMLElement>(`[data-station-index="${active}"]`);
    if (!container || !station || typeof container.scrollTo !== 'function') return;
    const left = station.offsetLeft + station.offsetWidth / 2 - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(left, 0), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [active]);

  if (count === 0) return null;

  return (
    <div ref={scroller} data-slot="process-ribbon" className={cn('w-full min-w-0 overflow-x-auto', className)}>
      <div className="relative w-max min-w-full pb-3">
        {/* The pipe: a muted line through every station, entering and leaving the frame dashed. */}
        <svg
          aria-hidden
          viewBox={`0 0 ${count * 100} 40`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 top-10 h-10 w-full"
          fill="none"
        >
          <line x1={0} x2={50} y1={20} y2={20} strokeWidth={2} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-300" />
          <line x1={50} x2={count * 100 - 50} y1={20} y2={20} strokeWidth={6} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-200" />
          <line
            x1={count * 100 - 50}
            x2={count * 100}
            y1={20}
            y2={20}
            strokeWidth={2}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
            className="stroke-chart-neutral-300"
          />
        </svg>
        {/* The travelled part grows with the active station. */}
        <div
          data-slot="ribbon-travelled"
          aria-hidden
          className="pointer-events-none absolute top-[3.5625rem] h-1.5 rounded-full bg-primary-background transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ left: percent(0.5 / count), width: percent(active / count) }}
        />
        <div
          data-slot="ribbon-marker"
          aria-hidden
          className="pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 flex-col items-center transition-[left] duration-500 ease-out motion-reduce:transition-none"
          style={{ left: percent((active + 0.5) / count) }}
        >
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary-background px-2.5 py-1 text-xs font-medium text-primary-foreground [&_svg]:size-3.5">
            <IconMapPin />
            {markerLabel}
          </span>
          <span className="h-2 border-l-2 border-[color:var(--primary-background)]" />
        </div>

        <ol aria-label={label} className="relative grid auto-cols-[minmax(14rem,1fr)] grid-flow-col pt-10">
          {stations.map((station, index) => {
            const isActive = index === active;
            const isPassed = index < active;
            return (
              <li key={station.id} className="relative flex min-w-0 justify-center">
                {index < count - 1 ? (
                  <span aria-hidden className="absolute top-3 right-0 translate-x-1/2 text-muted-foreground [&_svg]:size-4">
                    <IconChevronRight />
                  </span>
                ) : null}
                <button
                  type="button"
                  data-station-index={index}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={() => onSelect(index)}
                  className="group flex w-full max-w-52 cursor-pointer flex-col items-center gap-1 rounded-lg px-2 pb-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-default)]"
                >
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums transition-colors motion-reduce:transition-none',
                      isActive
                        ? 'border-[color:var(--primary-background)] bg-primary-background text-primary-foreground shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary-background)_22%,transparent)]'
                        : isPassed
                          ? 'border-[color:var(--primary-background)] bg-card-background text-base-foreground'
                          : 'border-emphasized bg-card-background text-muted-foreground group-hover:text-base-foreground'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className={cn('mt-1 text-sm', isActive ? 'font-semibold text-base-foreground' : 'font-medium text-medium-foreground')}>
                    {station.label}
                  </span>
                  {station.tag ? <span className="font-mono text-xs text-muted-foreground">{station.tag}</span> : null}
                  {station.caption ? <span className="text-xs text-muted-foreground tabular-nums">{station.caption}</span> : null}
                  {station.status ? <StatusIndicator tone={station.status.tone} label={station.status.label} shape="square" size="sm" /> : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
