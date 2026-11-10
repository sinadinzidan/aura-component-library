import { Button } from '@cognite/aura/components/button';
import { Slider } from '@cognite/aura/components/slider';
import { IconChevronLeft, IconChevronRight, IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlayerSkipBackFilled } from '@cognite/aura/icons';
import { useEffect } from 'react';

import { cn } from '../../../lib/utils';
import type { DotShape, Tone } from '../../industrial/status';
import { StatusDot } from '../../industrial/StatusDot';

import { stepTime, timeFraction } from './replayState';

export type ReplayTimers = {
  setInterval: (callback: () => void, ms: number) => number;
  clearInterval: (id: number) => void;
};

export type ReplayMarker = { id: string; t: number; label: string; tone: Tone };

export type ReplayTimelineProps = {
  from: number;
  to: number;
  /** Playhead position. */
  value: number;
  onValueChange: (value: number) => void;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  /** Events on the timeline, sorted by time. Clicking one moves the playhead there. */
  markers: readonly ReplayMarker[];
  /** Size of one step: the scrubber grid, the step buttons and one tick of playback. */
  stepMs: number;
  /** Words for one step on the buttons: "1 min". */
  stepLabel: string;
  /** Real time between ticks while playing. */
  tickMs?: number;
  /** Times printed under the track. */
  ticks: readonly number[];
  formatTime: (timestamp: number) => string;
  /** Accessible name, e.g. "Replay of the recompressor trip". */
  label: string;
  /** Injected so tests control time. */
  timers?: ReplayTimers;
  className?: string;
};

const DEFAULT_TIMERS: ReplayTimers = {
  setInterval: (callback, ms) => window.setInterval(callback, ms),
  clearInterval: (id) => window.clearInterval(id),
};

const MARKER_SHAPE: Record<Tone, DotShape> = { neutral: 'ring', info: 'dot', success: 'dot', warning: 'square', critical: 'diamond' };

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

/** Keeps a marker label inside the track: left-aligned near the start, right-aligned near the end. */
function anchorClass(fraction: number): string {
  if (fraction < 0.12) return 'items-start';
  if (fraction > 0.88) return 'items-end -translate-x-full';
  return 'items-center -translate-x-1/2';
}

/**
 * The master timeline of a replay: event markers on a track, a playhead, a scrubber and transport
 * buttons (step back, play or pause, step forward, back to start). Controlled, so every chart and
 * panel on the screen follows one position. Playback only runs after the user presses Play and
 * stops itself at the end.
 */
export function ReplayTimeline({
  from,
  to,
  value,
  onValueChange,
  playing,
  onPlayingChange,
  markers,
  stepMs,
  stepLabel,
  tickMs = 450,
  ticks,
  formatTime,
  label,
  timers = DEFAULT_TIMERS,
  className,
}: ReplayTimelineProps) {
  const atStart = value <= from;
  const atEnd = value >= to;
  const position = timeFraction(value, from, to);

  useEffect(() => {
    if (!playing) return undefined;
    const id = timers.setInterval(() => {
      const next = stepTime(value, stepMs, from, to);
      onValueChange(next);
      if (next >= to) onPlayingChange(false);
    }, tickMs);
    return () => timers.clearInterval(id);
  }, [playing, value, stepMs, from, to, tickMs, timers, onValueChange, onPlayingChange]);

  const toggle = () => {
    // Pressing Play at the end replays from the start.
    if (!playing && atEnd) onValueChange(from);
    onPlayingChange(!playing);
  };

  const scrub = (next: number) => {
    if (playing) onPlayingChange(false);
    onValueChange(next);
  };

  return (
    <div data-slot="replay-timeline" role="group" aria-label={label} className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="relative h-24 w-full">
        <div aria-hidden className="absolute inset-x-0 top-[3.25rem] h-1.5 rounded-full bg-chart-neutral-200" />
        <div
          data-slot="replay-played"
          aria-hidden
          className="absolute left-0 top-[3.25rem] h-1.5 rounded-full bg-primary-background"
          style={{ width: percent(position) }}
        />
        {ticks.map((tick) => (
          <span
            key={tick}
            aria-hidden
            className="absolute top-[4.25rem] flex -translate-x-1/2 flex-col items-center gap-0.5 text-xs text-muted-foreground tabular-nums"
            style={{ left: percent(timeFraction(tick, from, to)) }}
          >
            <span className="h-1.5 border-l border-emphasized" />
            {formatTime(tick)}
          </span>
        ))}
        {markers.map((marker, index) => {
          const fraction = timeFraction(marker.t, from, to);
          const reached = marker.t <= value;
          return (
            <button
              key={marker.id}
              type="button"
              data-slot="replay-marker"
              data-reached={reached ? 'true' : 'false'}
              aria-label={`Go to ${formatTime(marker.t)}, ${marker.label}`}
              onClick={() => scrub(marker.t)}
              className={cn(
                'absolute flex cursor-pointer flex-col gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring-default)]',
                // Two label rows, so neighbouring events do not collide.
                index % 2 === 0 ? 'top-0 h-[3.25rem]' : 'top-6 h-7',
                anchorClass(fraction)
              )}
              style={{ left: percent(fraction) }}
            >
              <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs', reached ? 'font-medium text-base-foreground' : 'text-muted-foreground')}>
                <StatusDot tone={marker.tone} shape={MARKER_SHAPE[marker.tone]} size="sm" />
                {marker.label}
              </span>
              <span aria-hidden className={cn('flex-1 border-l', reached ? 'border-[color:var(--primary-background)]' : 'border-emphasized')} />
            </button>
          );
        })}
        <div
          data-slot="replay-playhead"
          aria-hidden
          className="pointer-events-none absolute top-10 h-8 w-0.5 -translate-x-1/2 rounded-full bg-primary-background shadow-[0_0_10px_color-mix(in_oklab,var(--primary-background)_60%,transparent)]"
          style={{ left: percent(position) }}
        />
      </div>

      <Slider
        aria-label="Replay position"
        className="w-full"
        min={from}
        max={to}
        step={stepMs}
        value={[value]}
        onValueChange={(next) => {
          const target = next[0];
          if (target !== undefined) scrub(target);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={atStart} aria-label={`Step back ${stepLabel}`} onClick={() => scrub(stepTime(value, -stepMs, from, to))}>
          <IconChevronLeft /> {stepLabel}
        </Button>
        <Button size="sm" aria-label={playing ? 'Pause replay' : atEnd ? 'Replay from start' : 'Play replay'} onClick={toggle}>
          {playing ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
          {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
        </Button>
        <Button variant="outline" size="sm" disabled={atEnd} aria-label={`Step forward ${stepLabel}`} onClick={() => scrub(stepTime(value, stepMs, from, to))}>
          {stepLabel} <IconChevronRight />
        </Button>
        <Button variant="ghost" size="sm" disabled={atStart} onClick={() => scrub(from)}>
          <IconPlayerSkipBackFilled /> Back to start
        </Button>
        <p data-slot="replay-position" aria-live="off" className="ml-auto text-sm text-muted-foreground tabular-nums">
          <span className="text-base font-semibold text-base-foreground">{formatTime(value)}</span> of {formatTime(to)}
          {atEnd ? ' · end of replay' : atStart ? ' · start of replay' : ''}
        </p>
      </div>
    </div>
  );
}
