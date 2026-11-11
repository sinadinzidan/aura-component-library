import { CheckboxItemControl } from '@cognite/aura/components/checkbox';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconAlertTriangle, IconArrowBackUp, IconArrowBarToDown, IconArrowForwardUp, IconClipboard, IconCopy, IconLock } from '@cognite/aura/icons';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent, PointerEvent, ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { IconAction } from '../../patterns/collections/IconAction';

import { cellLabel, columnLabel, rangeContains, rangeLabel, rangeSize } from './cellRef';
import type { CellPos } from './cellRef';
import { parseClipboard, serializeRange } from './clipboard';
import { formatCell, validateCell } from './columns';
import type { SheetColumn } from './columns';
import { evaluateSheet, FORMULA_ERROR_REASON, isFormula, literalResult } from './formula';
import type { CellResult } from './formula';
import { selectionStats } from './selectionStats';
import { SheetFormulaBar } from './SheetFormulaBar';
import { createSheetState, isEditable, selectionOf, sheetReducer } from './sheetReducer';
import type { SheetState } from './sheetReducer';
import { SheetStatusBar } from './SheetStatusBar';

/** Clipboard access, injectable so a test or a sandboxed host can replace it. */
export type SheetClipboard = {
  readText: () => Promise<string>;
  writeText: (text: string) => Promise<void>;
};

const browserClipboard: SheetClipboard = {
  readText: () => navigator.clipboard.readText(),
  writeText: (text) => navigator.clipboard.writeText(text),
};

export type SheetGridProps = {
  /** What the sheet holds, for the accessible name: "Alarm limits". */
  label: string;
  columns: readonly SheetColumn[];
  /** Starting cell text, one array per row in column order. The grid owns the data after that. */
  rows: readonly (readonly string[])[];
  /** Nothing can be edited; selection, copy and the status bar still work. */
  readOnly?: boolean;
  density?: 'default' | 'compact';
  /** Undo, redo, copy, paste and fill buttons with the formula bar. */
  toolbar?: boolean;
  /** Range, invalid reason and count / sum / average of the selection. */
  statusBar?: boolean;
  /** Evaluate cells that start with `=`. Also shows column letters, which formulas refer to. */
  formulas?: boolean;
  /** Keep the first column in view while scrolling sideways. */
  freezeFirstColumn?: boolean;
  clipboard?: SheetClipboard;
  /** Starting selection. Does not take focus. */
  initialSelection?: { active: CellPos; extent?: CellPos };
  /** Opens the active cell for editing with this text on first render, without taking focus. */
  initialDraft?: string;
  /** Shows placeholder rows instead of data. */
  loading?: boolean;
  /** Shown instead of rows when there are none. */
  empty?: ReactNode;
  /** Called with the cell text after every change. */
  onCellsChange?: (cells: readonly (readonly string[])[]) => void;
  /** Layout classes for the outer frame, usually a height. */
  className?: string;
};

type Drag = 'select' | 'fill' | null;

const NUMERIC = new Set(['number']);
const SKELETON_WIDTHS = ['w-24', 'w-16', 'w-20', 'w-12', 'w-28'];

function init(props: SheetGridProps): SheetState {
  const state = createSheetState({
    columns: props.columns,
    rows: props.rows,
    readOnly: props.readOnly,
    active: props.initialSelection?.active,
    extent: props.initialSelection?.extent,
  });
  return props.initialDraft === undefined ? state : sheetReducer(state, { type: 'startEdit', initial: props.initialDraft });
}

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('input, select, button, [role="checkbox"]') !== null;
}

function posOf(element: Element | null): CellPos | null {
  const cell = element?.closest('[data-sheet-cell]');
  if (!(cell instanceof HTMLElement)) return null;
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  return Number.isInteger(row) && Number.isInteger(col) ? { row, col } : null;
}

/**
 * An editable grid with spreadsheet behaviour: one roving cell focus, arrow / Tab / Home / End
 * movement, range selection by drag or Shift+arrows, Enter or F2 or typing to edit, copy and paste
 * as tab-separated text, a fill handle and Ctrl+D, typed columns with validation, read-only columns,
 * whole row and column selection, a frozen header and first column, undo and redo, formulas, and a
 * status bar with the count, sum and average of the selection. All state is in `sheetReducer`.
 */
export function SheetGrid(props: SheetGridProps) {
  const {
    label,
    columns,
    density = 'default',
    toolbar = true,
    statusBar = true,
    formulas = true,
    freezeFirstColumn = true,
    clipboard = browserClipboard,
    loading = false,
    empty,
    onCellsChange,
    className,
  } = props;
  const [state, dispatch] = useReducer(sheetReducer, props, init);
  const [fillRow, setFillRow] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const hasFocus = useRef(false);
  const drag = useRef<Drag>(null);
  const buffer = useRef('');
  const selectOnEdit = useRef(false);
  const firstRender = useRef(true);

  const { cells, active, extent, edit } = state;
  const selection = selectionOf(state);
  const multiple = rangeSize(selection).cells > 1;
  const editing = edit !== null;
  const compact = density === 'compact';

  const results = useMemo<CellResult[][]>(() => (formulas ? evaluateSheet(cells) : cells.map((row) => row.map(literalResult))), [cells, formulas]);

  const reasons = useMemo(
    () =>
      cells.map((row, rowIndex) =>
        row.map((raw, colIndex) => {
          const result = results[rowIndex][colIndex];
          const formula = formulas && isFormula(raw);
          if (formula && result.kind === 'error') return `${result.error} ${FORMULA_ERROR_REASON[result.error]}`;
          return validateCell(columns[colIndex], raw, formula && result.kind === 'number' ? result.value : undefined);
        })
      ),
    [cells, columns, formulas, results]
  );
  const invalidCount = reasons.reduce((total, row) => total + row.filter((reason) => reason !== null).length, 0);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    onCellsChange?.(cells);
  }, [cells, onCellsChange]);

  // Roving focus: the active cell, or its editor, holds focus while the grid is in use.
  useEffect(() => {
    if (!hasFocus.current) return;
    if (editing) {
      const editor = inputRef.current ?? selectRef.current;
      editor?.focus();
      if (selectOnEdit.current) inputRef.current?.select();
      return;
    }
    const cell = tableRef.current?.querySelector<HTMLElement>(`[data-sheet-cell][data-row="${active.row}"][data-col="${active.col}"]`);
    if (!cell) return;
    cell.focus({ preventScroll: true });
    cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active.row, active.col, editing]);

  useEffect(() => {
    if (!hasFocus.current) return;
    tableRef.current?.querySelector<HTMLElement>(`[data-sheet-cell][data-row="${extent.row}"][data-col="${extent.col}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [extent.row, extent.col]);

  const selectedText = (): string => {
    const rows: string[][] = [];
    for (let row = selection.r1; row <= selection.r2; row += 1) rows.push(cells[row].slice(selection.c1, selection.c2 + 1));
    return serializeRange(rows);
  };

  const copy = () => {
    const text = selectedText();
    buffer.current = text;
    clipboard.writeText(text).catch(() => undefined);
    dispatch({ type: 'announce', message: `Copied ${rangeLabel(selection)}` });
  };

  const paste = () => {
    clipboard
      .readText()
      .catch(() => buffer.current)
      .then((text) => dispatch({ type: 'paste', rows: parseClipboard(text) }));
  };

  const onCopy = (event: ClipboardEvent<HTMLTableElement>) => {
    if (editing) return;
    event.preventDefault();
    const text = selectedText();
    buffer.current = text;
    event.clipboardData.setData('text/plain', text);
    dispatch({ type: 'announce', message: `Copied ${rangeLabel(selection)}` });
  };

  const onCut = (event: ClipboardEvent<HTMLTableElement>) => {
    if (editing) return;
    onCopy(event);
    dispatch({ type: 'clear' });
  };

  const onPaste = (event: ClipboardEvent<HTMLTableElement>) => {
    if (editing) return;
    event.preventDefault();
    dispatch({ type: 'paste', rows: parseClipboard(event.clipboardData.getData('text/plain')) });
  };

  const toggle = (pos: CellPos) => dispatch({ type: 'setCell', pos, value: cells[pos.row][pos.col] === 'true' ? 'false' : 'true' });

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (editing || loading || cells.length === 0) return;
    const command = event.ctrlKey || event.metaKey;
    const extend = event.shiftKey;
    const column = columns[active.col];
    const handled = () => {
      event.preventDefault();
      hasFocus.current = true;
    };

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
        const direction = event.key === 'ArrowUp' ? 'up' : event.key === 'ArrowDown' ? 'down' : event.key === 'ArrowLeft' ? 'left' : 'right';
        handled();
        dispatch({ type: 'move', direction, extend, toEdge: command });
        return;
      }
      case 'Tab': {
        const atEnd = extend ? active.row === 0 && active.col === 0 : active.row === cells.length - 1 && active.col === columns.length - 1;
        if (atEnd) return;
        handled();
        if (extend) dispatch({ type: 'moveTo', pos: active.col === 0 ? { row: active.row - 1, col: columns.length - 1 } : { row: active.row, col: active.col - 1 } });
        else dispatch({ type: 'moveTo', pos: active.col === columns.length - 1 ? { row: active.row + 1, col: 0 } : { row: active.row, col: active.col + 1 } });
        return;
      }
      case 'Home':
        handled();
        dispatch({ type: 'jump', to: command ? 'gridStart' : 'rowStart', extend });
        return;
      case 'End':
        handled();
        dispatch({ type: 'jump', to: command ? 'gridEnd' : 'rowEnd', extend });
        return;
      case 'Enter':
      case 'F2':
        handled();
        if (column.type === 'checkbox') toggle(active);
        else {
          selectOnEdit.current = true;
          dispatch({ type: 'startEdit' });
        }
        return;
      case 'Delete':
      case 'Backspace':
        handled();
        dispatch({ type: 'clear' });
        return;
      case ' ':
        handled();
        if (extend) dispatch({ type: 'selectRow', row: active.row });
        else if (command) dispatch({ type: 'selectColumn', col: active.col });
        else if (column.type === 'checkbox') toggle(active);
        return;
      default:
        break;
    }

    if (command) {
      const key = event.key.toLowerCase();
      if (key === 'z') {
        handled();
        dispatch({ type: extend ? 'redo' : 'undo' });
      } else if (key === 'y') {
        handled();
        dispatch({ type: 'redo' });
      } else if (key === 'd') {
        handled();
        dispatch({ type: 'fillDown' });
      } else if (key === 'a') {
        handled();
        dispatch({ type: 'selectAll' });
      }
      return;
    }

    if (event.key.length === 1 && !event.altKey && column.type !== 'checkbox') {
      handled();
      selectOnEdit.current = false;
      dispatch(column.type === 'select' ? { type: 'startEdit' } : { type: 'startEdit', initial: event.key });
    }
  };

  const onEditorKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      dispatch({ type: 'commitEdit', move: event.shiftKey ? 'up' : 'down' });
    } else if (event.key === 'Tab') {
      event.preventDefault();
      dispatch({ type: 'commitEdit', move: event.shiftKey ? 'left' : 'right' });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      dispatch({ type: 'cancelEdit' });
    }
  };

  const cellAt = (x: number, y: number): CellPos | null => {
    if (typeof document.elementFromPoint !== 'function') return null;
    const element = document.elementFromPoint(x, y);
    return element && tableRef.current?.contains(element) ? posOf(element) : null;
  };

  const onPointerDown = (event: PointerEvent<HTMLTableElement>) => {
    if (event.button !== 0 || loading) return;
    const target = event.target instanceof Element ? event.target : null;
    const fill = target?.closest('[data-sheet-fill]') ?? null;
    if (!fill && isInteractive(target)) return;
    const pos = posOf(target);
    if (!pos) return;
    hasFocus.current = true;
    if (fill) {
      event.preventDefault();
      drag.current = 'fill';
      setFillRow(selection.r2);
    } else {
      drag.current = 'select';
      dispatch({ type: 'moveTo', pos, extend: event.shiftKey });
    }
    tableRef.current?.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLTableElement>) => {
    if (drag.current === null) return;
    const pos = cellAt(event.clientX, event.clientY);
    if (!pos) return;
    if (drag.current === 'fill') {
      setFillRow(Math.max(selection.r2, pos.row));
    } else if (pos.row !== extent.row || pos.col !== extent.col) {
      dispatch({ type: 'moveTo', pos, extend: true });
    }
  };

  const endDrag = (event: PointerEvent<HTMLTableElement>, cancelled: boolean) => {
    if (drag.current === null) return;
    if (drag.current === 'fill' && !cancelled && fillRow !== null && fillRow > selection.r2) dispatch({ type: 'fillTo', row: fillRow });
    drag.current = null;
    setFillRow(null);
    tableRef.current?.releasePointerCapture?.(event.pointerId);
  };

  const cellPad = compact ? 'px-2 py-0.5 text-xs' : 'px-2 py-1.5 text-sm';
  const headPad = compact ? 'px-2 py-1 text-xs' : 'px-2 py-1.5 text-xs';
  const activeRaw = cells[active.row]?.[active.col] ?? '';
  const activeResult = results[active.row]?.[active.col];
  const activeColumn = columns[active.col];
  const hasRows = cells.length > 0 && !loading;

  return (
    <div
      ref={containerRef}
      data-slot="sheet-grid"
      className={cn('flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-default bg-base-background', className)}
      onFocus={() => {
        hasFocus.current = true;
      }}
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && !containerRef.current?.contains(event.relatedTarget)) hasFocus.current = false;
      }}
    >
      {toolbar ? (
        <div data-slot="sheet-toolbar" className="flex min-w-0 items-center gap-3 border-b border-default px-2 py-1">
          <div className="flex shrink-0 items-center gap-1">
            <IconAction label="Undo" disabled={state.past.length === 0} onClick={() => dispatch({ type: 'undo' })}>
              <IconArrowBackUp />
            </IconAction>
            <IconAction label="Redo" disabled={state.future.length === 0} onClick={() => dispatch({ type: 'redo' })}>
              <IconArrowForwardUp />
            </IconAction>
            <IconAction label="Copy selection" disabled={!hasRows} onClick={copy}>
              <IconCopy />
            </IconAction>
            <IconAction label="Paste" disabled={!hasRows || state.readOnly} onClick={paste}>
              <IconClipboard />
            </IconAction>
            <IconAction label="Fill down" disabled={!hasRows || state.readOnly} onClick={() => dispatch({ type: 'fillDown' })}>
              <IconArrowBarToDown />
            </IconAction>
          </div>
          {hasRows && activeColumn ? (
            <SheetFormulaBar
              cell={cellLabel(active)}
              content={edit ? edit.draft : activeRaw}
              result={formulas && !edit && isFormula(activeRaw) && activeResult?.kind === 'number' ? formatCell(activeColumn, activeRaw, activeResult.value) : undefined}
            />
          ) : null}
        </div>
      ) : null}

      <div data-slot="sheet-scroll" className="relative min-h-0 min-w-0 flex-1 overflow-auto">
        <table
          ref={tableRef}
          role="grid"
          aria-label={label}
          aria-rowcount={cells.length + 1}
          aria-colcount={columns.length + 1}
          aria-multiselectable="true"
          aria-readonly={state.readOnly || undefined}
          aria-busy={loading || undefined}
          className="w-full border-separate border-spacing-0 select-none"
          onKeyDown={onKeyDown}
          onCopy={onCopy}
          onCut={onCut}
          onPaste={onPaste}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => endDrag(event, false)}
          onPointerCancel={(event) => endDrag(event, true)}
        >
          <thead>
            <tr role="row" aria-rowindex={1}>
              <th scope="col" className={cn('sticky left-0 top-0 z-30 w-10 min-w-10 border-b border-r border-default bg-muted-background', headPad)}>
                {hasRows ? (
                  <button type="button" tabIndex={-1} aria-label="Select all cells" className="flex size-full min-h-4 cursor-pointer items-center justify-center outline-none focus-visible:shadow-focus-ring" onClick={() => dispatch({ type: 'selectAll' })}>
                    <span aria-hidden="true" className="size-2 rounded-sm bg-medium-background" />
                  </button>
                ) : (
                  <span className="sr-only">Row</span>
                )}
              </th>
              {columns.map((column, col) => {
                const inSelection = hasRows && col >= selection.c1 && col <= selection.c2;
                const frozen = freezeFirstColumn && col === 0;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    role="columnheader"
                    aria-colindex={col + 2}
                    aria-readonly={column.readOnly || state.readOnly || undefined}
                    style={{ minWidth: `${column.width ?? 12}ch` }}
                    className={cn(
                      'sticky top-0 border-b border-r border-default p-0 text-left font-medium text-medium-foreground',
                      inSelection ? 'bg-medium-background text-base-foreground' : 'bg-muted-background',
                      frozen ? 'left-10 z-30' : 'z-20'
                    )}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      disabled={!hasRows}
                      aria-label={`Select column ${column.title}`}
                      className={cn('flex w-full min-w-0 cursor-pointer items-center gap-1.5 whitespace-nowrap outline-none focus-visible:shadow-focus-ring disabled:cursor-default', headPad, NUMERIC.has(column.type) ? 'justify-end' : '')}
                      onClick={(event) => dispatch({ type: 'selectColumn', col, extend: event.shiftKey })}
                    >
                      {formulas ? (
                        <span aria-hidden="true" className="font-mono font-normal text-muted-foreground">
                          {columnLabel(col)}
                        </span>
                      ) : null}
                      <span>{column.title}</span>
                      {column.unit ? <span className="font-normal text-muted-foreground">{column.unit}</span> : null}
                      {column.readOnly && !state.readOnly ? <IconLock aria-label="Read-only" className="size-3 shrink-0 text-muted-foreground" /> : null}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }, (_, row) => (
                  <tr key={row} role="row">
                    <th scope="row" className={cn('sticky left-0 z-10 border-b border-r border-default bg-muted-background text-xs font-normal tabular-nums text-muted-foreground', cellPad)}>
                      {row + 1}
                    </th>
                    {columns.map((column, col) => (
                      <td key={column.id} role="gridcell" className={cn('border-b border-r border-default', cellPad)}>
                        <Skeleton className={cn('h-4', SKELETON_WIDTHS[(row + col) % SKELETON_WIDTHS.length], NUMERIC.has(column.type) ? 'ml-auto' : '')} />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {!loading && cells.length === 0 ? (
              <tr role="row">
                <td role="gridcell" colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {empty ?? 'No rows'}
                </td>
              </tr>
            ) : null}
            {hasRows
              ? cells.map((row, rowIndex) => {
                  const rowSelected = rowIndex >= selection.r1 && rowIndex <= selection.r2;
                  return (
                    <tr key={rowIndex} role="row" aria-rowindex={rowIndex + 2}>
                      <th
                        scope="row"
                        role="rowheader"
                        className={cn('sticky left-0 z-10 border-b border-r border-default p-0 font-normal', rowSelected ? 'bg-medium-background text-base-foreground' : 'bg-muted-background text-muted-foreground')}
                      >
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={`Select row ${rowIndex + 1}`}
                          className={cn('flex w-full cursor-pointer items-center justify-center text-xs tabular-nums outline-none focus-visible:shadow-focus-ring', compact ? 'px-2 py-0.5' : 'px-2 py-1.5')}
                          onClick={(event) => dispatch({ type: 'selectRow', row: rowIndex, extend: event.shiftKey })}
                        >
                          <span className={compact ? 'leading-4' : 'leading-5'}>{rowIndex + 1}</span>
                        </button>
                      </th>
                      {row.map((raw, col) => {
                        const column = columns[col];
                        const pos = { row: rowIndex, col };
                        const isActive = active.row === rowIndex && active.col === col;
                        const selected = rangeContains(selection, pos);
                        const isEditing = edit !== null && edit.pos.row === rowIndex && edit.pos.col === col;
                        const result = results[rowIndex][col];
                        const reason = reasons[rowIndex][col];
                        const locked = !isEditable(state, pos);
                        const frozen = freezeFirstColumn && col === 0;
                        const numeric = NUMERIC.has(column.type);
                        const formula = formulas && isFormula(raw);
                        const text = formula && result.kind === 'error' ? result.error : formatCell(column, raw, formula && result.kind === 'number' ? result.value : undefined);
                        const inFill = fillRow !== null && rowIndex > selection.r2 && rowIndex <= fillRow && col >= selection.c1 && col <= selection.c2;
                        const handle = !state.readOnly && !editing && rowIndex === selection.r2 && col === selection.c2 && fillRow === null;
                        const edges = selected
                          ? cn(
                              rowIndex === selection.r1 ? 'border-t-2' : 'border-t-0',
                              rowIndex === selection.r2 ? 'border-b-2' : 'border-b-0',
                              col === selection.c1 ? 'border-l-2' : 'border-l-0',
                              col === selection.c2 ? 'border-r-2' : 'border-r-0'
                            )
                          : '';
                        return (
                          <td
                            key={column.id}
                            role="gridcell"
                            data-sheet-cell=""
                            data-row={rowIndex}
                            data-col={col}
                            data-active={isActive || undefined}
                            data-type={column.type}
                            tabIndex={isActive && !isEditing ? 0 : -1}
                            aria-colindex={col + 2}
                            aria-selected={selected}
                            aria-readonly={locked || undefined}
                            aria-invalid={reason !== null || undefined}
                            onDoubleClick={() => {
                              if (column.type === 'checkbox') return;
                              selectOnEdit.current = true;
                              dispatch({ type: 'startEdit' });
                            }}
                            className={cn(
                              'relative scroll-mb-2 scroll-mr-2 scroll-mt-10 whitespace-nowrap border-b border-r border-default outline-none',
                              cellPad,
                              frozen ? 'sticky left-10 z-10 scroll-ml-10' : 'scroll-ml-44',
                              selected && multiple && !isActive ? 'bg-accent-background' : locked && !state.readOnly ? 'bg-muted-background' : 'bg-base-background',
                              locked && !state.readOnly ? 'text-medium-foreground' : 'text-base-foreground',
                              numeric ? 'text-right tabular-nums' : 'text-left',
                              column.mono ? 'font-mono' : ''
                            )}
                          >
                            <span className={cn('flex min-w-0 items-center gap-1.5', numeric ? 'justify-end' : '', compact ? 'min-h-4 leading-4' : 'min-h-5 leading-5', isEditing ? 'invisible' : '')}>
                              {reason !== null ? (
                                <Tooltip>
                                  <TooltipTrigger render={<span data-slot="sheet-invalid" className={cn('flex shrink-0 text-critical-foreground-strong', numeric ? 'mr-auto' : '')} />}>
                                    <IconAlertTriangle aria-hidden="true" className="size-3.5" />
                                  </TooltipTrigger>
                                  <TooltipContent>{reason}</TooltipContent>
                                </Tooltip>
                              ) : null}
                              {column.type === 'checkbox' ? (
                                <>
                                  <CheckboxItemControl
                                    tabIndex={-1}
                                    aria-label={`${column.title}, row ${rowIndex + 1}`}
                                    checked={raw === 'true'}
                                    readOnly={locked}
                                    onCheckedChange={() => {
                                      dispatch({ type: 'moveTo', pos });
                                      toggle(pos);
                                    }}
                                  />
                                  {raw !== 'true' && raw !== 'false' && raw !== '' ? <span>{raw}</span> : null}
                                </>
                              ) : (
                                <span className={reason !== null && formula ? 'text-critical-foreground-strong' : ''}>{text}</span>
                              )}
                              {reason !== null ? <span className="sr-only">, invalid: {reason}</span> : null}
                            </span>
                            {isEditing && edit ? (
                              column.type === 'select' ? (
                                <select
                                  ref={selectRef}
                                  aria-label={`${column.title}, row ${rowIndex + 1}`}
                                  value={edit.draft}
                                  className={cn('absolute inset-0 size-full bg-base-background px-1 text-base-foreground outline-none', compact ? 'text-xs' : 'text-sm')}
                                  onChange={(event) => dispatch({ type: 'setDraft', draft: event.target.value })}
                                  onKeyDown={onEditorKeyDown}
                                  onBlur={() => dispatch({ type: 'commitEdit' })}
                                >
                                  {column.options?.includes(edit.draft) ? null : <option value={edit.draft}>{edit.draft === '' ? 'Select' : edit.draft}</option>}
                                  {(column.options ?? []).map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  ref={inputRef}
                                  aria-label={`${column.title}, row ${rowIndex + 1}`}
                                  value={edit.draft}
                                  inputMode={numeric ? 'decimal' : 'text'}
                                  placeholder={column.type === 'date' ? 'YYYY-MM-DD' : undefined}
                                  className={cn('absolute inset-0 size-full bg-base-background px-2 text-base-foreground outline-none placeholder:text-muted-foreground', compact ? 'text-xs' : 'text-sm', numeric ? 'text-right tabular-nums' : '', column.mono ? 'font-mono' : '')}
                                  onChange={(event) => dispatch({ type: 'setDraft', draft: event.target.value })}
                                  onKeyDown={onEditorKeyDown}
                                  onBlur={() => dispatch({ type: 'commitEdit' })}
                                />
                              )
                            ) : null}
                            {selected ? <span aria-hidden="true" data-slot="sheet-selection" className={cn('pointer-events-none absolute -inset-px border-ring-default', multiple ? edges : 'border-2')} /> : null}
                            {isActive && multiple ? <span aria-hidden="true" className="pointer-events-none absolute inset-0 border border-ring-default" /> : null}
                            {inFill ? <span aria-hidden="true" data-slot="sheet-fill-preview" className="pointer-events-none absolute -inset-px border border-dashed border-ring-default" /> : null}
                            {handle ? <span aria-hidden="true" data-sheet-fill="" className="absolute bottom-0 right-0 size-2 cursor-crosshair bg-primary-background" /> : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>

      {statusBar && hasRows ? (
        <SheetStatusBar
          range={rangeLabel(selection)}
          stats={selectionStats(results, selection)}
          invalidReason={reasons[active.row]?.[active.col] ?? null}
          readOnly={!state.readOnly && !isEditable(state, active)}
          invalidCount={invalidCount}
        />
      ) : null}
      <div aria-live="polite" className="sr-only" data-slot="sheet-announcer">
        {state.announcement}
      </div>
    </div>
  );
}
