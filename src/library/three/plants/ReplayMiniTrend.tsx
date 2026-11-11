import { cn } from '../../../lib/utils';
import { readingAt, timeFraction, visiblePoints } from '../../experiences/journeys/replayState';
import type { ReplaySignal } from '../../experiences/journeys/replayState';
import { TONE_VALUE_TEXT, formatReading } from '../../industrial/status';

export type ReplayMiniTrendProps = {
  signal: ReplaySignal;
  from: number;
  to: number;
  /** Playhead: the line is drawn up to here and a cursor marks it. */
  cursor: number;
  /** Fixed value range, so the line does not rescale while it draws. */
  domain: readonly [number, number];
  className?: string;
};

const WIDTH = 240;
const HEIGHT = 44;
const PAD = 4;

const round = (value: number): number => Math.round(value * 100) / 100;

/**
 * A small synchronized trend for a narrow rail: the signal's name and its value at the playhead on
 * one line, and under it the curve drawn up to the playhead with limit lines and a cursor. Stack
 * several with the same `from`, `to` and `cursor` and they move as one. The state is written in
 * words as well as colour: the value carries its tone and the figure's label names the limit.
 */
export function ReplayMiniTrend({ signal, from, to, cursor, domain, className }: ReplayMiniTrendProps) {
  const [min, max] = domain;
  const span = max - min || 1;
  const x = (t: number): number => round(timeFraction(t, from, to) * WIDTH);
  const y = (value: number): number => round(PAD + (1 - (Math.min(Math.max(value, min), max) - min) / span) * (HEIGHT - PAD * 2));
  const shown = visiblePoints(signal.points, cursor);
  const path = shown.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.t)} ${y(point.v)}`).join(' ');
  const reading = readingAt(signal, cursor);
  const limits = [
    { key: 'highHigh', value: signal.limits.highHigh, className: 'stroke-chart-critical-400' },
    { key: 'high', value: signal.limits.high, className: 'stroke-chart-warning-400' },
    { key: 'low', value: signal.limits.low, className: 'stroke-chart-warning-400' },
    { key: 'lowLow', value: signal.limits.lowLow, className: 'stroke-chart-critical-400' },
  ].flatMap((limit) => (limit.value === undefined ? [] : [{ ...limit, value: limit.value }]));
  const state = reading.alarm === 'trip' ? 'trip limit' : reading.alarm === 'warning' ? 'alarm' : 'normal';

  return (
    <figure data-slot="replay-mini-trend" data-alarm={reading.alarm} className={cn('flex min-w-0 flex-col gap-1', className)}>
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs text-medium-foreground">{signal.label}</span>
        <span className={cn('shrink-0 text-xs font-semibold tabular-nums', TONE_VALUE_TEXT[reading.tone])}>
          {formatReading(reading.value, signal.unit, signal.decimals)}
          {reading.alarm === 'normal' ? null : <span className="font-normal"> · {state}</span>}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${signal.label} up to the playhead, now ${formatReading(reading.value, signal.unit, signal.decimals)}, ${state}`} className="h-11 w-full">
        {limits.map((limit) => (
          <line key={limit.key} x1={0} x2={WIDTH} y1={y(limit.value)} y2={y(limit.value)} strokeDasharray="3 3" strokeWidth={1} className={limit.className} />
        ))}
        {path ? <path d={path} fill="none" strokeWidth={1.5} strokeLinejoin="round" className="stroke-chart-1-450" /> : null}
        <line data-slot="mini-trend-cursor" x1={x(cursor)} x2={x(cursor)} y1={0} y2={HEIGHT} strokeWidth={1} className="stroke-chart-neutral-450" />
      </svg>
    </figure>
  );
}
