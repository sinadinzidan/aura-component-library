import type { CSSProperties } from 'react';

import type { LookId } from '../../looks/looks';

/** Inline style that may also set CSS custom properties. */
export type KitStyle = CSSProperties & Record<`--${string}`, string>;

/**
 * How a look draws a small self-contained block — a stage, a tile, a cell:
 * `card` is a bordered surface, `tint` a pastel fill, `strip` a square block with a state edge,
 * `solid` a block filled with its tone, `outline` a drawn box and `rule` a column under a rule.
 */
export type BlockAnatomy = 'card' | 'tint' | 'strip' | 'solid' | 'outline' | 'rule';

export const BLOCK_ANATOMY: Record<LookId, BlockAnatomy> = {
  studio: 'card',
  glass: 'card',
  soft: 'tint',
  console: 'strip',
  poster: 'solid',
  signal: 'solid',
  blueprint: 'outline',
  editorial: 'rule',
};

/** True when the look fills blocks with their tone, so content must use the on-colour. */
export function isSolidLook(look: LookId): boolean {
  return BLOCK_ANATOMY[look] === 'solid';
}

const ON_POP: KitStyle = { '--kit-text': 'var(--t-on-pop)', '--kit-text-2': 'var(--t-on-pop)', '--kit-text-3': 'color-mix(in oklab, var(--t-on-pop) 78%, transparent)', '--kit-track': 'color-mix(in oklab, var(--t-on-pop) 22%, transparent)' };

const ON_VIVID: KitStyle = { '--kit-text': 'var(--t-on-vivid)', '--kit-text-2': 'var(--t-on-vivid)', '--kit-text-3': 'color-mix(in oklab, var(--t-on-vivid) 84%, transparent)', '--kit-track': 'color-mix(in oklab, var(--t-on-vivid) 26%, transparent)' };

/**
 * The box of a block in a look. Put it on an element that also carries `data-tone`, because the
 * fills and edges read the tone variables.
 */
export function blockStyle(look: LookId): KitStyle {
  switch (look) {
    case 'studio':
      return { background: 'var(--kit-surface)', border: '1px solid var(--kit-rule)', borderRadius: 'var(--kit-radius-sm)', boxShadow: '0 1px 2px var(--effect-shadow-xl)' };
    case 'glass':
      return {
        background: 'var(--kit-surface)',
        border: '1px solid var(--kit-rule)',
        borderRadius: 'var(--kit-radius-sm)',
        boxShadow: 'inset 0 1px 0 color-mix(in oklab, var(--mountain-white) 14%, transparent)',
        backdropFilter: 'blur(14px)',
      };
    case 'soft':
      return { background: 'var(--t-soft)', borderRadius: 'var(--kit-radius-sm)' };
    case 'console':
      return { background: 'var(--kit-surface)', boxShadow: 'inset 4px 0 0 var(--t-line), 0 0 0 1px var(--kit-rule)' };
    case 'poster':
      return { ...ON_POP, background: 'var(--t-pop)', color: 'var(--t-on-pop)', border: '2px solid var(--base-foreground)', boxShadow: '4px 4px 0 var(--base-foreground)' };
    case 'signal':
      return { ...ON_VIVID, background: 'var(--t-vivid)', color: 'var(--t-on-vivid)', borderRadius: 'var(--kit-radius-sm)' };
    case 'blueprint':
      return { background: 'var(--kit-surface)', border: '1.5px solid var(--kit-rule-strong)' };
    case 'editorial':
      return { borderTop: '2px solid var(--kit-rule-strong)' };
  }
}

/** Type of a figure: weight and tracking belong to the look. */
export const FIGURE_STYLE: CSSProperties = { fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)', lineHeight: 1.1 };

/** Stroke width of drawn connectors and outlines in a look, in px. */
export const LINE_WEIGHT: Record<LookId, number> = { studio: 2, glass: 2, soft: 3, console: 2, poster: 3.5, signal: 3, blueprint: 1.5, editorial: 1.5 };
