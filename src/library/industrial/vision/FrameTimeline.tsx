import { Slider } from '@cognite/aura/components/slider';

import { cn } from '../../../lib/utils';
import { TONE_DOT } from '../status';
import type { Tone } from '../status';

import { fractionOf, timeAtFraction } from './frameTime';
import type { TimelineMark } from './frameTime';

export type FrameTimelineMark = TimelineMark & { tone?: Tone };

export type FrameTimelineProps = {
  from: number;
  to: number;
  /** Time of the frame shown. */
  value: number;
  onValueChange: (time: number) => void;
  marks?: readonly FrameTimelineMark[];
  /** Formats a time for the end labels and the accessible value. */
  format: (time: number) => string;
  /** Accessible name of the scrubber. */
  label?: string;
  className?: string;
};

/** Slider resolution: a thousand steps across the range. */
const STEPS = 1000;

/**
 * A scrubber for recorded video: a slider across a time range with event marks beneath it. Each
 * mark is a button that jumps the frame to the event; the slider takes arrow keys like any other.
 */
export function FrameTimeline({ from, to, value, onValueChange, marks = [], format, label = 'Playback position', className }: FrameTimelineProps) {
  return (
    <div data-slot="frame-timeline" className={cn('flex w-full min-w-0 flex-col gap-1.5', className)}>
      <Slider
        aria-label={label}
        min={0}
        max={STEPS}
        step={1}
        value={[Math.round(fractionOf(value, from, to) * STEPS)]}
        onValueChange={(next) => onValueChange(timeAtFraction((next[0] ?? 0) / STEPS, from, to))}
      />
      <div className="relative h-6">
        {marks.map((mark) => (
          <button
            key={mark.id}
            type="button"
            aria-label={`${mark.label}, ${format(mark.at)}`}
            onClick={() => onValueChange(mark.at)}
            className="group absolute top-0 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-0.5 rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-[var(--ring-default)]"
            style={{ left: `${fractionOf(mark.at, from, to) * 100}%` }}
          >
            <span aria-hidden="true" className={cn('size-2 rounded-full', TONE_DOT[mark.tone ?? 'neutral'])} />
            <span aria-hidden="true" className="hidden whitespace-nowrap text-xs leading-none text-muted-foreground group-hover:block group-focus-visible:block">
              {mark.label}
            </span>
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{format(from)}</span>
        <span className="font-medium text-base-foreground">{format(value)}</span>
        <span>{format(to)}</span>
      </div>
    </div>
  );
}
