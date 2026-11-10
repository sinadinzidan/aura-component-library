import { Button } from '@cognite/aura/components/button';
import { Slider } from '@cognite/aura/components/slider';
import { IconPlayerPause, IconPlayerPlay } from '@cognite/aura/icons';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

/** The part of the timer API the scrubber needs, so tests can stand in for it. */
export type ScrubberTimers = {
  setInterval: (callback: () => void, ms: number) => number;
  clearInterval: (id: number) => void;
};

/** A span on the timeline, drawn as a bar over the slider: a movement, a shift, an outage. */
export type ScrubberSpan = {
  id: string;
  /** Short text on the bar. */
  label: string;
  /** What the span is, in full, for assistive technology. Defaults to the label. */
  description?: string;
  startHour: number;
  endHour: number;
  /** Row the bar sits in, from the top. Spans in one lane must not overlap. */
  lane?: number;
  /** Emphasise the bar, e.g. the spans of the selected item. */
  highlighted?: boolean;
  /** Fade the bar, e.g. spans of other items while one is selected. */
  dimmed?: boolean;
};

export type TimeScrubberProps = {
  /** Current position, 0 to `horizon`. */
  hour: number;
  /** Length of the window in hours. */
  horizon: number;
  playing: boolean;
  onSeek: (hour: number) => void;
  onPlay: () => void;
  onPause: () => void;
  /** Called once per `stepMs` while playing. Advance the hour and stop at the horizon in the parent. */
  onTick: () => void;
  stepMs?: number;
  /** The current time in words, e.g. "13 Mar 08:00". */
  timeLabel: string;
  /** Tick labels under the slider, each at an hour. */
  ticks?: readonly { hour: number; label: string }[];
  spans?: readonly ScrubberSpan[];
  /** Called with a span id when its bar is clicked. */
  onSelectSpan?: (id: string) => void;
  /** Content at the end of the control row. */
  actions?: ReactNode;
  timers?: ScrubberTimers;
  className?: string;
};

const browserTimers: ScrubberTimers = {
  setInterval: (callback, ms) => window.setInterval(callback, ms),
  clearInterval: (id) => window.clearInterval(id),
};

/**
 * A bounded time scrubber for looking ahead: a slider over a fixed window, play and pause, and the
 * planned spans drawn above the track so it is clear what happens when. Playback only runs after
 * the user starts it and the parent stops it at the horizon (see `scrubberReducer`); the timer is
 * cleared on pause and on unmount.
 */
export function TimeScrubber({
  hour,
  horizon,
  playing,
  onSeek,
  onPlay,
  onPause,
  onTick,
  stepMs = 350,
  timeLabel,
  ticks = [],
  spans = [],
  onSelectSpan,
  actions,
  timers = browserTimers,
  className,
}: TimeScrubberProps) {
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  });

  useEffect(() => {
    if (!playing) return undefined;
    const id = timers.setInterval(() => tick.current(), stepMs);
    return () => timers.clearInterval(id);
  }, [playing, stepMs, timers]);

  const lanes = spans.reduce((count, span) => Math.max(count, (span.lane ?? 0) + 1), 0);
  const percent = (value: number): number => (horizon <= 0 ? 0 : Math.min(100, Math.max(0, (value / horizon) * 100)));

  return (
    <div data-slot="time-scrubber" className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-3">
        <Button variant={playing ? 'secondary' : 'default'} size="sm" onClick={playing ? onPause : onPlay}>
          {playing ? <IconPlayerPause /> : <IconPlayerPlay />}
          {playing ? 'Pause' : hour >= horizon ? 'Replay plan' : 'Play plan'}
        </Button>
        <p className="flex items-baseline gap-2" aria-live="off">
          <span className="text-base font-semibold tabular-nums text-base-foreground">+{Math.round(hour)} h</span>
          <span className="text-xs tabular-nums text-muted-foreground">{timeLabel}</span>
        </p>
        {actions ? <div className="ml-auto flex items-center gap-3">{actions}</div> : null}
      </div>

      <div className="flex flex-col gap-1.5 px-1.5">
        {lanes > 0 ? (
          <div className="relative" style={{ height: `${lanes * 1.375}rem` }}>
            <span aria-hidden="true" className="absolute inset-y-0 w-px bg-[var(--primary-background)]" style={{ left: `${percent(hour)}%` }} />
            {spans.map((span) => {
              const left = percent(span.startHour);
              const width = Math.max(percent(span.endHour) - left, 0.5);
              const state = hour >= span.endHour ? 'done' : hour >= span.startHour ? 'active' : 'planned';
              const bar = cn(
                'absolute flex h-5 items-center overflow-hidden rounded-xs border px-1.5 text-left text-xs whitespace-nowrap',
                state === 'active' ? 'border-[var(--primary-background)] bg-[color-mix(in_oklab,var(--primary-background)_30%,transparent)] text-base-foreground' : 'border-default bg-secondary-background text-medium-foreground',
                state === 'done' && 'text-muted-foreground',
                span.highlighted && 'border-emphasized text-base-foreground',
                span.dimmed && 'opacity-40'
              );
              const style = { left: `${left}%`, width: `${width}%`, top: `${(span.lane ?? 0) * 1.375}rem` };
              const title = `${span.description ?? span.label}, +${span.startHour} h to +${span.endHour} h, ${state}`;
              return onSelectSpan ? (
                <button
                  key={span.id}
                  type="button"
                  data-state={state}
                  aria-label={title}
                  onClick={() => onSelectSpan(span.id)}
                  className={cn(bar, 'hover:border-emphasized focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]')}
                  style={style}
                >
                  <span className="truncate">{span.label}</span>
                </button>
              ) : (
                <div key={span.id} data-state={state} role="img" aria-label={title} className={bar} style={style}>
                  <span className="truncate" aria-hidden="true">
                    {span.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <Slider aria-label="Hours ahead" value={[hour]} min={0} max={horizon} step={1} onValueChange={(value) => onSeek(value[0] ?? 0)} />

      {ticks.length > 0 ? (
        <div className="relative mx-1.5 h-4" aria-hidden="true">
          {ticks.map((mark) => (
            <span
              key={mark.hour}
              className={cn('absolute text-xs whitespace-nowrap tabular-nums text-muted-foreground', mark.hour <= 0 ? '' : mark.hour >= horizon ? '-translate-x-full' : '-translate-x-1/2')}
              style={{ left: `${percent(mark.hour)}%` }}
            >
              {mark.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
