import type { CSSProperties } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type AndonStation = {
  id: string;
  /** Short position code: "ST 3". */
  code: string;
  name: string;
  /** The state as a word: "Running", "Blocked", "Call for help". */
  state: string;
  tone: Tone;
  /** One line under the state: the count, the reason, how long. */
  detail?: string;
};

type AndonBoardProps = {
  /** Accessible name: "Line 2 andon". */
  label: string;
  stations: readonly AndonStation[];
  columns?: number;
  selected?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

/**
 * An andon board: every station of a line as one block in a fixed position, filled with its
 * state. A stopped or calling station is solid; running ones stay quiet so the eye lands on the
 * exception from the far end of the hall.
 */
export function AndonBoard({ label, stations, columns = 6, selected, onSelect, className }: AndonBoardProps) {
  const look = useLook();
  const style: CSSProperties = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  const joined = look === 'console' || look === 'poster' || look === 'blueprint';
  const allSolid = look === 'signal' || look === 'poster';

  return (
    <ul aria-label={label} data-look={look} style={style} className={cx('grid', joined ? 'gap-px bg-(--kit-rule-strong) p-px' : 'gap-3', className)}>
      {stations.map((station) => {
        const calm = station.tone === 'success' || station.tone === 'neutral';
        const solid = allSolid || !calm;
        const active = station.id === selected;
        return (
          <li key={station.id} className="flex min-w-0">
            <button
              type="button"
              data-tone={station.tone}
              data-solid={solid}
              aria-pressed={onSelect ? active : undefined}
              onClick={() => onSelect?.(station.id)}
              className={cx(
                'flex min-h-32 w-full min-w-0 cursor-pointer flex-col justify-between gap-3 p-4 text-left outline-none focus-visible:[box-shadow:inset_0_0_0_3px_var(--kit-accent)]',
                joined ? '' : 'rounded-(--kit-radius-sm)',
                solid ? 'bg-(--t-solid) text-(--t-on-solid)' : 'bg-(--kit-surface) text-(--kit-text) [box-shadow:inset_0_5px_0_var(--t-line)]',
                !solid && !joined ? '[border:1px_solid_var(--kit-rule)]' : '',
                active ? '[box-shadow:inset_0_0_0_4px_var(--kit-text)]' : ''
              )}
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium tabular-nums">{station.code}</span>
                <span className="text-base leading-5 font-semibold">{station.name}</span>
              </span>
              <span className="flex flex-col">
                <span className={cx('text-xl leading-6 font-semibold', solid ? '' : 'text-(--t-ink)')}>{station.state}</span>
                {station.detail ? <span className="text-sm">{station.detail}</span> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
