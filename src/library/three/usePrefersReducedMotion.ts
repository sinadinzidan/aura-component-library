import { useEffect, useState } from 'react';

type MediaQueryLike = {
  matches: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

export type MatchMedia = (query: string) => MediaQueryLike;

const QUERY = '(prefers-reduced-motion: reduce)';

function defaultMatchMedia(): MatchMedia | undefined {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
  return (query) => window.matchMedia(query);
}

/** Whether the user prefers reduced motion, kept up to date. `matchMedia` is injectable for tests. */
export function usePrefersReducedMotion(matchMedia: MatchMedia | undefined = defaultMatchMedia()): boolean {
  const [reduced, setReduced] = useState(() => matchMedia?.(QUERY).matches ?? false);

  useEffect(() => {
    if (!matchMedia) return undefined;
    const media = matchMedia(QUERY);
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
    // matchMedia is a stable browser function or a test double created once per test.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return reduced;
}
