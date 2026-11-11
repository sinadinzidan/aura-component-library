import { useCallback, useEffect, useRef } from 'react';

import { easeInOut } from '../../experiences/drilldown/sunburstLayout';
import { prefersReducedMotion } from '../../experiences/drilldown/useTween';

import { mixViewports } from './viewport';
import type { ViewSize, Viewport } from './viewport';

export type ViewportFlightOptions = {
  durationMs?: number;
  /** `false` jumps straight to the target. A reduced-motion preference does the same. */
  animate?: boolean;
};

/**
 * Flies a viewport from where it is to a target over a few hundred milliseconds, calling
 * `onFrame` with each step. The flight ends by itself, is replaced by the next one and is
 * cancelled when the component unmounts or the user takes over.
 */
export function useViewportFlight(onFrame: (viewport: Viewport) => void, { durationMs = 420, animate = true }: ViewportFlightOptions = {}) {
  const handle = useRef(0);
  const latest = useRef(onFrame);

  useEffect(() => {
    latest.current = onFrame;
  });

  const cancel = useCallback(() => {
    if (handle.current) window.cancelAnimationFrame(handle.current);
    handle.current = 0;
  }, []);

  useEffect(() => cancel, [cancel]);

  const fly = useCallback(
    (from: Viewport, to: Viewport, size: ViewSize) => {
      cancel();
      if (!animate || prefersReducedMotion() || typeof window.requestAnimationFrame !== 'function') {
        latest.current(to);
        return;
      }
      let start: number | null = null;
      const tick = (now: number) => {
        start ??= now;
        const progress = Math.min(1, (now - start) / durationMs);
        latest.current(progress >= 1 ? to : mixViewports(from, to, size, easeInOut(progress)));
        handle.current = progress < 1 ? window.requestAnimationFrame(tick) : 0;
      };
      handle.current = window.requestAnimationFrame(tick);
    },
    [animate, cancel, durationMs]
  );

  return { fly, cancel };
}
