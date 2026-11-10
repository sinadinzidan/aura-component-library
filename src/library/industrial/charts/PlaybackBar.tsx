import { Button } from '@cognite/aura/components/button';
import { Slider } from '@cognite/aura/components/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlayerSkipBackFilled, IconPlayerSkipForwardFilled } from '@cognite/aura/icons';
import { useEffect } from 'react';

import { cn } from '../../../lib/utils';

import { formatDayTime } from './timeAxis';
import { advancePlayback, nextSpeed } from './timeWindow';

export type PlaybackTimers = {
  setInterval: (callback: () => void, ms: number) => number;
  clearInterval: (id: number) => void;
};

export type PlaybackBarProps = {
  /** Start and end of the period being replayed. */
  from: number;
  to: number;
  /** Current position. */
  value: number;
  onValueChange: (value: number) => void;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  speeds?: readonly number[];
  /** How far the position moves per tick at 1×. Also the scrubber step. */
  stepMs: number;
  /** Real time between ticks while playing. */
  tickMs?: number;
  formatTime?: (timestamp: number) => string;
  /** Injected so tests and stories control time. */
  timers?: PlaybackTimers;
  className?: string;
};

const DEFAULT_SPEEDS = [1, 2, 4, 8];
const DEFAULT_TIMERS: PlaybackTimers = {
  setInterval: (callback, ms) => window.setInterval(callback, ms),
  clearInterval: (id) => window.clearInterval(id),
};

/**
 * Replays a period: play and pause, jump to either end, a speed button and a scrubber. The bar is
 * controlled — it reports the new position on every tick and stops itself at the end — so the
 * charts on the page can all follow one position.
 */
export function PlaybackBar({
  from,
  to,
  value,
  onValueChange,
  playing,
  onPlayingChange,
  speed,
  onSpeedChange,
  speeds = DEFAULT_SPEEDS,
  stepMs,
  tickMs = 1000,
  formatTime = formatDayTime,
  timers = DEFAULT_TIMERS,
  className,
}: PlaybackBarProps) {
  const atEnd = value >= to;

  useEffect(() => {
    if (!playing) return undefined;
    const id = timers.setInterval(() => {
      const next = advancePlayback(value, stepMs, speed, to);
      onValueChange(next);
      if (next >= to) onPlayingChange(false);
    }, tickMs);
    return () => timers.clearInterval(id);
  }, [playing, value, stepMs, speed, to, tickMs, timers, onValueChange, onPlayingChange]);

  const toggle = () => {
    // Play from the start again when the end was reached.
    if (!playing && atEnd) onValueChange(from);
    onPlayingChange(!playing);
  };

  return (
    <div data-slot="playback-bar" role="group" aria-label="Playback" className={cn('flex w-full items-center gap-2', className)}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Go to start" onClick={() => onValueChange(from)}>
              <IconPlayerSkipBackFilled />
            </Button>
          }
        />
        <TooltipContent>Go to start</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="secondary" size="icon-sm" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle}>
              {playing ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
            </Button>
          }
        />
        <TooltipContent>{playing ? 'Pause' : 'Play'}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Go to end" onClick={() => onValueChange(to)}>
              <IconPlayerSkipForwardFilled />
            </Button>
          }
        />
        <TooltipContent>Go to end</TooltipContent>
      </Tooltip>
      <span data-slot="playback-position" className="w-28 shrink-0 text-sm text-base-foreground tabular-nums">
        {formatTime(value)}
      </span>
      <Slider
        aria-label="Playback position"
        className="min-w-0 flex-1"
        min={from}
        max={to}
        step={stepMs}
        value={[value]}
        onValueChange={(next) => {
          const position = next[0];
          if (position !== undefined) onValueChange(position);
        }}
      />
      <span className="hidden w-28 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:inline">{formatTime(to)}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="sm" aria-label={`Playback speed ${speed}×, change`} onClick={() => onSpeedChange(nextSpeed(speeds, speed))}>
              <span className="tabular-nums">{speed}×</span>
            </Button>
          }
        />
        <TooltipContent>Playback speed</TooltipContent>
      </Tooltip>
    </div>
  );
}
