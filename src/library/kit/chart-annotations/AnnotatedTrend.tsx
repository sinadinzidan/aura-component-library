import { useId, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';

import { useLookDefinition } from '../../looks/useLook';
import { Legend, type LegendItem } from '../Legend';
import { cx, formatNumber, toneLine, type Tone } from '../tones';

import { domainTicks, fitDomain, linePath, nearestIndex, xShare, yShare } from './annotations';
import { EventBadge } from './EventBadge';

export type AnnotatedSeries = {
  id: string;
  label: string;
  /** One value per x label; `null` is a gap. */
  values: readonly (number | null)[];
  tone?: Tone;
  /** From this index on the line is dashed: a forecast, a plan. */
  dashedFrom?: number;
};

export type LimitMark = { value: number; label: string; tone?: Tone; solid?: boolean };

/** A stretch of the x axis, in point indexes. */
export type RegionMark = { id: string; from: number; to: number; label?: string; tone?: Tone; hatched?: boolean; labelAt?: 'top' | 'bottom' };

/** A moment on the x axis with a short mark that a list beside the chart repeats. */
export type EventMark = { id: string; at: number; mark: string; title: string; tone?: Tone };

/** A note attached to one point of a series. */
export type PointMark = { id: string; at: number; seriesId?: string; text: string; tone?: Tone; placement?: 'above' | 'below' };

/** A named vertical line, such as cursor A and cursor B. */
export type PinMark = { at: number; label: string; tone?: Tone };

type AnnotatedTrendProps = {
  /** What the chart shows, in words. */
  label: string;
  series: readonly AnnotatedSeries[];
  /** One label per point for the x axis. */
  labels: readonly string[];
  unit?: string;
  decimals?: number;
  height?: number;
  yDomain?: readonly [number, number];
  /** Draw every n-th x label. */
  tickEvery?: number;
  limits?: readonly LimitMark[];
  regions?: readonly RegionMark[];
  events?: readonly EventMark[];
  /** `tick` shrinks events to unlabelled ticks, for when there are too many to number. */
  eventStyle?: 'badge' | 'tick';
  selectedEventId?: string;
  onSelectEvent?: (id: string) => void;
  points?: readonly PointMark[];
  pins?: readonly PinMark[];
  /** Index of the present moment: everything after it is the future. */
  nowAt?: number;
  /** Index under the pointer; the chart draws a line and the values there. */
  cursor?: number | null;
  onCursor?: (index: number | null) => void;
  /** A selected stretch, in point indexes. Dragging on the plot reports a new one. */
  selection?: { from: number; to: number } | null;
  onSelection?: (range: { from: number; to: number }) => void;
  /** Fill under the first series the way the look fills areas. */
  fill?: boolean;
  showLegend?: boolean;
  /** Extra legend entries that explain the annotations. */
  keyItems?: readonly LegendItem[];
  headline?: ReactNode;
  className?: string;
};

const GUTTER = { left: 52, right: 14, bottom: 26 };

const share = (value: number): string => `${(value * 100).toFixed(3)}%`;

function anchor(x: number): string {
  if (x > 0.82) return '-translate-x-full';
  if (x < 0.18) return '';
  return '-translate-x-1/2';
}

/**
 * A time trend that carries its own explanations: limit lines, shaded periods, numbered events,
 * notes on single points, a now line, a cursor with values and a draggable selection. Text is
 * HTML over the plot, so it stays sharp and readable at any width; the look decides the line
 * weight, grid, fills and the shape of every marker.
 */
export function AnnotatedTrend({
  label,
  series,
  labels,
  unit = '',
  decimals = 1,
  height = 260,
  yDomain,
  tickEvery = 4,
  limits = [],
  regions = [],
  events = [],
  eventStyle = 'badge',
  selectedEventId,
  onSelectEvent,
  points = [],
  pins = [],
  nowAt,
  cursor = null,
  onCursor,
  selection = null,
  onSelection,
  fill = false,
  showLegend,
  keyItems = [],
  headline,
  className,
}: AnnotatedTrendProps) {
  const { id: look, chart } = useLookDefinition();
  const gradientId = useId();
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const count = labels.length;
  const domain = yDomain ?? fitDomain(series.flatMap((item) => item.values), limits.map((limit) => limit.value));
  const hasTopMarks = events.length > 0 || pins.length > 0 || nowAt !== undefined;
  const top = hasTopMarks ? 34 : unit ? 30 : 12;
  const x = (index: number): number => xShare(index, count);
  const y = (value: number): number => yShare(value, domain);
  const suffix = unit ? ` ${unit}` : '';
  const hatch = (tone: Tone): string => `repeating-linear-gradient(135deg, color-mix(in oklab, ${toneLine(tone)} 55%, transparent) 0 1.5px, transparent 1.5px 8px)`;
  const wash = (tone: Tone, strength: number): string => `color-mix(in oklab, ${toneLine(tone)} ${strength}%, transparent)`;
  const hatchedLook = look === 'blueprint' || look === 'console';

  const indexAt = (event: PointerEvent<HTMLDivElement>): number => {
    const box = event.currentTarget.getBoundingClientRect();
    return nearestIndex(box.width > 0 ? (event.clientX - box.left) / box.width : 0, count);
  };
  const interactive = Boolean(onCursor || onSelection);
  const legend: LegendItem[] = [
    ...(showLegend ?? series.length > 1 ? series.map((item): LegendItem => ({ label: item.label, tone: item.tone ?? 'accent', mark: 'line' })) : []),
    ...keyItems,
  ];
  const first = series[0];

  return (
    <figure data-look={look} className={cx('flex min-w-0 flex-col gap-3', className)}>
      {headline || legend.length > 0 ? (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>{headline}</div>
          {legend.length > 0 ? <Legend items={legend} /> : null}
        </div>
      ) : null}
      <div role="img" aria-label={label} className="relative w-full select-none" style={{ height }}>
        {unit ? <span className="absolute top-0 left-0 text-xs leading-4 text-(--kit-text-2)">{unit}</span> : null}
        {domainTicks(domain).map((tick) => (
          <span
            key={tick}
            className="absolute left-0 -translate-y-1/2 text-right text-xs leading-4 text-(--kit-text-2) tabular-nums"
            style={{ width: GUTTER.left - 10, top: `calc(${top}px + (100% - ${top + GUTTER.bottom}px) * ${y(tick).toFixed(4)})` }}
          >
            {formatNumber(tick, decimals)}
          </span>
        ))}
        <div
          data-plot=""
          className={cx('absolute', interactive && 'cursor-crosshair touch-none')}
          style={{ left: GUTTER.left, right: GUTTER.right, top, bottom: GUTTER.bottom }}
          onPointerMove={
            interactive
              ? (event) => {
                  const index = indexAt(event);
                  onCursor?.(index);
                  if (dragFrom !== null && onSelection) onSelection({ from: Math.min(dragFrom, index), to: Math.max(dragFrom, index) });
                }
              : undefined
          }
          onPointerLeave={interactive ? () => onCursor?.(null) : undefined}
          onPointerDown={onSelection ? (event) => setDragFrom(indexAt(event)) : undefined}
          onPointerUp={onSelection ? () => setDragFrom(null) : undefined}
        >
          {chart.grid !== 'none'
            ? domainTicks(domain).map((tick) => <span key={tick} className="absolute inset-x-0 border-t border-(--kit-grid)" style={{ top: share(y(tick)) }} />)
            : null}
          {chart.grid === 'both'
            ? labels.map((_, index) => (index % tickEvery === 0 ? <span key={index} className="absolute inset-y-0 border-l border-(--kit-grid)" style={{ left: share(x(index)) }} /> : null))
            : null}
          {chart.axisLine || chart.grid === 'none' ? <span className="absolute inset-y-0 left-0 border-l border-(--kit-rule-strong)" /> : null}
          <span className="absolute inset-x-0 bottom-0 border-b border-(--kit-rule-strong)" />

          {regions.map((region) => {
            const tone = region.tone ?? 'neutral';
            return (
              <div
                key={region.id}
                data-region={region.id}
                className="absolute inset-y-0"
                style={{
                  left: share(x(region.from)),
                  width: share(x(region.to) - x(region.from)),
                  background: region.hatched || hatchedLook ? hatch(tone) : wash(tone, look === 'poster' ? 45 : 16),
                  borderLeft: `1px solid ${wash(tone, 70)}`,
                  borderRight: `1px solid ${wash(tone, 70)}`,
                }}
              >
                {region.label ? (
                  <span data-tone={tone} className={cx('absolute left-1.5 rounded-(--kit-radius-sm) bg-(--kit-halo) px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap text-(--kit-text)', region.labelAt === 'bottom' ? 'bottom-1.5' : 'top-1.5')}>
                    {region.label}
                  </span>
                ) : null}
              </div>
            );
          })}

          {selection ? (
            <div
              data-selection=""
              className="absolute inset-y-0 border-x-2 border-(--kit-line-accent)"
              style={{ left: share(x(selection.from)), width: share(x(selection.to) - x(selection.from)), background: wash('accent', 14) }}
            />
          ) : null}

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={toneLine(first?.tone ?? 'accent')} stopOpacity={chart.area === 'solid' ? 0.3 : 0.32} />
                <stop offset="1" stopColor={toneLine(first?.tone ?? 'accent')} stopOpacity={chart.area === 'solid' ? 0.3 : 0.02} />
              </linearGradient>
            </defs>
            {fill && first && chart.area !== 'none' ? (
              <path d={`${linePath(first.values, domain, chart.curve)}L100,100L0,100Z`} fill={`url(#${gradientId})`} stroke="none" />
            ) : null}
            {limits.map((limit) => (
              <line
                key={limit.label}
                x1="0"
                x2="100"
                y1={y(limit.value) * 100}
                y2={y(limit.value) * 100}
                vectorEffect="non-scaling-stroke"
                stroke={toneLine(limit.tone ?? 'warning')}
                strokeWidth={1.5}
                strokeDasharray={limit.solid ? undefined : '6 4'}
              />
            ))}
            {series.map((item) => {
              const split = item.dashedFrom ?? item.values.length - 1;
              const stroke = toneLine(item.tone ?? 'accent');
              return (
                <g key={item.id} fill="none" stroke={stroke} strokeWidth={chart.strokeWidth} strokeLinejoin="round" strokeLinecap="round">
                  <path d={linePath(item.values, domain, chart.curve, 0, split)} vectorEffect="non-scaling-stroke" />
                  {item.dashedFrom !== undefined ? (
                    <path d={linePath(item.values, domain, chart.curve, split)} vectorEffect="non-scaling-stroke" strokeDasharray="5 5" />
                  ) : null}
                </g>
              );
            })}
          </svg>

          {chart.points && first
            ? first.values.map((value, index) =>
                value === null ? null : (
                  <span
                    key={index}
                    className="absolute size-1.5 -translate-1/2 rounded-full border border-(--kit-line-accent) bg-(--kit-halo)"
                    style={{ left: share(x(index)), top: share(y(value)) }}
                  />
                )
              )
            : null}

          {limits.map((limit) => (
            <span
              key={limit.label}
              className="absolute left-1 rounded-(--kit-radius-sm) bg-(--kit-halo) px-1 text-xs leading-4 font-medium whitespace-nowrap"
              style={{ top: `calc(${share(y(limit.value))} - 20px)`, color: toneLine(limit.tone ?? 'warning') }}
            >
              {limit.label} {formatNumber(limit.value, decimals)}
            </span>
          ))}

          {nowAt !== undefined ? (
            <div className="absolute -top-6 bottom-0 border-l-2 border-(--kit-text)" style={{ left: share(x(nowAt)) }}>
              <span className="absolute top-0 left-1.5 text-xs leading-4 font-semibold whitespace-nowrap text-(--kit-text)">Now</span>
            </div>
          ) : null}

          {events.map((event) => {
            const tone = event.tone ?? 'accent';
            const selected = event.id === selectedEventId;
            const line = (
              <span
                className={cx('absolute top-0 bottom-0 left-1/2 border-l', selected ? 'border-l-2' : 'border-dashed')}
                style={{ borderColor: toneLine(tone), top: eventStyle === 'tick' ? 0 : 26 }}
              />
            );
            if (eventStyle === 'tick') {
              return (
                <span key={event.id} data-event={event.id} className="absolute top-0 h-3 w-0" style={{ left: share(x(event.at)) }}>
                  <span className="absolute -top-2 left-0 h-2 w-0.5 -translate-x-1/2" style={{ background: toneLine(tone) }} />
                </span>
              );
            }
            return onSelectEvent ? (
              <button
                key={event.id}
                type="button"
                data-event={event.id}
                aria-label={`${event.mark}: ${event.title}`}
                aria-pressed={selected}
                onClick={() => onSelectEvent(event.id)}
                onPointerDown={(pointer) => pointer.stopPropagation()}
                className="absolute -top-7.5 bottom-0 w-6 -translate-x-1/2 cursor-pointer focus-visible:outline-2 focus-visible:outline-(--kit-text)"
                style={{ left: share(x(event.at)) }}
              >
                {line}
                <EventBadge tone={tone} selected={selected} className="absolute top-0 left-0">
                  {event.mark}
                </EventBadge>
              </button>
            ) : (
              <span key={event.id} data-event={event.id} className="absolute -top-7.5 bottom-0 w-6 -translate-x-1/2" style={{ left: share(x(event.at)) }}>
                {line}
                <EventBadge tone={tone} selected={selected} className="absolute top-0 left-0">
                  {event.mark}
                </EventBadge>
              </span>
            );
          })}

          {pins.map((pin) => (
            <div key={pin.label} className="absolute -top-7.5 bottom-0 w-6 -translate-x-1/2" style={{ left: share(x(pin.at)) }}>
              <span className="absolute top-6 bottom-0 left-1/2 border-l-2" style={{ borderColor: toneLine(pin.tone ?? 'accent') }} />
              <EventBadge tone={pin.tone ?? 'accent'} className="absolute top-0 left-0">
                {pin.label}
              </EventBadge>
            </div>
          ))}

          {points.map((point) => {
            const owner = series.find((item) => item.id === point.seriesId) ?? first;
            const value = owner?.values[point.at];
            if (value === null || value === undefined) return null;
            const tone = point.tone ?? 'accent';
            const px = x(point.at);
            const below = point.placement === 'below';
            return (
              <div key={point.id} data-point={point.id} className="absolute size-0" style={{ left: share(px), top: share(y(value)) }}>
                <span className="absolute size-3 -translate-1/2 rounded-full border-2 border-(--kit-halo)" style={{ background: toneLine(tone) }} />
                <span className="absolute left-0 h-3 border-l" style={{ borderColor: toneLine(tone), top: below ? 6 : -18 }} />
                <span
                  data-tone={tone}
                  className={cx(
                    'absolute left-0 rounded-(--kit-radius-sm) px-2 py-1 text-xs leading-4 font-medium whitespace-nowrap',
                    look === 'blueprint' || look === 'editorial' ? 'border border-(--t-line) bg-(--kit-halo) text-(--kit-text)' : 'bg-(--t-vivid) text-(--t-on-vivid)',
                    anchor(px)
                  )}
                  style={below ? { top: 18 } : { bottom: 18 }}
                >
                  {point.text}
                </span>
              </div>
            );
          })}

          {cursor !== null ? (
            <div data-cursor="" className="pointer-events-none absolute inset-y-0 border-l border-(--kit-text)" style={{ left: share(x(cursor)) }}>
              {series.map((item) => {
                const value = item.values[cursor];
                if (value === null || value === undefined) return null;
                return (
                  <span key={item.id} className="absolute size-0" style={{ top: share(y(value)) }}>
                    <span className="absolute size-2.5 -translate-1/2 rounded-full border-2 border-(--kit-halo)" style={{ background: toneLine(item.tone ?? 'accent') }} />
                    <span
                      className={cx(
                        'absolute -top-2.5 rounded-(--kit-radius-sm) bg-(--kit-text) px-1.5 py-0.5 text-xs leading-4 font-medium whitespace-nowrap text-(--kit-halo) tabular-nums',
                        x(cursor) > 0.8 ? 'right-2' : 'left-2'
                      )}
                    >
                      {formatNumber(value, decimals)}
                      {suffix}
                    </span>
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="absolute bottom-0 h-4" style={{ left: GUTTER.left, right: GUTTER.right }}>
          {labels.map((text, index) =>
            index % tickEvery === 0 ? (
              <span
                key={index}
                className={cx('absolute top-0 text-xs leading-4 whitespace-nowrap text-(--kit-text-2) tabular-nums', index === count - 1 ? '-translate-x-full' : index === 0 ? '' : '-translate-x-1/2')}
                style={{ left: share(x(index)) }}
              >
                {text}
              </span>
            ) : null
          )}
        </div>
      </div>
    </figure>
  );
}
