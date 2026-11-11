import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { StateGlyph } from './StateGlyph';
import type { StateDescriptor } from './status';

type TileAnatomy = 'soft' | 'solid' | 'edge' | 'outline';

const LOOK_ANATOMY: Record<LookId, TileAnatomy> = {
  studio: 'soft',
  console: 'edge',
  poster: 'solid',
  glass: 'soft',
  editorial: 'outline',
  soft: 'soft',
  blueprint: 'outline',
  signal: 'solid',
};

type StateTileProps = {
  /** What is in this state: the asset, the area, the signal. */
  title: string;
  /** A tag or a second line under the title. */
  subtitle?: string;
  state: StateDescriptor;
  /** Under the state word: since when, the reading, the reason. */
  detail?: ReactNode;
  /** An icon instead of the shape glyph. */
  icon?: ReactNode;
  /** Leave out to let the look choose: a tinted card in studio, an edge strip in console, a filled block in signal. */
  anatomy?: TileAnatomy;
  size?: 'md' | 'lg';
  className?: string;
};

/**
 * One thing and its state as a block: the state word is the headline and the whole tile carries
 * the colour the way the look does it — tinted, filled, edged or outlined.
 */
export function StateTile({ title, subtitle, state, detail, icon, anatomy, size = 'md', className }: StateTileProps) {
  const look = useLook();
  const kind = anatomy ?? LOOK_ANATOMY[look];
  const solid = kind === 'solid';
  const surface =
    kind === 'solid'
      ? { background: 'var(--t-solid)', color: 'var(--t-on-solid)', border: 'var(--kit-panel-border)' }
      : kind === 'soft'
        ? { background: 'color-mix(in oklab, var(--t-line) 10%, var(--kit-panel-bg))', color: 'var(--kit-text)', border: '1px solid color-mix(in oklab, var(--t-line) 32%, transparent)' }
        : kind === 'edge'
          ? { background: 'var(--kit-panel-bg)', color: 'var(--kit-text)', borderLeft: '4px solid var(--t-line)' }
          : { background: 'transparent', color: 'var(--kit-text)', border: '1.5px solid var(--t-line)' };
  return (
    <div
      role="group"
      aria-label={`${title}: ${state.label}`}
      data-look={look}
      data-tone={state.tone}
      data-anatomy={kind}
      data-size={size}
      className={cx('flex h-full min-w-0 flex-col justify-between gap-3', size === 'lg' ? 'p-5' : 'p-4', className)}
      style={{ ...surface, borderRadius: 'var(--kit-radius-sm)' }}
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">{title}</span>
        {subtitle ? <span className={cx('text-xs tabular-nums', solid ? 'opacity-80' : 'text-(--kit-text-2)')}>{subtitle}</span> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2 [&>svg]:size-[1.1em] [&>svg]:shrink-0" style={{ fontSize: size === 'lg' ? '1.875rem' : '1.25rem', lineHeight: 1.1, fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)', color: solid ? undefined : 'var(--t-ink)' }}>
          {icon ?? <StateGlyph shape={state.shape} tone={state.tone} ink={solid} size={size === 'lg' ? 24 : 16} />}
          {state.label}
        </span>
        {detail ? <span className={cx('text-xs tabular-nums', solid ? 'opacity-85' : 'text-(--kit-text-2)')}>{detail}</span> : null}
      </div>
    </div>
  );
}
