import { useEffect, useRef, useState } from 'react';

import { easeInOut } from './sunburstLayout';

export type TweenOptions = {
  /** Identity of the target. The tween restarts when it changes, not when the object does. */
  key: string;
  durationMs?: number;
  /** `false` jumps straight to the target. Reduced-motion preferences do the same. */
  animate?: boolean;
};

/** Whether the viewer has asked for less motion. `false` where the media query is unavailable. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates from the value currently shown to a new target whenever `key` changes, with an ease
 * in and out. Used for the things CSS cannot transition: a viewport, a set of arcs. Returns the
 * value to draw and whether the tween has finished, so labels can wait for a clean end state.
 */
export function useTween<T>(target: T, interpolate: (from: T, to: T, progress: number) => T, options: TweenOptions): { value: T; settled: boolean } {
  const { key, durationMs = 450, animate = true } = options;
  const [shown, setShown] = useState<{ key: string; value: T }>({ key, value: target });
  const valueRef = useRef(target);
  const doneKeyRef = useRef(key);
  const latest = useRef({ target, interpolate });

  useEffect(() => {
    latest.current = { target, interpolate };
  });

  useEffect(() => {
    if (doneKeyRef.current === key) return undefined;
    const from = valueRef.current;
    const to = latest.current.target;
    const instant = !animate || prefersReducedMotion();
    if (instant) {
      valueRef.current = to;
      doneKeyRef.current = key;
    }

    let handle = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const progress = instant ? 1 : Math.min(1, (now - start) / durationMs);
      const value = progress >= 1 ? to : latest.current.interpolate(from, to, easeInOut(progress));
      valueRef.current = value;
      if (progress >= 1) doneKeyRef.current = key;
      setShown({ key: progress >= 1 ? key : '', value });
      if (progress < 1) handle = window.requestAnimationFrame(tick);
    };
    handle = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(handle);
  }, [key, animate, durationMs]);

  if (!animate) return { value: target, settled: true };
  return { value: shown.value, settled: shown.key === key };
}
