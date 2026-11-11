import { useEffect, useRef } from 'react';

/** The clock a playback runs on. Injectable so tests can step time by hand. */
export type FrameScheduler = {
  request: (callback: (timestamp: number) => void) => number;
  cancel: (id: number) => void;
};

const browserScheduler: FrameScheduler = {
  request: (callback) => window.requestAnimationFrame(callback),
  cancel: (id) => window.cancelAnimationFrame(id),
};

export type PlaybackOptions = {
  /** Play while true. The parent starts it; it always ends on its own at `max`. */
  running: boolean;
  /** Units gained per second. */
  rate: number;
  /** Current value. */
  value: number;
  max: number;
  onValue: (value: number) => void;
  /** Called once when the value reaches `max`, so the parent can switch `running` off. */
  onEnd: () => void;
  scheduler?: FrameScheduler;
};

/** One tick of playback: the next value and whether it has reached the end. Elapsed time is capped so a stalled tab does not jump. */
export function advanceValue(value: number, rate: number, elapsedMs: number, max: number, capMs = 250): { value: number; ended: boolean } {
  const next = Math.min(max, Math.max(0, value + (rate * Math.min(Math.max(elapsedMs, 0), capMs)) / 1000));
  return { value: next, ended: next >= max };
}

/**
 * Advances a number over time, one animation frame at a time, only while `running`. It is bounded:
 * it stops itself at `max` and never schedules a frame when not running, so nothing loops forever.
 */
export function usePlayback({ running, rate, value, max, onValue, onEnd, scheduler = browserScheduler }: PlaybackOptions): void {
  const latest = useRef({ rate, value, max, onValue, onEnd });
  useEffect(() => {
    latest.current = { rate, value, max, onValue, onEnd };
  });

  useEffect(() => {
    if (!running) return undefined;
    let last: number | null = null;
    let id = 0;
    let stopped = false;
    const tick = (timestamp: number) => {
      if (stopped) return;
      const current = latest.current;
      const elapsed = last === null ? 0 : timestamp - last;
      last = timestamp;
      const step = advanceValue(current.value, current.rate, elapsed, current.max);
      latest.current = { ...current, value: step.value };
      current.onValue(step.value);
      if (step.ended) {
        stopped = true;
        current.onEnd();
        return;
      }
      id = scheduler.request(tick);
    };
    id = scheduler.request(tick);
    return () => {
      stopped = true;
      scheduler.cancel(id);
    };
  }, [running, scheduler]);
}
