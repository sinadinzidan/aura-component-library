import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { IconChevronDown, IconChevronRight } from '@cognite/aura/icons';
import { useId, useState } from 'react';

import type { Database } from './sqlTypes';

type SchemaBrowserProps = {
  database: Database;
  /** Called with the table or column name when it is chosen. */
  onInsert: (name: string) => void;
  /** Tables open at the start. */
  defaultOpen?: readonly string[];
};

const TYPE_LABEL = { text: 'text', number: 'number', boolean: 'bool', timestamp: 'time' } as const;

/**
 * Tables and their columns as a filterable list. Choosing a name inserts it into the query;
 * the arrow next to a table opens its columns. Each row is a button, so it works from the keyboard.
 */
export function SchemaBrowser({ database, onInsert, defaultOpen = [] }: SchemaBrowserProps) {
  const id = useId();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set(defaultOpen));
  const [filter, setFilter] = useState('');
  const needle = filter.trim().toLowerCase();

  const toggle = (name: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const visible = database
    .map((table) => ({
      table,
      columns: needle === '' || table.name.toLowerCase().includes(needle) ? table.columns : table.columns.filter((column) => column.name.toLowerCase().includes(needle)),
    }))
    .filter(({ table, columns }) => needle === '' || table.name.toLowerCase().includes(needle) || columns.length > 0);

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-2" data-slot="schema-browser">
      <div className="flex flex-col">
        <Label htmlFor={`${id}-filter`} className="sr-only">
          Filter tables and columns
        </Label>
        <Input id={`${id}-filter`} value={filter} placeholder="Filter tables and columns" onChange={(event) => setFilter(event.target.value)} />
      </div>
      {visible.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">Nothing matches “{filter}”.</p>
      ) : (
        <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto">
          {visible.map(({ table, columns }) => {
            const expanded = open.has(table.name) || needle !== '';
            return (
              <li key={table.name} className="flex flex-col">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={`${expanded ? 'Hide' : 'Show'} columns of ${table.name}`}
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-medium-background focus-visible:shadow-focus-ring"
                    onClick={() => toggle(table.name)}
                  >
                    {expanded ? <IconChevronDown className="size-4" aria-hidden="true" /> : <IconChevronRight className="size-4" aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-baseline justify-between gap-2 rounded-md px-1.5 py-1 text-left outline-none hover:bg-medium-background focus-visible:shadow-focus-ring"
                    aria-label={`Insert table ${table.name}`}
                    onClick={() => onInsert(table.name)}
                  >
                    <span className="truncate font-mono text-sm font-medium text-base-foreground">{table.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{table.rows.length} rows</span>
                  </button>
                </div>
                {expanded ? (
                  <ul className="ml-6 flex flex-col">
                    {columns.map((column) => (
                      <li key={column.name}>
                        <button
                          type="button"
                          aria-label={`Insert column ${column.name}`}
                          className="flex w-full items-baseline justify-between gap-2 rounded-md px-1.5 py-1 text-left outline-none hover:bg-medium-background focus-visible:shadow-focus-ring"
                          onClick={() => onInsert(column.name)}
                        >
                          <span className="truncate font-mono text-xs text-base-foreground">{column.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{TYPE_LABEL[column.type]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
