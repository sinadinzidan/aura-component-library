import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type MatrixAxisItem = { id: string; label: string };

export type MatrixCell = {
  /** The outcome as a word: "High", "Not an alarm". */
  label: string;
  tone: Tone;
  /** How many alarms sit in the cell, when the matrix doubles as a distribution. */
  count?: number;
};

type PriorityMatrixProps = {
  /** Accessible name, for example "Priority by consequence and time to respond". */
  label: string;
  /** Rows, least severe first; drawn bottom to top so the worst is at the top. */
  rows: readonly MatrixAxisItem[];
  columns: readonly MatrixAxisItem[];
  rowHeader: string;
  columnHeader: string;
  cell: (rowId: string, columnId: string) => MatrixCell;
  selected?: { row: string; column: string };
  onSelect?: (rowId: string, columnId: string) => void;
  /** `sm` for a matrix that only illustrates a result beside it. */
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Consequence against time to respond, with the priority each combination justifies written in
 * the cell. Cells are filled blocks in console, poster and signal, soft washes in the card looks
 * and outlined boxes on a blueprint; the selected cell is ringed, never only recoloured.
 */
export function PriorityMatrix({ label, rows, columns, rowHeader, columnHeader, cell, selected, onSelect, size = 'md', className }: PriorityMatrixProps) {
  const look = useLook();
  const solid = look === 'console' || look === 'signal';
  const outlined = look === 'blueprint' || look === 'editorial';
  const drawn = [...rows].reverse();

  return (
    <div role="group" aria-label={label} data-look={look} className={cx('flex flex-col gap-2 text-sm text-[var(--kit-text)]', className)}>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `minmax(5.5rem, auto) repeat(${columns.length}, minmax(0, 1fr))` }}>
        <span className="self-end pb-1 text-xs font-medium text-[var(--kit-text-2)]">{rowHeader}</span>
        {columns.map((column) => (
          <span key={column.id} className="self-end pb-1 text-center text-xs leading-4 font-medium text-[var(--kit-text-2)]">
            {column.label}
          </span>
        ))}
        {drawn.map((row) => (
          <div key={row.id} className="col-span-full grid grid-cols-subgrid">
            <span className="flex items-center font-medium">{row.label}</span>
            {columns.map((column) => {
              const item = cell(row.id, column.id);
              const active = selected?.row === row.id && selected.column === column.id;
              return (
                <button
                  key={column.id}
                  type="button"
                  data-tone={item.tone}
                  aria-pressed={onSelect ? active : undefined}
                  aria-label={`${row.label}, ${column.label}: ${item.label}${item.count === undefined ? '' : `, ${item.count} alarms`}`}
                  onClick={() => onSelect?.(row.id, column.id)}
                  className={cx(
                    'flex flex-col items-center justify-center gap-0.5 px-1 text-center leading-4 outline-none transition-shadow focus-visible:[box-shadow:0_0_0_2px_var(--kit-accent)]',
                    size === 'sm' ? 'min-h-11' : 'min-h-16',
                    onSelect ? 'cursor-pointer' : 'cursor-default',
                    look === 'poster'
                      ? 'border-2 border-[var(--kit-text)] bg-[var(--t-pop)] text-[var(--t-on-pop)]'
                      : solid
                        ? 'bg-[var(--t-solid)] text-[var(--t-on-solid)]'
                        : outlined
                          ? 'border border-[var(--t-line)] text-[var(--t-ink)]'
                          : 'rounded-[var(--kit-radius-sm)] bg-[var(--t-soft)] text-[var(--t-on-soft)]',
                    active ? '[box-shadow:0_0_0_2px_var(--kit-surface),0_0_0_4px_var(--kit-text)]' : ''
                  )}
                >
                  <span className={cx('font-semibold', size === 'sm' ? 'text-xs' : 'text-sm')}>{item.label}</span>
                  {item.count === undefined ? null : <span className="text-xs tabular-nums">{size === 'sm' ? item.count : `${item.count} alarms`}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <span className="text-center text-xs font-medium text-[var(--kit-text-2)]">{columnHeader}</span>
    </div>
  );
}
