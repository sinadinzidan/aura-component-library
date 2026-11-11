import type { CSSProperties } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type AnnunciatorWindow = {
  id: string;
  /** Instrument or equipment tag. */
  tag: string;
  /** Two or three words: "Vibration high". */
  label: string;
  tone: Tone;
  /** `new` is unacknowledged and fills the window, `held` is acknowledged and still standing, `normal` is quiet. */
  state: 'new' | 'held' | 'normal';
  /** The state as a word: "Unacknowledged", "Standing", "Normal". */
  stateLabel: string;
  /** The alarm that came first in a trip sequence. */
  firstOut?: boolean;
};

type AnnunciatorGridProps = {
  /** Accessible name, for example "Compression train annunciator". */
  label: string;
  windows: readonly AnnunciatorWindow[];
  columns?: number;
  selected?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

/**
 * The lightbox of a control room as a grid of windows, one per alarm point in a fixed position.
 * A new alarm fills its window, an acknowledged one keeps a coloured edge, a normal point stays
 * quiet — so the pattern of the panel is readable before any text is.
 */
export function AnnunciatorGrid({ label, windows, columns = 4, selected, onSelect, className }: AnnunciatorGridProps) {
  const look = useLook();
  const style: CSSProperties = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  const joined = look === 'console' || look === 'blueprint' || look === 'poster';

  return (
    <ul aria-label={label} data-look={look} style={style} className={cx('grid', joined ? 'gap-px bg-[var(--kit-rule-strong)] p-px' : 'gap-2', className)}>
      {windows.map((window) => {
        const active = window.id === selected;
        return (
          <li key={window.id} className="flex min-w-0">
            <button
              type="button"
              data-tone={window.tone}
              data-state={window.state}
              aria-pressed={onSelect ? active : undefined}
              onClick={() => onSelect?.(window.id)}
              className={cx(
                'flex min-h-21 w-full min-w-0 flex-col justify-between gap-2 p-3 text-left outline-none transition-colors focus-visible:[box-shadow:inset_0_0_0_2px_var(--kit-accent)]',
                joined ? '' : 'rounded-[var(--kit-radius-sm)]',
                window.state === 'new' ? (look === 'poster' ? 'bg-[var(--t-pop)] text-[var(--t-on-pop)]' : 'bg-[var(--t-solid)] text-[var(--t-on-solid)]') : '',
                window.state === 'held' ? cx(joined ? 'bg-[var(--kit-surface)]' : 'bg-[var(--t-soft)]', 'text-[var(--kit-text)] [box-shadow:inset_0_4px_0_var(--t-line)]') : '',
                window.state === 'normal' ? (joined ? 'bg-[var(--kit-surface)] text-[var(--kit-text-2)]' : 'bg-[var(--kit-track)] text-[var(--kit-text-2)]') : '',
                active ? '[box-shadow:inset_0_0_0_3px_var(--kit-text)]' : ''
              )}
            >
              <span className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
                <span className="font-medium whitespace-nowrap tabular-nums">{window.tag}</span>
                {window.firstOut ? <span className="font-semibold whitespace-nowrap underline underline-offset-2">First out</span> : null}
              </span>
              <span className="flex flex-col">
                <span className="text-sm leading-5 font-semibold">{window.label}</span>
                <span className={cx('text-xs leading-4', window.state === 'held' ? 'font-medium text-[var(--t-ink)]' : '')}>{window.stateLabel}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
