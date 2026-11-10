import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

import { cn } from '../../../lib/utils';

import { ColumnList } from './ColumnList';
import { DRILL_LEVELS, LEVEL_LABEL } from './hierarchy';
import type { DrillLevel, DrillNode } from './hierarchy';
import { millerColumns, millerKeyAction } from './millerReducer';
import type { MillerAction, MillerState } from './millerReducer';

export type MillerColumnsProps = {
  /** The nodes of the first column. */
  roots: readonly DrillNode[];
  state: MillerState;
  dispatch: (action: MillerAction) => void;
  /** Column headings per level. Defaults to the level names. */
  titles?: Partial<Record<DrillLevel, string>>;
  /** Accessible name of the browser. */
  label?: string;
  className?: string;
};

/** What an empty column asks for: a pick in the column before it. */
const PICK_HINT: Record<DrillLevel, string> = {
  site: 'Pick a site on the left',
  area: 'Pick an area on the left',
  equipment: 'Pick equipment on the left',
  sensor: 'Pick a sensor on the left',
};

/**
 * A column browser (Miller columns) over the hierarchy: four lists side by side, where picking a
 * row in one fills the next. Up and down move within a column, right and left between columns,
 * typing filters the column you are in, and Escape or Backspace undo the filter and then step
 * back a column. Focus follows the active column.
 */
export function MillerColumns({ roots, state, dispatch, titles = {}, label = 'Column browser', className }: MillerColumnsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRefs = useRef<(HTMLUListElement | null)[]>([]);
  const columns = millerColumns(roots, state);

  // Keep keyboard focus on the active column, but only while focus is already on one of the lists.
  useEffect(() => {
    const focused = document.activeElement;
    const target = listRefs.current[state.column];
    if (!target || focused === target) return;
    if (focused instanceof HTMLElement && focused.getAttribute('role') === 'listbox' && containerRef.current?.contains(focused)) target.focus();
  }, [state.column]);

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const action = millerKeyAction(event.key, state);
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    dispatch(action);
  };

  return (
    <div ref={containerRef} data-slot="miller-columns" role="group" aria-label={label} className={cn('flex min-h-0 min-w-0', className)}>
      {columns.map((column) => {
        const title = titles[column.level] ?? LEVEL_LABEL[column.level];
        const previous = DRILL_LEVELS[column.index - 1];
        return (
          <ColumnList
            key={column.level}
            title={title}
            items={column.items}
            total={column.total}
            selectedId={column.selectedId}
            active={state.column === column.index}
            filter={column.filter}
            onFilterChange={(text) => dispatch({ type: 'filter', column: column.index, text })}
            onSelect={(id) => dispatch({ type: 'select', column: column.index, id })}
            onListKeyDown={onListKeyDown}
            onListFocus={() => {
              // Tabbing or clicking into a column makes it the active one, on its current selection.
              if (state.column !== column.index && column.selectedId) dispatch({ type: 'select', column: column.index, id: column.selectedId });
            }}
            emptyText={column.parent ? `Nothing is modelled under ${column.parent.name}` : previous ? PICK_HINT[previous] : 'Nothing to list'}
            listRef={(element) => {
              listRefs.current[column.index] = element;
            }}
            className="min-w-0 flex-1 border-r border-default last:border-r-0"
          />
        );
      })}
    </div>
  );
}
