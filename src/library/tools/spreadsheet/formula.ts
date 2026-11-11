import { columnLabel, parseCellRef } from './cellRef';
import type { CellPos } from './cellRef';

/**
 * A small formula evaluator for a spreadsheet grid: numbers, cell references, `+ - * /`,
 * parentheses, unary minus and the range functions SUM, AVERAGE, MIN, MAX and COUNT.
 * `=SUM(B2:B6)`, `=AVERAGE(C2:C4)`, `=B2*1.1`. Pure: cells are read through a lookup.
 */

export type FormulaError = '#ERROR!' | '#NAME?' | '#REF!' | '#DIV/0!' | '#VALUE!' | '#CYCLE!';

export type CellResult =
  | { kind: 'empty' }
  | { kind: 'number'; value: number }
  | { kind: 'text'; value: string }
  | { kind: 'error'; error: FormulaError };

/** Reads a cell for the evaluator; `null` when the position is outside the sheet. */
export type CellLookup = (pos: CellPos) => CellResult | null;

/** What each error means, in words, for a tooltip or a status bar. */
export const FORMULA_ERROR_REASON: Record<FormulaError, string> = {
  '#ERROR!': 'The formula cannot be read',
  '#NAME?': 'Unknown function name',
  '#REF!': 'Refers to a cell outside the sheet',
  '#DIV/0!': 'Divides by zero',
  '#VALUE!': 'Uses a cell that is not a number',
  '#CYCLE!': 'Refers to itself',
};

const FUNCTIONS: Record<string, (values: number[]) => number | FormulaError> = {
  SUM: (values) => values.reduce((total, value) => total + value, 0),
  AVERAGE: (values) => (values.length === 0 ? '#DIV/0!' : values.reduce((total, value) => total + value, 0) / values.length),
  MIN: (values) => (values.length === 0 ? 0 : Math.min(...values)),
  MAX: (values) => (values.length === 0 ? 0 : Math.max(...values)),
  COUNT: (values) => values.length,
};

/** Names of the supported functions. */
export const FORMULA_FUNCTIONS: readonly string[] = Object.keys(FUNCTIONS);

type Token =
  | { type: 'number'; value: number }
  | { type: 'name'; value: string }
  | { type: 'op'; value: '+' | '-' | '*' | '/' | '(' | ')' | ',' | ':' };

class FormulaFailure extends Error {
  readonly code: FormulaError;

  constructor(code: FormulaError) {
    super(code);
    this.code = code;
  }
}

function isOperator(char: string): char is '+' | '-' | '*' | '/' | '(' | ')' | ',' | ':' {
  return '+-*/(),:'.includes(char) && char.length === 1;
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (isOperator(char)) {
      tokens.push({ type: 'op', value: char });
      index += 1;
      continue;
    }
    const number = /^(\d+\.?\d*|\.\d+)/.exec(source.slice(index));
    if (number) {
      tokens.push({ type: 'number', value: Number(number[0]) });
      index += number[0].length;
      continue;
    }
    const name = /^[$A-Za-z][$A-Za-z0-9]*/.exec(source.slice(index));
    if (name) {
      tokens.push({ type: 'name', value: name[0] });
      index += name[0].length;
      continue;
    }
    throw new FormulaFailure('#ERROR!');
  }
  return tokens;
}

/** True when the cell text is a formula. */
export function isFormula(raw: string): boolean {
  return raw.trimStart().startsWith('=');
}

/** Evaluates one formula (with or without the leading `=`). Never throws; problems come back as an error result. */
export function evaluateFormula(source: string, lookup: CellLookup): CellResult {
  try {
    const body = source.trim().replace(/^=/, '');
    const tokens = tokenize(body);
    let cursor = 0;

    const peek = (): Token | undefined => tokens[cursor];
    const isOp = (value: string): boolean => {
      const token = peek();
      return token !== undefined && token.type === 'op' && token.value === value;
    };
    const expectOp = (value: string) => {
      if (!isOp(value)) throw new FormulaFailure('#ERROR!');
      cursor += 1;
    };

    const read = (pos: CellPos): CellResult => {
      const cell = lookup(pos);
      if (cell === null) throw new FormulaFailure('#REF!');
      if (cell.kind === 'error') throw new FormulaFailure(cell.error);
      return cell;
    };

    const scalar = (pos: CellPos): number => {
      const cell = read(pos);
      if (cell.kind === 'number') return cell.value;
      if (cell.kind === 'empty') return 0;
      throw new FormulaFailure('#VALUE!');
    };

    const refAt = (token: Token | undefined): CellPos | null => (token !== undefined && token.type === 'name' ? parseCellRef(token.value) : null);

    /** One function argument: a range gives every number in it, anything else one value. */
    const argument = (): number[] => {
      const start = refAt(peek());
      const colon = tokens[cursor + 1];
      if (start && colon !== undefined && colon.type === 'op' && colon.value === ':') {
        const end = refAt(tokens[cursor + 2]);
        if (!end) throw new FormulaFailure('#ERROR!');
        cursor += 3;
        const values: number[] = [];
        for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row += 1) {
          for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col += 1) {
            const cell = read({ row, col });
            if (cell.kind === 'number') values.push(cell.value);
          }
        }
        return values;
      }
      return [expression()];
    };

    const primary = (): number => {
      const token = peek();
      if (token === undefined) throw new FormulaFailure('#ERROR!');
      if (token.type === 'number') {
        cursor += 1;
        return token.value;
      }
      if (token.type === 'op') {
        expectOp('(');
        const value = expression();
        expectOp(')');
        return value;
      }
      cursor += 1;
      if (isOp('(')) {
        const fn = FUNCTIONS[token.value.toUpperCase()];
        if (!fn) throw new FormulaFailure('#NAME?');
        cursor += 1;
        const values: number[] = [];
        if (!isOp(')')) {
          values.push(...argument());
          while (isOp(',')) {
            cursor += 1;
            values.push(...argument());
          }
        }
        expectOp(')');
        const result = fn(values);
        if (typeof result === 'string') throw new FormulaFailure(result);
        return result;
      }
      const pos = parseCellRef(token.value);
      if (!pos) throw new FormulaFailure('#NAME?');
      return scalar(pos);
    };

    const unary = (): number => {
      if (isOp('-')) {
        cursor += 1;
        return -unary();
      }
      if (isOp('+')) {
        cursor += 1;
        return unary();
      }
      return primary();
    };

    const term = (): number => {
      let value = unary();
      while (isOp('*') || isOp('/')) {
        const divide = isOp('/');
        cursor += 1;
        const right = unary();
        if (divide && right === 0) throw new FormulaFailure('#DIV/0!');
        value = divide ? value / right : value * right;
      }
      return value;
    };

    function expression(): number {
      let value = term();
      while (isOp('+') || isOp('-')) {
        const subtract = isOp('-');
        cursor += 1;
        const right = term();
        value = subtract ? value - right : value + right;
      }
      return value;
    }

    if (tokens.length === 0) throw new FormulaFailure('#ERROR!');
    const value = expression();
    if (cursor < tokens.length) throw new FormulaFailure('#ERROR!');
    if (!Number.isFinite(value)) throw new FormulaFailure('#VALUE!');
    return { kind: 'number', value };
  } catch (failure) {
    if (failure instanceof FormulaFailure) return { kind: 'error', error: failure.code };
    throw failure;
  }
}

/**
 * Rewrites the relative references of a formula for a copy `rows` down and `cols` right, the way
 * a fill does: `=B2*1.1` one row down is `=B3*1.1`. Parts marked `$` stay; a reference pushed off
 * the sheet becomes `#REF!`. Text that is not a formula is returned unchanged.
 */
export function shiftFormula(raw: string, rows: number, cols: number): string {
  if (!isFormula(raw)) return raw;
  return raw.replace(/(\$?)([A-Za-z]+)(\$?)([1-9][0-9]*)(?![A-Za-z0-9(])/g, (match: string, colLock: string, letters: string, rowLock: string, digits: string, offset: number) => {
    const before = offset > 0 ? raw[offset - 1] : '';
    if (/[A-Za-z0-9$]/.test(before)) return match;
    const pos = parseCellRef(`${letters}${digits}`);
    if (!pos) return match;
    const row = rowLock === '$' ? pos.row : pos.row + rows;
    const col = colLock === '$' ? pos.col : pos.col + cols;
    if (row < 0 || col < 0) return '#REF!';
    return `${colLock}${columnLabel(col)}${rowLock}${row + 1}`;
  });
}

/** A plain (non-formula) cell: empty, a number, or text. Thousands separators are not numbers. */
export function literalResult(raw: string): CellResult {
  const text = raw.trim();
  if (text === '') return { kind: 'empty' };
  const value = Number(text);
  return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(text) && Number.isFinite(value) ? { kind: 'number', value } : { kind: 'text', value: raw };
}

/**
 * Evaluates every cell of a sheet of raw text. Formulas may refer to other formulas; a formula
 * that reaches itself gets `#CYCLE!`, and so does every formula that depends on it.
 */
export function evaluateSheet(cells: readonly (readonly string[])[]): CellResult[][] {
  const results: (CellResult | undefined)[][] = cells.map((row) => row.map(() => undefined));
  const visiting = new Set<string>();

  const resolve = (pos: CellPos): CellResult | null => {
    const row = cells[pos.row];
    if (row === undefined || pos.col < 0 || pos.col >= row.length) return null;
    const known = results[pos.row][pos.col];
    if (known) return known;
    const raw = row[pos.col];
    let result: CellResult;
    if (isFormula(raw)) {
      const key = `${pos.row}:${pos.col}`;
      if (visiting.has(key)) return { kind: 'error', error: '#CYCLE!' };
      visiting.add(key);
      result = evaluateFormula(raw, resolve);
      visiting.delete(key);
    } else {
      result = literalResult(raw);
    }
    results[pos.row][pos.col] = result;
    return result;
  };

  return cells.map((row, rowIndex) => row.map((_, colIndex) => resolve({ row: rowIndex, col: colIndex }) ?? { kind: 'empty' }));
}
