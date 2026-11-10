import { Input } from '@cognite/aura/components/input';
import { useId } from 'react';
import type { KeyboardEvent, Ref } from 'react';

import { cn } from '../../../lib/utils';

import type { DrillNode } from './hierarchy';
import { NodeRow } from './NodeRow';

export type ColumnListProps = {
  /** Column heading: "Equipment". */
  title: string;
  /** Rows after the filter. */
  items: readonly DrillNode[];
  /** Rows before the filter, for the count in the heading. */
  total: number;
  selectedId: string | null;
  /** Whether this is the column the keyboard is in. Only the active column is in the tab order. */
  active?: boolean;
  filter: string;
  onFilterChange: (text: string) => void;
  onSelect: (id: string) => void;
  /** Keys pressed on the list: arrows, Enter, type-ahead. */
  onListKeyDown?: (event: KeyboardEvent<HTMLUListElement>) => void;
  onListFocus?: () => void;
  /** Shown when the column has nothing to list at all. */
  emptyText?: string;
  listRef?: Ref<HTMLUListElement>;
  className?: string;
};

/**
 * One column of a column browser: a heading with a count, a filter, and a list of nodes where one
 * is selected. Each row shows state and one key figure. The list is a single tab stop; the
 * selected row is announced as the active option.
 */
export function ColumnList({
  title,
  items,
  total,
  selectedId,
  active = false,
  filter,
  onFilterChange,
  onSelect,
  onListKeyDown,
  onListFocus,
  emptyText = 'Nothing to list',
  listRef,
  className,
}: ColumnListProps) {
  const baseId = useId().replace(/:/g, '');
  const filtered = filter.trim() !== '';

  return (
    <section data-slot="column-list" data-active={active ? 'true' : undefined} aria-label={title} className={cn('flex min-h-0 min-w-0 flex-col', className)}>
      <header className="flex flex-col gap-2 border-b border-default p-2">
        <div className="flex items-baseline justify-between gap-2 px-1">
          <h4 className={cn('text-xs font-medium', active ? 'text-base-foreground' : 'text-muted-foreground')}>{title}</h4>
          <span className="text-xs text-muted-foreground tabular-nums">{filtered ? `${items.length} of ${total}` : total}</span>
        </div>
        <Input
          type="search"
          value={filter}
          disabled={total === 0}
          placeholder="Filter"
          aria-label={total === 0 ? `Filter ${title.toLowerCase()}: nothing to filter yet` : `Filter ${title.toLowerCase()}`}
          onChange={(event) => onFilterChange(event.target.value)}
        />
      </header>

      {items.length === 0 ? (
        <p data-slot="column-list-empty" className="p-3 text-xs text-muted-foreground">
          {total === 0 ? emptyText : `Nothing matches “${filter.trim()}”`}
        </p>
      ) : null}

      <ul
        ref={listRef}
        role="listbox"
        tabIndex={active ? 0 : -1}
        aria-label={title}
        aria-activedescendant={selectedId && items.some((item) => item.id === selectedId) ? `${baseId}-${selectedId}` : undefined}
        onKeyDown={onListKeyDown}
        onFocus={onListFocus}
        className={cn('group/list flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-1 outline-none', items.length === 0 ? 'hidden' : '')}
      >
        {items.map((node) => {
          const selected = node.id === selectedId;
          return (
            <li
              key={node.id}
              id={`${baseId}-${node.id}`}
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(node.id)}
              className={cn(
                'cursor-pointer rounded-md px-2 py-1.5',
                selected
                  ? 'bg-muted-background shadow-[inset_2px_0_0_var(--primary-background)] group-focus-visible/list:ring-2 group-focus-visible/list:ring-inset group-focus-visible/list:ring-ring-default'
                  : 'hover:bg-base-background-hover'
              )}
            >
              <NodeRow node={node} showChevron={node.children.length > 0} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
