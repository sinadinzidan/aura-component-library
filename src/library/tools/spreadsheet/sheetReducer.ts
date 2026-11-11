import { clampPos, normalizeRange, rangeFrom, rangeLabel, rangeSize } from './cellRef';
import type { CellPos, CellRange } from './cellRef';
import { normalizeInput } from './columns';
import type { SheetColumn } from './columns';
import { shiftFormula } from './formula';

/**
 * All the state of a spreadsheet grid, as a pure reducer: the cell text, the active cell, the
 * selected range, the open edit, an undo history and the last announcement for screen readers.
 */

export type SheetEdit = { pos: CellPos; draft: string };

export type SheetState = {
  columns: readonly SheetColumn[];
  /** Raw cell text, `cells[row][col]`. */
  cells: readonly (readonly string[])[];
  /** The cell that has focus; also the anchor of the selection. */
  active: CellPos;
  /** The other corner of the selection. Equal to `active` when one cell is selected. */
  extent: CellPos;
  edit: SheetEdit | null;
  /** The whole grid is read-only. */
  readOnly: boolean;
  past: readonly (readonly (readonly string[])[])[];
  future: readonly (readonly (readonly string[])[])[];
  /** What just happened, for an `aria-live` region. */
  announcement: string;
};

export type SheetDirection = 'up' | 'down' | 'left' | 'right';

export type SheetAction =
  | { type: 'move'; direction: SheetDirection; extend?: boolean; toEdge?: boolean }
  | { type: 'moveTo'; pos: CellPos; extend?: boolean }
  | { type: 'jump'; to: 'rowStart' | 'rowEnd' | 'gridStart' | 'gridEnd'; extend?: boolean }
  | { type: 'selectRow'; row: number; extend?: boolean }
  | { type: 'selectColumn'; col: number; extend?: boolean }
  | { type: 'selectAll' }
  | { type: 'startEdit'; initial?: string }
  | { type: 'setDraft'; draft: string }
  | { type: 'commitEdit'; move?: SheetDirection }
  | { type: 'cancelEdit' }
  | { type: 'setCell'; pos: CellPos; value: string }
  | { type: 'clear' }
  | { type: 'paste'; rows: readonly (readonly string[])[] }
  | { type: 'fillDown' }
  | { type: 'fillTo'; row: number }
  | { type: 'announce'; message: string }
  | { type: 'undo' }
  | { type: 'redo' };

const HISTORY_LIMIT = 100;

const DELTA: Record<SheetDirection, CellPos> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
};

export type SheetInit = {
  columns: readonly SheetColumn[];
  rows: readonly (readonly string[])[];
  readOnly?: boolean;
  active?: CellPos;
  extent?: CellPos;
};

/** Starting state. Rows are padded or cut to the number of columns. */
export function createSheetState({ columns, rows, readOnly = false, active, extent }: SheetInit): SheetState {
  const cells = rows.map((row) => columns.map((_, col) => row[col] ?? ''));
  const start = clampPos(active ?? { row: 0, col: 0 }, cells.length, columns.length);
  return {
    columns,
    cells,
    active: start,
    extent: clampPos(extent ?? start, cells.length, columns.length),
    edit: null,
    readOnly,
    past: [],
    future: [],
    announcement: '',
  };
}

/** The selected rectangle. */
export function selectionOf(state: SheetState): CellRange {
  return rangeFrom(state.active, state.extent);
}

/** True when the cell can be changed. */
export function isEditable(state: SheetState, pos: CellPos): boolean {
  return !state.readOnly && state.columns[pos.col]?.readOnly !== true;
}

function cellsWord(count: number): string {
  return `${count} ${count === 1 ? 'cell' : 'cells'}`;
}

/** Applies changes as one undoable step. Read-only cells and unchanged values are skipped. */
function write(state: SheetState, changes: readonly { pos: CellPos; value: string }[], describe: (changed: number, skipped: number) => string): SheetState {
  let changed = 0;
  let skipped = 0;
  const next = state.cells.map((row) => [...row]);
  for (const { pos, value } of changes) {
    if (pos.row < 0 || pos.row >= next.length || pos.col < 0 || pos.col >= state.columns.length) continue;
    if (!isEditable(state, pos)) {
      skipped += 1;
      continue;
    }
    if (next[pos.row][pos.col] === value) continue;
    next[pos.row][pos.col] = value;
    changed += 1;
  }
  const announcement = describe(changed, skipped);
  if (changed === 0) return { ...state, announcement };
  return { ...state, cells: next, past: [...state.past, state.cells].slice(-HISTORY_LIMIT), future: [], announcement };
}

function select(state: SheetState, active: CellPos, extent: CellPos): SheetState {
  const rows = state.cells.length;
  const cols = state.columns.length;
  return { ...state, active: clampPos(active, rows, cols), extent: clampPos(extent, rows, cols), announcement: '' };
}

function moveSelection(state: SheetState, target: CellPos, extend: boolean): SheetState {
  return extend ? select(state, state.active, target) : select(state, target, target);
}

function commit(state: SheetState, move?: SheetDirection): SheetState {
  if (!state.edit) return state;
  const { pos, draft } = state.edit;
  const column = state.columns[pos.col];
  const value = column ? normalizeInput(column, draft) : draft;
  const closed: SheetState = { ...state, edit: null };
  const written = write(closed, [{ pos, value }], (changed) => (changed ? `${rangeLabel({ r1: pos.row, c1: pos.col, r2: pos.row, c2: pos.col })} set to ${value === '' ? 'empty' : value}` : ''));
  if (!move) return written;
  const delta = DELTA[move];
  const target = clampPos({ row: pos.row + delta.row, col: pos.col + delta.col }, state.cells.length, state.columns.length);
  return { ...written, active: target, extent: target };
}

export function sheetReducer(state: SheetState, action: SheetAction): SheetState {
  const rows = state.cells.length;
  const cols = state.columns.length;
  if (rows === 0 || cols === 0) return state;

  switch (action.type) {
    case 'move': {
      const from = action.extend ? state.extent : state.active;
      const delta = DELTA[action.direction];
      const target = action.toEdge
        ? { row: delta.row === 0 ? from.row : delta.row < 0 ? 0 : rows - 1, col: delta.col === 0 ? from.col : delta.col < 0 ? 0 : cols - 1 }
        : { row: from.row + delta.row, col: from.col + delta.col };
      return moveSelection(commit(state), target, action.extend === true);
    }
    case 'moveTo':
      return moveSelection(commit(state), action.pos, action.extend === true);
    case 'jump': {
      const from = action.extend ? state.extent : state.active;
      const target: CellPos =
        action.to === 'rowStart' ? { row: from.row, col: 0 } : action.to === 'rowEnd' ? { row: from.row, col: cols - 1 } : action.to === 'gridStart' ? { row: 0, col: 0 } : { row: rows - 1, col: cols - 1 };
      return moveSelection(commit(state), target, action.extend === true);
    }
    case 'selectRow': {
      const base = commit(state);
      const first = action.extend ? base.active.row : action.row;
      const next = select(base, { row: first, col: 0 }, { row: action.row, col: cols - 1 });
      const count = Math.abs(action.row - first) + 1;
      return { ...next, announcement: count === 1 ? `Row ${action.row + 1} selected` : `${count} rows selected` };
    }
    case 'selectColumn': {
      const base = commit(state);
      const first = action.extend ? base.active.col : action.col;
      const next = select(base, { row: 0, col: first }, { row: rows - 1, col: action.col });
      const count = Math.abs(action.col - first) + 1;
      return { ...next, announcement: count === 1 ? `Column ${state.columns[action.col]?.title ?? action.col + 1} selected` : `${count} columns selected` };
    }
    case 'selectAll':
      return { ...select(commit(state), { row: 0, col: 0 }, { row: rows - 1, col: cols - 1 }), announcement: 'All cells selected' };
    case 'startEdit': {
      if (state.edit) return state;
      const pos = state.active;
      if (!isEditable(state, pos)) {
        return { ...state, announcement: state.readOnly ? 'This sheet is read-only' : `${state.columns[pos.col]?.title ?? 'This column'} is read-only` };
      }
      return { ...state, extent: pos, edit: { pos, draft: action.initial ?? state.cells[pos.row][pos.col] }, announcement: '' };
    }
    case 'setDraft':
      return state.edit ? { ...state, edit: { ...state.edit, draft: action.draft } } : state;
    case 'commitEdit':
      return commit(state, action.move);
    case 'cancelEdit':
      return state.edit ? { ...state, edit: null, announcement: 'Edit cancelled' } : state;
    case 'setCell': {
      if (!isEditable(state, action.pos)) return { ...state, announcement: `${state.columns[action.pos.col]?.title ?? 'This column'} is read-only` };
      const column = state.columns[action.pos.col];
      const value = column ? normalizeInput(column, action.value) : action.value;
      return write(state, [{ pos: action.pos, value }], (changed) => (changed ? `${rangeLabel({ r1: action.pos.row, c1: action.pos.col, r2: action.pos.row, c2: action.pos.col })} set to ${value}` : ''));
    }
    case 'clear': {
      const { r1, c1, r2, c2 } = selectionOf(state);
      const changes: { pos: CellPos; value: string }[] = [];
      for (let row = r1; row <= r2; row += 1) {
        for (let col = c1; col <= c2; col += 1) changes.push({ pos: { row, col }, value: state.columns[col].type === 'checkbox' ? 'false' : '' });
      }
      return write(state, changes, (changed, skipped) => `Cleared ${cellsWord(changed)}${skipped ? `, ${skipped} read-only skipped` : ''}`);
    }
    case 'paste': {
      const source = action.rows.filter((row) => row.length > 0);
      if (source.length === 0) return { ...state, announcement: 'Nothing to paste' };
      const selection = selectionOf(state);
      const size = rangeSize(selection);
      const sourceCols = Math.max(...source.map((row) => row.length));
      // A copied block repeats to fill a larger selection when it fits a whole number of times.
      const tile = size.rows % source.length === 0 && size.cols % sourceCols === 0 && size.cells > source.length * sourceCols;
      const height = tile ? size.rows : source.length;
      const width = tile ? size.cols : sourceCols;
      const changes: { pos: CellPos; value: string }[] = [];
      let clipped = 0;
      for (let dr = 0; dr < height; dr += 1) {
        for (let dc = 0; dc < width; dc += 1) {
          const pos = { row: selection.r1 + dr, col: selection.c1 + dc };
          const raw = source[dr % source.length][dc % sourceCols];
          if (raw === undefined) continue;
          if (pos.row >= rows || pos.col >= cols) {
            clipped += 1;
            continue;
          }
          changes.push({ pos, value: normalizeInput(state.columns[pos.col], raw) });
        }
      }
      const written = write(state, changes, (changed, skipped) => {
        const notes = [skipped ? `${skipped} read-only skipped` : '', clipped ? `${clipped} outside the sheet` : ''].filter(Boolean);
        return `Pasted ${cellsWord(changed)}${notes.length ? `, ${notes.join(', ')}` : ''}`;
      });
      const end = clampPos({ row: selection.r1 + height - 1, col: selection.c1 + width - 1 }, rows, cols);
      return { ...written, active: { row: selection.r1, col: selection.c1 }, extent: end };
    }
    case 'fillDown': {
      const selection = selectionOf(state);
      const sourceRow = selection.r1 === selection.r2 ? selection.r1 - 1 : selection.r1;
      if (sourceRow < 0) return { ...state, announcement: 'Nothing above to fill from' };
      const changes: { pos: CellPos; value: string }[] = [];
      for (let row = sourceRow + 1; row <= selection.r2; row += 1) {
        for (let col = selection.c1; col <= selection.c2; col += 1) {
          changes.push({ pos: { row, col }, value: shiftFormula(state.cells[sourceRow][col], row - sourceRow, 0) });
        }
      }
      return write(state, changes, (changed, skipped) => `Filled ${cellsWord(changed)} down${skipped ? `, ${skipped} read-only skipped` : ''}`);
    }
    case 'fillTo': {
      const selection = normalizeRange(selectionOf(state));
      const last = Math.min(action.row, rows - 1);
      if (last <= selection.r2) return state;
      const height = selection.r2 - selection.r1 + 1;
      const changes: { pos: CellPos; value: string }[] = [];
      for (let row = selection.r2 + 1; row <= last; row += 1) {
        const from = selection.r1 + ((row - selection.r1) % height);
        for (let col = selection.c1; col <= selection.c2; col += 1) {
          changes.push({ pos: { row, col }, value: shiftFormula(state.cells[from][col], row - from, 0) });
        }
      }
      const written = write(state, changes, (changed, skipped) => `Filled ${cellsWord(changed)} down${skipped ? `, ${skipped} read-only skipped` : ''}`);
      return { ...written, active: { row: selection.r1, col: selection.c1 }, extent: { row: last, col: selection.c2 } };
    }
    case 'announce':
      return { ...state, announcement: action.message };
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return { ...state, announcement: 'Nothing to undo' };
      return { ...state, edit: null, cells: previous, past: state.past.slice(0, -1), future: [state.cells, ...state.future], announcement: 'Undid last change' };
    }
    case 'redo': {
      const next = state.future[0];
      if (!next) return { ...state, announcement: 'Nothing to redo' };
      return { ...state, edit: null, cells: next, past: [...state.past, state.cells], future: state.future.slice(1), announcement: 'Redid change' };
    }
    default:
      return state;
  }
}
