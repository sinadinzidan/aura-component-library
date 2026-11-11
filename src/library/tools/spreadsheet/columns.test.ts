import { formatCell, formatNumber, isIsoDate, normalizeInput, validateCell } from './columns';
import type { SheetColumn } from './columns';

const TEXT: SheetColumn = { id: 'name', title: 'Name', type: 'text' };
const REQUIRED: SheetColumn = { id: 'tag', title: 'Tag', type: 'text', required: true };
const NUMBER: SheetColumn = { id: 'high', title: 'High', type: 'number', unit: 'barg', decimals: 1, min: 0, max: 100 };
const SELECT: SheetColumn = { id: 'priority', title: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] };
const DATE: SheetColumn = { id: 'reviewed', title: 'Reviewed', type: 'date' };
const CHECK: SheetColumn = { id: 'enabled', title: 'Enabled', type: 'checkbox' };

describe('isIsoDate', () => {
  it('accepts real dates only', () => {
    expect(isIsoDate('2026-03-12')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('12.03.2026')).toBe(false);
  });
});

describe('normalizeInput', () => {
  it('trims text', () => {
    expect(normalizeInput(TEXT, '  Discharge pressure ')).toBe('Discharge pressure');
  });

  it('accepts a decimal comma and spaces in numbers', () => {
    expect(normalizeInput(NUMBER, '48,6')).toBe('48.6');
    expect(normalizeInput(NUMBER, '182 400')).toBe('182400');
  });

  it('leaves text that is not a number for validation to flag', () => {
    expect(normalizeInput(NUMBER, 'high')).toBe('high');
  });

  it('leaves formulas alone', () => {
    expect(normalizeInput(NUMBER, ' =B2*1,1')).toBe('=B2*1,1');
  });

  it('maps yes and no words to a checkbox value', () => {
    expect(normalizeInput(CHECK, 'Yes')).toBe('true');
    expect(normalizeInput(CHECK, 'x')).toBe('true');
    expect(normalizeInput(CHECK, 'no')).toBe('false');
    expect(normalizeInput(CHECK, '')).toBe('false');
    expect(normalizeInput(CHECK, 'maybe')).toBe('maybe');
  });

  it('matches a select option whatever the case', () => {
    expect(normalizeInput(SELECT, 'high')).toBe('High');
    expect(normalizeInput(SELECT, 'urgent')).toBe('urgent');
  });
});

describe('validateCell', () => {
  it('accepts any text', () => {
    expect(validateCell(TEXT, 'anything')).toBeNull();
    expect(validateCell(TEXT, '')).toBeNull();
  });

  it('requires a value in a required column', () => {
    expect(validateCell(REQUIRED, '  ')).toBe('Tag is required');
    expect(validateCell(REQUIRED, '23-PT-92531')).toBeNull();
  });

  it('checks that a number is a number', () => {
    expect(validateCell(NUMBER, '48.6')).toBeNull();
    expect(validateCell(NUMBER, 'high')).toBe('Must be a number');
    expect(validateCell(NUMBER, '')).toBeNull();
  });

  it('checks the range of a number', () => {
    expect(validateCell(NUMBER, '-1')).toBe('Must be 0 or more');
    expect(validateCell(NUMBER, '101')).toBe('Must be 100 or less');
    expect(validateCell(NUMBER, '100')).toBeNull();
  });

  it('checks the evaluated value of a formula', () => {
    expect(validateCell(NUMBER, '=B2*10', 480)).toBe('Must be 100 or less');
    expect(validateCell(NUMBER, '=B2', 48)).toBeNull();
  });

  it('checks a select value against its options', () => {
    expect(validateCell(SELECT, 'High')).toBeNull();
    expect(validateCell(SELECT, 'Urgent')).toBe('Must be one of: Low, Medium, High');
  });

  it('checks a date', () => {
    expect(validateCell(DATE, '2026-03-12')).toBeNull();
    expect(validateCell(DATE, '12 March')).toBe('Must be a date as YYYY-MM-DD');
  });

  it('checks a checkbox value', () => {
    expect(validateCell(CHECK, 'true')).toBeNull();
    expect(validateCell(CHECK, 'maybe')).toBe('Must be checked or unchecked');
  });
});

describe('formatNumber', () => {
  it('uses fixed decimals, separators and a real minus sign', () => {
    expect(formatNumber(182400)).toBe('182,400');
    expect(formatNumber(48.64, 1)).toBe('48.6');
    expect(formatNumber(-3.5, 1)).toBe('−3.5');
    expect(formatNumber(-0.01, 1)).toBe('0.0');
    expect(formatNumber(182400, 0)).toBe('182,400');
  });

  it('keeps the decimals a number has when none are asked for', () => {
    expect(formatNumber(7.1)).toBe('7.1');
    expect(formatNumber(10500)).toBe('10,500');
    expect(formatCell({ id: 'n', title: 'N', type: 'number' }, '7.10')).toBe('7.1');
  });
});

describe('formatCell', () => {
  it('formats a number with the column decimals', () => {
    expect(formatCell(NUMBER, '52')).toBe('52.0');
  });

  it('formats the evaluated value of a formula', () => {
    expect(formatCell(NUMBER, '=B2*1.1', 53.46)).toBe('53.5');
    expect(formatCell(TEXT, '=B2*1.1', 53.456)).toBe('53.46');
  });

  it('shows text that is not a number as typed', () => {
    expect(formatCell(NUMBER, 'high')).toBe('high');
  });

  it('formats a date', () => {
    expect(formatCell(DATE, '2026-03-09')).toBe('9 Mar 2026');
    expect(formatCell(DATE, 'soon')).toBe('soon');
  });

  it('words a checkbox', () => {
    expect(formatCell(CHECK, 'true')).toBe('Yes');
    expect(formatCell(CHECK, 'false')).toBe('No');
    expect(formatCell(CHECK, '')).toBe('No');
  });

  it('shows text and select values as they are', () => {
    expect(formatCell(TEXT, ' Shaft speed ')).toBe('Shaft speed');
    expect(formatCell(SELECT, 'High')).toBe('High');
  });
});
