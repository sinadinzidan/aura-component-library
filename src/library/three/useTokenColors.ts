import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { resolveTokenColors, sameTokenColors } from './tokenColors';
import type { TokenColors, TokenMap } from './tokenColors';

/**
 * Resolves design tokens to concrete colours for three.js materials, which cannot read CSS
 * variables. Pass a map of role → token name (without `--`) and a ref to any element inside the
 * theme scope the scene belongs to:
 *
 *   const colors = useTokenColors({ surface: 'card-background', accent: 'primary-background' }, ref);
 *   // colors?.accent → { color: 'rgb(129, 197, 182)', opacity: 1 }
 *
 * A hidden probe inside that element is read with `getComputedStyle`, and read again whenever the
 * class, style or data attributes of an ancestor change, so the scene follows theme and mode
 * switches. Returns `null` until the first read (and wherever computed styles are unavailable).
 */
export function useTokenColors<T extends TokenMap>(tokens: T, scopeRef: RefObject<HTMLElement | null>): TokenColors<T> | null {
  const [colors, setColors] = useState<TokenColors<T> | null>(null);
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;
  const signature = JSON.stringify(tokens);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || typeof window === 'undefined') return undefined;

    const probe = scope.ownerDocument.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    probe.setAttribute('data-slot', 'token-probe');
    probe.style.display = 'none';
    scope.appendChild(probe);

    const read = () => {
      const next = resolveTokenColors(tokensRef.current, (token) => {
        probe.style.color = `var(--${token})`;
        return window.getComputedStyle(probe).color;
      });
      setColors((previous) => (sameTokenColors(previous, next) ? previous : next));
    };
    read();

    let frame = 0;
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(read);
    };
    const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(schedule);
    for (let node: HTMLElement | null = scope; node && observer; node = node.parentElement) {
      observer.observe(node, { attributes: true });
    }

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      probe.remove();
    };
  }, [scopeRef, signature]);

  return colors;
}
