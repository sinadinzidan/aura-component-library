import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { StateGlyph } from './StateGlyph';
import type { StateDescriptor } from './status';

type StateLabelProps = {
  state: StateDescriptor;
  /** A second line: since when, why, or who acknowledged. */
  detail?: string;
  size?: 'sm' | 'md' | 'lg';
  /** A static ring around the glyph for states that need someone to act. */
  attention?: boolean;
  /** Put the word in the state colour instead of the text colour. */
  coloured?: boolean;
  className?: string;
};

const GLYPH = { sm: 10, md: 13, lg: 18 } as const;
const TEXT = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' } as const;

/**
 * The plain status indicator: a shape-coded glyph and the state word, with room for a line of
 * detail. Use it where a pill would be too heavy — inside table cells, lists and headings.
 */
export function StateLabel({ state, detail, size = 'md', attention = false, coloured = false, className }: StateLabelProps) {
  const look = useLook();
  return (
    <span data-look={look} data-tone={state.tone} data-size={size} className={cx('inline-flex min-w-0 items-center gap-2 align-middle', className)}>
      <StateGlyph shape={state.shape} tone={state.tone} size={GLYPH[size]} attention={attention} />
      <span className="flex min-w-0 flex-col">
        <span className={cx(TEXT[size], 'leading-tight font-medium')} style={{ color: coloured ? 'var(--t-ink)' : 'var(--kit-text)' }}>
          {state.label}
        </span>
        {detail ? <span className="text-xs text-(--kit-text-2)">{detail}</span> : null}
      </span>
    </span>
  );
}
