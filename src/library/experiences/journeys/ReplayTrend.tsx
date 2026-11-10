import { cn } from '../../../lib/utils';
import { TONE_VALUE_TEXT, formatLimit, formatReading } from '../../industrial/status';
import type { Limits } from '../../industrial/status';
import { StatusIndicator } from '../../industrial/StatusIndicator';

import { readingAt, timeFraction, visiblePoints } from './replayState';
import type { AlarmState, ReplaySignal } from './replayState';

export type ReplayTrendProps = {
  signal: ReplaySignal;
  from: number;
  to: number;
  /** Playhead. The line is drawn up to here. */
  cursor: number;
  /** Fixed y range, so the line does not rescale while it draws. */
  domain: readonly [number, number];
  /** Times of events, drawn as faint vertical guides once reached. */
  eventTimes?: readonly number[];
  className?: string;
};

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 72;
const PADDING_Y = 6;

const ALARM_LABEL: Record<AlarmState, string> = { normal: 'Normal', warning: 'Alarm', trip: 'Trip limit' };

const round = (value: number): number => Math.round(value * 100) / 100;

function limitLines(limits: Limits): { key: string; value: number; label: string; className: string }[] {
  const lines = [
    { key: 'highHigh', value: limits.highHigh, label: 'HH', className: 'stroke-chart-critical-400' },
    { key: 'high', value: limits.high, label: 'H', className: 'stroke-chart-warning-400' },
    { key: 'low', value: limits.low, label: 'L', className: 'stroke-chart-warning-400' },
    { key: 'lowLow', value: limits.lowLow, label: 'LL', className: 'stroke-chart-critical-400' },
  ];
  return lines.flatMap((line) => (line.value === undefined ? [] : [{ ...line, value: line.value }]));
}

/**
 * One row of a synchronized trend stack: the signal's name and limits, its line drawn only up to
 * the playhead with a vertical cursor, and the value and alarm state at that moment. Stack several
 * with the same `from`, `to` and `cursor` and they move as one.
 */
export function ReplayTrend({ signal, from, to, cursor, domain, eventTimes = [], className }: ReplayTrendProps) {
  const [min, max] = domain;
  const span = max - min || 1;
  const x = (t: number): number => round(timeFraction(t, from, to) * VIEW_WIDTH);
  const y = (value: number): number => round(PADDING_Y + (1 - (Math.min(Math.max(value, min), max) - min) / span) * (VIEW_HEIGHT - PADDING_Y * 2));
  const shown = visiblePoints(signal.points, cursor);
  const path = shown.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.t)} ${y(point.v)}`).join(' ');
  const reading = readingAt(signal, cursor);
  const lines = limitLines(signal.limits);
  const cursorX = x(cursor);
  const limitText = lines.map((line) => `${line.label} ${formatLimit(line.value, signal.decimals)}`).join(' · ');

  return (
    <div data-slot="replay-trend" data-alarm={reading.alarm} className={cn('grid w-full min-w-0 grid-cols-[minmax(0,9rem)_minmax(0,1fr)_minmax(0,6.5rem)] items-center gap-3', className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-base-foreground">{signal.label}</p>
        <p className="font-mono text-xs text-muted-foreground">{signal.tag}</p>
        {limitText ? <p className="text-xs text-muted-foreground tabular-nums">{limitText}</p> : null}
      </div>
      <svg
        role="img"
        aria-label={`${signal.label} up to the playhead: ${formatReading(reading.value, signal.unit, signal.decimals)}, ${ALARM_LABEL[reading.alarm].toLowerCase()}`}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        className="block h-full min-h-[4.5rem] w-full self-stretch rounded-md bg-base-background"
        fill="none"
      >
        {eventTimes
          .filter((time) => time <= cursor)
          .map((time) => (
            <line key={time} x1={x(time)} x2={x(time)} y1={0} y2={VIEW_HEIGHT} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-200" />
          ))}
        {lines.map((line) => (
          <line
            key={line.key}
            data-slot="replay-trend-limit"
            x1={0}
            x2={VIEW_WIDTH}
            y1={y(line.value)}
            y2={y(line.value)}
            strokeWidth={1}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
            className={line.className}
          />
        ))}
        {path ? (
          <path data-slot="replay-trend-line" d={path} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-chart-1-450" />
        ) : null}
        <line
          data-slot="replay-trend-cursor"
          x1={cursorX}
          x2={cursorX}
          y1={0}
          y2={VIEW_HEIGHT}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          className="stroke-[color:var(--primary-background)]"
        />
        {reading.value !== null ? (
          <path d={`M ${cursorX} ${y(reading.value)} h 0.01`} strokeWidth={8} strokeLinecap="round" vectorEffect="non-scaling-stroke" className="stroke-chart-1-450" />
        ) : null}
      </svg>
      <div className="flex min-w-0 flex-col items-end gap-1">
        <span className={cn('text-base font-semibold whitespace-nowrap tabular-nums', TONE_VALUE_TEXT[reading.tone])}>
          {formatReading(reading.value, signal.unit, signal.decimals)}
        </span>
        {reading.alarm === 'normal' ? (
          <span className="text-xs text-muted-foreground">Normal</span>
        ) : (
          <StatusIndicator tone={reading.tone} label={ALARM_LABEL[reading.alarm]} shape={reading.alarm === 'trip' ? 'diamond' : 'square'} size="sm" />
        )}
      </div>
    </div>
  );
}
