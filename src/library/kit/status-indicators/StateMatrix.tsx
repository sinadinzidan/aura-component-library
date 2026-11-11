import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { StateGlyph } from './StateGlyph';
import type { StateDescriptor } from './status';

export type MatrixCell = {
  id: string;
  /** Short name shown in the cell: a tag or a number. */
  label: string;
  /** Full name for the accessible name and the tooltip. */
  name: string;
  state: StateDescriptor;
};

type StateMatrixProps = {
  /** What the grid shows, for example "Equipment state, gas compression". */
  label: string;
  cells: readonly MatrixCell[];
  columns?: number;
  selected?: string;
  /** Makes every cell a button. */
  onSelect?: (id: string) => void;
  /** `compact` drops the labels for a dense overview of many items. */
  density?: 'default' | 'compact';
  className?: string;
};

/**
 * Many things, one state each: a grid of cells that carry the state as fill and shape. Worst
 * states stand out by colour, and a selected cell can open its detail next to the grid.
 */
export function StateMatrix({ label, cells, columns = 8, selected, onSelect, density = 'default', className }: StateMatrixProps) {
  const look = useLook();
  const solid = look === 'console' || look === 'poster' || look === 'signal';
  const outline = look === 'blueprint' || look === 'editorial';
  const compact = density === 'compact';
  return (
    <ul aria-label={label} data-look={look} data-density={density} className={cx('m-0 grid list-none p-0', compact ? 'gap-1' : 'gap-1.5', className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {cells.map((cell) => {
        const quiet = cell.state.rank === 0;
        const style = {
          background: outline ? 'transparent' : solid ? (quiet ? 'color-mix(in oklab, var(--t-line) 30%, var(--kit-panel-bg))' : 'var(--t-solid)') : quiet ? 'color-mix(in oklab, var(--t-line) 12%, transparent)' : 'var(--t-soft)',
          color: solid && !quiet ? 'var(--t-on-solid)' : 'var(--kit-text)',
          boxShadow: cell.id === selected ? '0 0 0 2px var(--kit-surface), 0 0 0 4px var(--kit-text)' : outline ? 'inset 0 0 0 1.5px var(--t-line)' : undefined,
          borderRadius: 'min(var(--kit-radius-sm), 8px)',
          minHeight: compact ? 28 : 52,
        };
        const body = (
          <>
            <StateGlyph shape={cell.state.shape} tone={cell.state.tone} size={compact ? 11 : 12} ink={solid && !quiet} />
            {compact ? null : <span className="text-xs leading-tight font-medium tabular-nums">{cell.label}</span>}
          </>
        );
        const shell = cx('flex w-full flex-col items-center justify-center gap-1 px-1', compact ? 'py-1' : 'py-2');
        return (
          <li key={cell.id} data-tone={cell.state.tone} className="min-w-0">
            {onSelect ? (
              <button type="button" aria-pressed={cell.id === selected} aria-label={`${cell.name}: ${cell.state.label}`} title={`${cell.name}: ${cell.state.label}`} onClick={() => onSelect(cell.id)} className={cx(shell, 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-(--kit-rule-strong)')} style={style}>
                {body}
              </button>
            ) : (
              <div role="img" aria-label={`${cell.name}: ${cell.state.label}`} title={`${cell.name}: ${cell.state.label}`} className={shell} style={style}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
