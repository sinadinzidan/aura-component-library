import { useId, useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { cx, toneLine, type Tone } from '../tones';

import { fractionAt, lanePath, laneValueAt, laneY, timeAtFraction, type LanePoint } from './replayLanes';

export type ScrubberLane = {
  id: string;
  /** What is measured: "Drive-end vibration". */
  label: string;
  /** The reading at the playhead with its unit, already formatted. */
  valueText: string;
  /** Judgement of the reading at the playhead; colours the value and the dot on the line. */
  tone?: Tone;
  /** Oldest first. */
  points: readonly LanePoint[];
  /** Fixed value range, so the line does not rescale while it draws. */
  domain: readonly [number, number];
  /** An alarm limit drawn across the lane. */
  limit?: number;
};

export type ScrubberEvent = {
  id: string;
  t: number;
  /** Spoken name of the marker: "Trip". */
  label: string;
  tone?: Tone;
};

type ReplayScrubberProps = {
  /** Accessible name of the slider: "Replay time". */
  label: string;
  from: number;
  to: number;
  /** The playhead. Controlled. */
  value: number;
  onValueChange: (t: number) => void;
  /** Keyboard step and pointer snap. */
  stepMs?: number;
  lanes: readonly ScrubberLane[];
  /** Numbered markers above the lanes; clicking one moves the playhead there. */
  events?: readonly ScrubberEvent[];
  /** Times labelled under the lanes. */
  ticks?: readonly number[];
  formatTime: (t: number) => string;
  className?: string;
};

const LANE_WIDTH = 1000;
const LANE_HEIGHT = 40;

/**
 * A timeline to scrub: one lane per signal, numbered event markers above them and a playhead
 * through all of it. Lines are drawn strong up to the playhead and faint after it, so the future
 * is visible but clearly not yet played. Drag anywhere on the lanes, or focus them and use the
 * arrow keys; Home and End jump to the ends.
 */
export function ReplayScrubber({ label, from, to, value, onValueChange, stepMs = 60_000, lanes, events = [], ticks = [], formatTime, className }: ReplayScrubberProps) {
  const track = useRef<HTMLDivElement>(null);
  const clipId = useId();
  const fraction = fractionAt(value, from, to);
  const left = `${(fraction * 100).toFixed(3)}%`;

  const seek = (clientX: number) => {
    const box = track.current?.getBoundingClientRect();
    if (!box || box.width <= 0) return;
    onValueChange(timeAtFraction((clientX - box.left) / box.width, from, to, stepMs));
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    seek(event.clientX);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.buttons === 1) seek(event.clientX);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowLeft: value - stepMs, ArrowDown: value - stepMs, ArrowRight: value + stepMs, ArrowUp: value + stepMs, PageDown: value - 5 * stepMs, PageUp: value + 5 * stepMs, Home: from, End: to };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onValueChange(Math.min(Math.max(next, from), to));
  };

  return (
    <div data-slot="replay-scrubber" className={cx('flex min-w-0 text-sm text-[var(--kit-text)]', className)}>
      <div className="flex w-64 shrink-0 flex-col border-r border-[var(--kit-rule)]">
        {events.length > 0 ? <div className="flex h-9 items-center px-4 text-xs text-[var(--kit-text-3)]">Events</div> : null}
        {lanes.map((lane) => (
          <div key={lane.id} className="flex h-11 items-center justify-between gap-3 border-t border-[var(--kit-rule)] px-4">
            <span className="min-w-0 truncate text-[var(--kit-text-2)]">{lane.label}</span>
            <span data-slot="lane-value" className="shrink-0 font-semibold tabular-nums" style={{ color: lane.tone && lane.tone !== 'neutral' ? toneLine(lane.tone) : undefined }}>
              {lane.valueText}
            </span>
          </div>
        ))}
        {ticks.length > 0 ? <div className="flex h-7 items-center border-t border-[var(--kit-rule)] px-4 text-xs text-[var(--kit-text-3)]">Time, UTC</div> : null}
      </div>

      <div className="relative min-w-0 flex-1 px-5">
        <div className="relative">
          {events.length > 0 ? (
            <div className="relative h-9">
              <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-[var(--kit-rule)]" />
              {events.map((event, index) => {
                const reached = event.t <= value;
                const tone = event.tone ?? 'neutral';
                return (
                  <button
                    key={event.id}
                    type="button"
                    aria-label={`Jump to ${event.label}, ${formatTime(event.t)}`}
                    title={`${event.label}, ${formatTime(event.t)}`}
                    onClick={() => onValueChange(event.t)}
                    style={{ left: `${(fractionAt(event.t, from, to) * 100).toFixed(3)}%`, background: reached ? toneLine(tone) : undefined, borderColor: toneLine(tone), color: reached ? 'var(--kit-halo)' : toneLine(tone) }}
                    className="absolute top-1/2 z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center border-2 bg-[var(--kit-halo)] text-xs font-bold tabular-nums leading-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-default)]"
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div
            ref={track}
            role="slider"
            tabIndex={0}
            aria-label={label}
            aria-valuemin={from}
            aria-valuemax={to}
            aria-valuenow={value}
            aria-valuetext={formatTime(value)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onKeyDown={onKeyDown}
            className="relative cursor-ew-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-default)]"
          >
            {lanes.map((lane, index) => {
              const path = lanePath(lane.points, from, to, lane.domain, LANE_WIDTH, LANE_HEIGHT);
              const reading = laneValueAt(lane.points, value);
              const stroke = toneLine(lane.tone && lane.tone !== 'neutral' ? lane.tone : 'accent');
              const limitY = lane.limit === undefined ? null : laneY(lane.limit, lane.domain, LANE_HEIGHT);
              return (
                <div key={lane.id} data-slot="scrubber-lane" className="relative h-11 border-t border-[var(--kit-rule)] py-0.5">
                  <svg aria-hidden="true" viewBox={`0 0 ${LANE_WIDTH} ${LANE_HEIGHT}`} preserveAspectRatio="none" className="size-full overflow-visible">
                    <defs>
                      <clipPath id={`${clipId}-${index}`}>
                        <rect x={0} y={-4} width={fraction * LANE_WIDTH} height={LANE_HEIGHT + 8} />
                      </clipPath>
                    </defs>
                    {limitY === null ? null : <line x1={0} x2={LANE_WIDTH} y1={limitY} y2={limitY} stroke={toneLine('warning')} strokeWidth={1.5} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />}
                    <path d={path} fill="none" stroke="var(--kit-text-3)" strokeWidth={1.25} vectorEffect="non-scaling-stroke" opacity={0.45} />
                    <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" clipPath={`url(#${clipId}-${index})`} />
                  </svg>
                  {reading === null ? null : (
                    <span
                      aria-hidden="true"
                      style={{ left, top: `calc(0.125rem + ${(laneY(reading, lane.domain, LANE_HEIGHT) / LANE_HEIGHT) * 100}% * 40 / 44)`, background: stroke }}
                      className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--kit-halo)]"
                    />
                  )}
                </div>
              );
            })}

            {ticks.length > 0 ? (
              <div className="relative h-7 border-t border-[var(--kit-rule)]">
                {ticks.map((tick) => (
                  <span key={tick} style={{ left: `${(fractionAt(tick, from, to) * 100).toFixed(3)}%` }} className="absolute top-1.5 -translate-x-1/2 text-xs tabular-nums text-[var(--kit-text-3)]">
                    {formatTime(tick)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div data-slot="scrubber-playhead" aria-hidden="true" style={{ left }} className="pointer-events-none absolute inset-y-0 z-20 w-0">
            <span className="absolute inset-y-0 -left-px w-0.5 bg-[var(--kit-text)]" />
            <span className="absolute -top-2.5 left-0 -translate-x-1/2 whitespace-nowrap bg-[var(--kit-text)] px-1.5 py-0.5 text-xs font-semibold tabular-nums leading-4 text-[var(--kit-halo)]">{formatTime(value)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
