/** A value in a result cell. Missing values are `null`. */
export type Cell = string | number | boolean | null;

export type ColumnType = 'text' | 'number' | 'boolean' | 'timestamp';

export type ColumnDef = { name: string; type: ColumnType; description?: string };

/** One table of the in-memory database the query runs against. */
export type TableDef = { name: string; description?: string; columns: readonly ColumnDef[]; rows: readonly Readonly<Record<string, Cell>>[] };

export type Database = readonly TableDef[];

/** Where something went wrong: offsets into the text, `end` exclusive. */
export type SqlError = { message: string; start: number; end: number };

export type QueryResult =
  | { ok: true; columns: readonly string[]; rows: readonly (readonly Cell[])[]; rowCount: number }
  | { ok: false; error: SqlError };

export type TokenType = 'keyword' | 'identifier' | 'string' | 'number' | 'operator' | 'punct' | 'comment' | 'whitespace';

export type Token = { type: TokenType; text: string; start: number; end: number };
