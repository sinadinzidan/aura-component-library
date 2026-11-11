import { Button } from '@cognite/aura/components/button';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconChevronDown, IconChevronRight } from '@cognite/aura/icons';
import { useEffect, useMemo, useReducer, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { branchIds, buildTree, createTreeState, treeKey, treeReducer, visibleTreeRows } from './treeTable';
import type { TreeKey, TreeNodeInput, TreeRollup, TreeRow } from './treeTable';

export type TreeColumn = {
  id: string;
  title: string;
  /** Draws one value. `row.childIds.length > 0` says it is a roll-up. */
  render: (value: number | null, row: TreeRow) => ReactNode;
  /** Width in `ch`. */
  width?: number;
};

export type TreeTableProps = {
  /** Accessible name: "Alarms and downtime by asset". */
  label: string;
  nodes: readonly TreeNodeInput[];
  /** How each value is combined up the tree. A value without a roll-up is shown only on leaves. */
  rollups: Readonly<Record<string, TreeRollup>>;
  columns: readonly TreeColumn[];
  /** Heading of the first column. */
  rowHeader: string;
  /** Levels open at the start: 0 shows only the roots. */
  initialDepth?: number;
  density?: 'default' | 'compact';
  loading?: boolean;
  empty?: string;
  /** Layout classes for the frame, usually a height. */
  className?: string;
};

const ARROWS: readonly string[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

function isTreeKey(key: string): key is TreeKey {
  return ARROWS.includes(key);
}

/**
 * A tree table following the treegrid pattern: rows indent by depth, branches expand and collapse,
 * and every branch shows a roll-up of the leaves below it. One row holds the roving focus; Right
 * and Left open and close branches, Up and Down move, Home and End jump. The first column stays
 * in view while the columns scroll.
 */
export function TreeTable({ label, nodes, rollups, columns, rowHeader, initialDepth = 1, density = 'default', loading = false, empty = 'Nothing to show', className }: TreeTableProps) {
  const model = useMemo(() => buildTree(nodes, rollups), [nodes, rollups]);
  const [state, dispatch] = useReducer((current: ReturnType<typeof createTreeState>, action: Parameters<typeof treeReducer>[2] | { type: 'key'; key: TreeKey }) => (action.type === 'key' ? treeKey(model, current, action.key) : treeReducer(model, current, action)), undefined, () => createTreeState(model, initialDepth));
  const tableRef = useRef<HTMLTableElement>(null);
  const hasFocus = useRef(false);
  const rows = visibleTreeRows(model, new Set(state.expanded));
  const branches = branchIds(model);
  const pad = density === 'compact' ? 'py-1' : 'py-2';

  useEffect(() => {
    if (!hasFocus.current || state.focusId === null) return;
    tableRef.current?.querySelector<HTMLElement>(`[data-tree-row="${CSS.escape(state.focusId)}"]`)?.focus({ preventScroll: false });
  }, [state.focusId]);

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (!isTreeKey(event.key)) return;
    event.preventDefault();
    hasFocus.current = true;
    dispatch({ type: 'key', key: event.key });
  };

  return (
    <div data-slot="tree-table" className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={loading || branches.length === 0 || state.expanded.length === branches.length} onClick={() => dispatch({ type: 'expandAll' })}>
            Expand all
          </Button>
          <Button variant="ghost" size="sm" disabled={loading || state.expanded.length === 0} onClick={() => dispatch({ type: 'collapseAll' })}>
            Collapse all
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Branch rows total the rows below them.</p>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border border-default bg-base-background">
        <table
          ref={tableRef}
          role="treegrid"
          aria-label={label}
          aria-busy={loading || undefined}
          className="w-full border-separate border-spacing-0 text-sm"
          onKeyDown={onKeyDown}
          onFocus={() => {
            hasFocus.current = true;
          }}
          onBlur={(event) => {
            if (!(event.relatedTarget instanceof Node) || !tableRef.current?.contains(event.relatedTarget)) hasFocus.current = false;
          }}
        >
          <thead>
            <tr role="row">
              <th scope="col" role="columnheader" className="sticky left-0 top-0 z-20 min-w-60 border-b border-default bg-muted-background px-3 py-2 text-left text-xs font-medium text-medium-foreground">
                {rowHeader}
              </th>
              {columns.map((column) => (
                <th key={column.id} scope="col" role="columnheader" style={{ minWidth: `${column.width ?? 12}ch` }} className="sticky top-0 z-10 whitespace-nowrap border-b border-default bg-muted-background px-3 py-2 text-right text-xs font-medium text-medium-foreground">
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }, (_, index) => (
                  <tr key={index} role="row">
                    <td role="rowheader" className={cn('sticky left-0 border-b border-default bg-base-background px-3', pad)}>
                      <Skeleton className="h-4 w-40" />
                    </td>
                    {columns.map((column) => (
                      <td key={column.id} role="gridcell" className={cn('border-b border-default px-3', pad)}>
                        <Skeleton className="ml-auto h-4 w-10" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {!loading && rows.length === 0 ? (
              <tr role="row">
                <td role="gridcell" colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {empty}
                </td>
              </tr>
            ) : null}
            {!loading
              ? rows.map((row, index) => {
                  const branch = row.childIds.length > 0;
                  const open = state.expanded.includes(row.id);
                  const siblings = row.parentId === null ? model.rootIds : (model.rows.get(row.parentId)?.childIds ?? []);
                  return (
                    <tr
                      key={row.id}
                      role="row"
                      data-tree-row={row.id}
                      tabIndex={state.focusId === row.id || (state.focusId === null && index === 0) ? 0 : -1}
                      aria-level={row.depth + 1}
                      aria-posinset={siblings.indexOf(row.id) + 1}
                      aria-setsize={siblings.length}
                      aria-expanded={branch ? open : undefined}
                      onClick={() => dispatch({ type: 'focus', id: row.id })}
                      className="group/row outline-none"
                    >
                      <th
                        scope="row"
                        role="rowheader"
                        className={cn('sticky left-0 z-10 border-b border-default px-3 text-left font-normal group-focus-visible/row:shadow-focus-ring', branch ? 'bg-muted-background' : 'bg-base-background', pad)}
                        style={{ paddingLeft: `calc(var(--spacing) * ${3 + row.depth * 5})` }}
                      >
                        <span className="flex items-center gap-1.5">
                          {branch ? (
                            <button
                              type="button"
                              tabIndex={-1}
                              aria-label={`${open ? 'Collapse' : 'Expand'} ${row.label}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                dispatch({ type: 'toggle', id: row.id });
                                dispatch({ type: 'focus', id: row.id });
                              }}
                              className="-ml-1 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:text-base-foreground"
                            >
                              {open ? <IconChevronDown aria-hidden="true" className="size-4" /> : <IconChevronRight aria-hidden="true" className="size-4" />}
                            </button>
                          ) : (
                            <span aria-hidden="true" className="size-4 shrink-0" />
                          )}
                          <span className={cn('min-w-0 truncate', branch ? 'font-medium text-base-foreground' : 'text-base-foreground')}>{row.label}</span>
                          {row.code ? <span className="shrink-0 font-mono text-xs text-muted-foreground">{row.code}</span> : null}
                        </span>
                      </th>
                      {columns.map((column) => (
                        <td key={column.id} role="gridcell" className={cn('border-b border-default px-3 text-right tabular-nums', branch ? 'bg-muted-background font-medium' : '', pad)}>
                          {column.render(row.values[column.id] ?? null, row)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
