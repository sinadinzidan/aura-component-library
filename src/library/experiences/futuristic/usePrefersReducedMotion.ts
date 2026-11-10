import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function getQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null;
}

function subscribe(onChange: () => void): () => void {
  const query = getQuery();
  if (!query || typeof query.addEventListener !== 'function') return () => undefined;
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return getQuery()?.matches ?? false;
}

/**
 * Whether the person asked the system for less motion. CSS animation is switched with Tailwind's
 * `motion-safe:`; this hook is for motion that CSS cannot reach, such as SVG `animateMotion` and
 * the Web Animations API.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
