/**
 * Typed columns for a spreadsheet grid. Every cell is stored as raw text; the column decides how
 * that text is checked, shown and edited. Checkboxes store `true` / `false`, dates store ISO
 * `YYYY-MM-DD`, numbers store plain decimal text.
 */

export type SheetColumnType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export type SheetColumn = {
  id: string;
  /** Column heading. */
  title: string;
  type: SheetColumnType;
  /** Unit printed in the heading of a number column. */
  unit?: string;
  /** Decimals a number is shown with. */
  decimals?: number;
  /** Allowed range of a number column. */
  min?: number;
  max?: number;
  /** Choices of a select column. */
  options?: readonly string[];
  /** The cell must not be empty. */
  required?: boolean;
  /** Cells cannot be edited, pasted over or filled. */
  readOnly?: boolean;
  /** Sets values in monospace: tags, part numbers, IDs. */
  mono?: boolean;
  /** Width in `ch`, so columns follow the typeface. */
  width?: number;
};

const NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date written `YYYY-MM-DD`. */
export function isIsoDate(text: string): boolean {
  const match = ISO_DATE.exec(text);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Tidies what was typed or pasted for the column: trims, accepts a decimal comma, maps yes/no words to `true`/`false`. */
export function normalizeInput(column: SheetColumn, raw: string): string {
  const text = raw.trim();
  if (text.startsWith('=')) return text;
  if (column.type === 'number') {
    const candidate = text.replace(/\s/g, '').replace(',', '.');
    return NUMBER.test(candidate) ? candidate : text;
  }
  if (column.type === 'checkbox') {
    if (/^(true|yes|y|1|x)$/i.test(text)) return 'true';
    if (/^(false|no|n|0|)$/i.test(text)) return 'false';
    return text;
  }
  if (column.type === 'select') {
    const match = column.options?.find((option) => option.toLowerCase() === text.toLowerCase());
    return match ?? text;
  }
  return text;
}

/**
 * Why a cell's value is not acceptable for its column, or `null` when it is fine. `value` is the
 * evaluated number when the cell holds a formula.
 */
export function validateCell(column: SheetColumn, raw: string, value?: number): string | null {
  const text = raw.trim();
  if (text === '' && value === undefined) return column.required ? `${column.title} is required` : null;

  if (column.type === 'number') {
    const number = value ?? (NUMBER.test(text) ? Number(text) : Number.NaN);
    if (!Number.isFinite(number)) return 'Must be a number';
    if (column.min !== undefined && number < column.min) return `Must be ${column.min} or more`;
    if (column.max !== undefined && number > column.max) return `Must be ${column.max} or less`;
    return null;
  }
  if (column.type === 'select') {
    return column.options?.includes(text) ? null : `Must be one of: ${(column.options ?? []).join(', ')}`;
  }
  if (column.type === 'date') return isIsoDate(text) ? null : 'Must be a date as YYYY-MM-DD';
  if (column.type === 'checkbox') return text === 'true' || text === 'false' ? null : 'Must be checked or unchecked';
  return null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A number with thousands separators and a real minus sign. With `decimals` it is fixed to that
 * many; without, it keeps the decimals it has (up to six).
 */
export function formatNumber(value: number, decimals?: number): string {
  const digits = decimals === undefined ? { maximumFractionDigits: 6 } : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  const text = new Intl.NumberFormat('en-US', digits).format(Math.abs(value));
  const isZero = Number(text.replace(/,/g, '')) === 0;
  return value < 0 && !isZero ? `−${text}` : text;
}

/** The text a cell shows: formatted numbers and dates, the raw text for anything it cannot format. */
export function formatCell(column: SheetColumn, raw: string, value?: number): string {
  const text = raw.trim();
  if (column.type === 'number') {
    const number = value ?? (NUMBER.test(text) ? Number(text) : Number.NaN);
    return Number.isFinite(number) ? formatNumber(number, column.decimals) : text;
  }
  if (column.type === 'date') {
    const match = ISO_DATE.exec(text);
    return match && isIsoDate(text) ? `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}` : text;
  }
  if (column.type === 'checkbox') return text === 'true' ? 'Yes' : text === 'false' || text === '' ? 'No' : text;
  if (value !== undefined) return formatNumber(value, column.decimals ?? 2);
  return text;
}
