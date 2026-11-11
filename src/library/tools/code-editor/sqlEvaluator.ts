import { parseSql } from './sqlParser';
import type { ColumnRef, Expr, Operand, SelectQuery } from './sqlParser';
import type { Cell, ColumnDef, Database, QueryResult, SqlError, TableDef } from './sqlTypes';

/** The edit distance between two words, for "did you mean" hints. */
export function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1));
      previous = above;
    }
  }
  return row[b.length];
}

/** The name from `options` closest to `word`, when it is close enough to be a typo. */
export function closestName(word: string, options: readonly string[]): string | null {
  const ranked = options.map((name) => ({ name, distance: editDistance(word, name) })).sort((a, b) => a.distance - b.distance);
  const best = ranked[0];
  return best && best.distance <= Math.max(2, Math.floor(word.length / 3)) ? best.name : null;
}

const hint = (word: string, options: readonly string[]): string => {
  const match = closestName(word, options);
  return match ? ` Did you mean ${match}?` : ` Available: ${options.join(', ')}.`;
};

function likeToRegExp(pattern: string): RegExp {
  const source = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.');
  return new RegExp(`^${source}$`, 'is');
}

type Row = Readonly<Record<string, Cell>>;

class QueryFailure extends Error {
  constructor(readonly error: SqlError) {
    super(error.message);
  }
}

function findColumn(table: TableDef, ref: { name: string; start: number; end: number }): ColumnDef {
  const column = table.columns.find((candidate) => candidate.name.toLowerCase() === ref.name.toLowerCase());
  if (!column) {
    const names = table.columns.map((candidate) => candidate.name);
    throw new QueryFailure({ message: `Column "${ref.name}" does not exist in ${table.name}.${hint(ref.name, names)}`, start: ref.start, end: ref.end });
  }
  return column;
}

function operandType(table: TableDef, operand: Operand): string {
  if (operand.kind === 'column') return findColumn(table, operand).type === 'number' ? 'number' : findColumn(table, operand).type === 'boolean' ? 'boolean' : 'text';
  if (operand.value === null) return 'null';
  return typeof operand.value === 'number' ? 'number' : typeof operand.value === 'boolean' ? 'boolean' : 'text';
}

/** Walks the conditions once before any row is read, so a mistake is reported even on an empty table. */
function checkExpr(table: TableDef, expr: Expr): void {
  if (expr.kind === 'and' || expr.kind === 'or') {
    checkExpr(table, expr.left);
    checkExpr(table, expr.right);
  } else if (expr.kind === 'not') {
    checkExpr(table, expr.operand);
  } else {
    const left = operandType(table, expr.left);
    const right = operandType(table, expr.right);
    if (expr.op === 'IS') return;
    if (expr.op === 'LIKE' && (left !== 'text' || right !== 'text')) {
      throw new QueryFailure({ message: 'LIKE compares text with text.', start: expr.start, end: expr.end });
    }
    if (left !== 'null' && right !== 'null' && left !== right) {
      throw new QueryFailure({ message: `Cannot compare ${left} with ${right}. Quote text values and leave numbers bare.`, start: expr.start, end: expr.end });
    }
  }
}

function valueOf(row: Row, operand: Operand): Cell {
  return operand.kind === 'column' ? (row[operand.name] ?? row[operand.name.toLowerCase()] ?? null) : operand.value;
}

function compare(left: Cell, right: Cell, op: string): boolean {
  if (op === 'LIKE') return typeof left === 'string' && typeof right === 'string' && likeToRegExp(right).test(left);
  if (left === null || right === null) return false;
  switch (op) {
    case '=':
      return left === right;
    case '!=':
      return left !== right;
    case '<':
      return left < right;
    case '<=':
      return left <= right;
    case '>':
      return left > right;
    default:
      return left >= right;
  }
}

function matches(row: Row, expr: Expr): boolean {
  switch (expr.kind) {
    case 'and':
      return matches(row, expr.left) && matches(row, expr.right);
    case 'or':
      return matches(row, expr.left) || matches(row, expr.right);
    case 'not':
      return !matches(row, expr.operand);
    case 'compare': {
      if (expr.op === 'IS') return (valueOf(row, expr.left) === null) !== expr.negate;
      return compare(valueOf(row, expr.left), valueOf(row, expr.right), expr.op);
    }
  }
}

function compareCells(a: Cell, b: Cell): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
}

/** Looks every name in the query up against the schema and returns the first problem, or `null`. */
export function checkQuery(query: SelectQuery, database: Database): SqlError | null {
  try {
    execute(query, database, true);
    return null;
  } catch (error) {
    if (error instanceof QueryFailure) return error.error;
    throw error;
  }
}

function execute(query: SelectQuery, database: Database, dryRun: boolean): QueryResult & { ok: true } {
  const table = database.find((candidate) => candidate.name.toLowerCase() === query.table.name.toLowerCase());
  if (!table) {
    const names = database.map((candidate) => candidate.name);
    throw new QueryFailure({ message: `Table "${query.table.name}" does not exist.${hint(query.table.name, names)}`, start: query.table.start, end: query.table.end });
  }
  const selected = query.columns === null ? table.columns : query.columns.map((ref) => findColumn(table, ref));
  if (query.where) checkExpr(table, query.where);
  const sort = query.orderBy.map((term) => ({ column: findColumn(table, term.column), direction: term.direction }));
  if (dryRun) return { ok: true, columns: selected.map((column) => column.name), rows: [], rowCount: 0 };

  let rows = table.rows.filter((row) => (query.where ? matches(row, query.where) : true));
  if (sort.length > 0) {
    rows = [...rows].sort((a, b) => {
      for (const term of sort) {
        const order = compareCells(a[term.column.name] ?? null, b[term.column.name] ?? null);
        if (order !== 0) return term.direction === 'asc' ? order : -order;
      }
      return 0;
    });
  }
  if (query.limit) rows = rows.slice(0, query.limit.value);
  return {
    ok: true,
    columns: selected.map((column) => column.name),
    rows: rows.map((row) => selected.map((column) => row[column.name] ?? null)),
    rowCount: rows.length,
  };
}

/**
 * Runs a query against in-memory tables. Parsing, name checking and evaluation are separate
 * steps, so an unknown column is reported with its position even when the table is empty, and
 * nothing ever throws: a failure comes back as `{ ok: false, error }`.
 */
export function runQuery(text: string, database: Database): QueryResult {
  const parsed = parseSql(text);
  if (!parsed.ok) return parsed;
  try {
    return execute(parsed.query, database, false);
  } catch (error) {
    if (error instanceof QueryFailure) return { ok: false, error: error.error };
    throw error;
  }
}

export type { ColumnRef };
