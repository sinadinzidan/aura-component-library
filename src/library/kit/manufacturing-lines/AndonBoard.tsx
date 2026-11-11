import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type AndonTile = {
  id: string;
  /** Large code read from across the hall: "S5", "Line 3". */
  code: string;
  /** What it is: "Torque and seal". */
  name: string;
  /** The state as a word: "Down", "Running". */
  state: string;
  tone: Tone;
  /** A line of detail: the reason and how long. */
  detail?: string;
};

type AndonBoardProps = {
  /** Accessible name: "Andon board, line 3". */
  label: string;
  tiles: readonly AndonTile[];
  columns?: number;
  className?: string;
};

const SOLID_LOOKS = ['console', 'poster', 'signal', 'glass'];

/**
 * An andon board: one tile per station or line, each carrying its state as a large word with the
 * code beside it. Tiles are tinted with their state by default and filled solid in the looks built
 * for wall screens, where the board is read from across the hall.
 */
export function AndonBoard({ label, tiles, columns = 4, className }: AndonBoardProps) {
  const look = useLook();
  const solid = SOLID_LOOKS.includes(look);
  const square = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'signal';

  return (
    <ul aria-label={label} data-look={look} className={cx('grid min-w-0 gap-2', className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {tiles.map((tile) => (
        <li
          key={tile.id}
          data-tone={tile.tone}
          className={cx(
            'flex min-w-0 flex-col p-4',
            square ? '' : 'rounded-(--kit-radius-sm)',
            solid ? 'bg-(--t-solid) text-(--t-on-solid)' : look === 'blueprint' ? 'border border-(--kit-text) border-l-8 border-l-(--t-solid) text-(--kit-text)' : 'bg-(--t-soft) text-(--t-on-soft)',
          )}
        >
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-sm leading-5 font-semibold tabular-nums">{tile.code}</span>
            <span className="truncate text-sm leading-5">{tile.name}</span>
          </span>
          <span className="mt-2 text-2xl leading-8 font-bold tracking-tight">{tile.state}</span>
          {tile.detail ? <span className="mt-1 text-sm leading-5">{tile.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}
