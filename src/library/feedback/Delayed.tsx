import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type DelayedProps = {
  /** Usually a Loader or Skeleton. */
  children: ReactNode;
  /** How long to wait before showing the children. Waits shorter than this show nothing. */
  delayMs?: number;
  setTimer?: (callback: () => void, ms: number) => number;
  clearTimer?: (handle: number) => void;
};

const defaultSetTimer = (callback: () => void, ms: number) => window.setTimeout(callback, ms);
const defaultClearTimer = (handle: number) => window.clearTimeout(handle);

/**
 * Holds back a loading indicator for a moment, so responses that arrive within about 300 ms do
 * not flash a loader on screen. Mount it when the wait starts and unmount it when content arrives.
 */
export function Delayed({
  children,
  delayMs = 300,
  setTimer = defaultSetTimer,
  clearTimer = defaultClearTimer,
}: DelayedProps) {
  const [due, setDue] = useState(delayMs <= 0);

  useEffect(() => {
    if (delayMs <= 0) return;
    const handle = setTimer(() => setDue(true), delayMs);
    return () => clearTimer(handle);
  }, [delayMs, setTimer, clearTimer]);

  return due ? <>{children}</> : null;
}
