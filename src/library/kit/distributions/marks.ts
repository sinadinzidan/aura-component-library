import type { CSSProperties } from 'react';

import type { LookId } from '../../looks/looks';

/**
 * How a look draws a filled mark — a histogram bar, a box, a range. Solid in most looks, black
 * outlined in poster, hatched outline on a blueprint, a glowing gradient in glass.
 */
export function markStyle(look: LookId, color: string): CSSProperties {
  switch (look) {
    case 'poster':
      return { background: color, border: '2px solid var(--kit-text)' };
    case 'blueprint':
      return {
        border: `1px solid ${color}`,
        background: `repeating-linear-gradient(135deg, color-mix(in oklab, ${color} 55%, transparent) 0 1px, transparent 1px 5px)`,
      };
    case 'glass':
      return {
        background: `linear-gradient(to top, color-mix(in oklab, ${color} 35%, transparent), ${color})`,
        boxShadow: `0 0 14px color-mix(in oklab, ${color} 40%, transparent)`,
      };
    default:
      return { background: color };
  }
}

/** Gap between neighbouring marks in px: bars touch in poster and sit on hairlines in console. */
export function markGap(look: LookId): number {
  switch (look) {
    case 'poster':
      return 0;
    case 'console':
    case 'editorial':
    case 'blueprint':
      return 1;
    case 'soft':
      return 4;
    default:
      return 2;
  }
}

/** Corner radius of a mark in px, capped so narrow bars keep a flat side. */
export function markRadius(look: LookId, cap = 6): number {
  switch (look) {
    case 'soft':
      return cap;
    case 'studio':
    case 'glass':
      return Math.min(cap, 4);
    case 'signal':
      return 2;
    default:
      return 0;
  }
}

/** How a look draws one point of a scatter plot. */
export function pointStyle(look: LookId, color: string): CSSProperties {
  switch (look) {
    case 'poster':
      return { background: color, border: '2px solid var(--kit-text)', borderRadius: 0 };
    case 'blueprint':
      return { border: `1.5px solid ${color}`, background: 'var(--kit-halo)', borderRadius: '50%' };
    case 'console':
      return { background: color, borderRadius: 0 };
    case 'glass':
      return { background: color, borderRadius: '50%', boxShadow: `0 0 10px ${color}` };
    default:
      return { background: `color-mix(in oklab, ${color} 78%, transparent)`, borderRadius: '50%' };
  }
}
