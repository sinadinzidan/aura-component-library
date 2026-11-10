import { useCallback, useEffect, useRef, useState } from 'react';

export type WaitPhase = 'idle' | 'waiting' | 'done';

export type WaitTimers = {
  set: (callback: () => void, ms: number) => number;
  clear: (handle: number) => void;
};

export type SimulatedWait = {
  phase: WaitPhase;
  /** Enters `waiting`, then `done` after the delay. Restarts the delay when already waiting. */
  start: () => void;
  /** Back to `idle`, cancelling a wait in flight. */
  reset: () => void;
};

const browserTimers: WaitTimers = {
  set: (callback, ms) => window.setTimeout(callback, ms),
  clear: (handle) => window.clearTimeout(handle),
};

/**
 * A wait that the user starts and that always ends: idle → waiting → done. For demos of loading
 * states, where a real request would otherwise be needed. The timer is cancelled on unmount.
 */
export function useSimulatedWait(ms = 1600, timers: WaitTimers = browserTimers): SimulatedWait {
  const [phase, setPhase] = useState<WaitPhase>('idle');
  const handle = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (handle.current !== null) timers.clear(handle.current);
    handle.current = null;
  }, [timers]);

  useEffect(() => cancel, [cancel]);

  const start = useCallback(() => {
    cancel();
    setPhase('waiting');
    handle.current = timers.set(() => {
      handle.current = null;
      setPhase('done');
    }, ms);
  }, [cancel, ms, timers]);

  const reset = useCallback(() => {
    cancel();
    setPhase('idle');
  }, [cancel]);

  return { phase, start, reset };
}
