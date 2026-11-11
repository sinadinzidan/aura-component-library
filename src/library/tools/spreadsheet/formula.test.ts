import { evaluateFormula, evaluateSheet, FORMULA_ERROR_REASON, FORMULA_FUNCTIONS, isFormula, literalResult, shiftFormula } from './formula';
import type { CellLookup, CellResult, FormulaError } from './formula';

/** A 3 x 6 sheet: column A text, B numbers 10..50 with a gap, C mixed. */
const GRID: readonly (readonly string[])[] = [
  ['Tag', 'High', 'Note'],
  ['23-PT-92531', '10', '2'],
  ['23-PT-92530', '20', ''],
  ['23-TT-92532', '30', 'n/a'],
  ['23-VT-92540', '', '4'],
  ['23-ST-92501', '50', '0'],
];

const lookup: CellLookup = (pos) => {
  const row = GRID[pos.row];
  if (row === undefined || pos.col < 0 || pos.col >= row.length) return null;
  return literalResult(row[pos.col]);
};

const number = (value: number): CellResult => ({ kind: 'number', value });
const error = (code: FormulaError): CellResult => ({ kind: 'error', error: code });

describe('isFormula', () => {
  it('detects a leading equals sign', () => {
    expect(isFormula('=B2')).toBe(true);
    expect(isFormula('  =SUM(B2:B3)')).toBe(true);
    expect(isFormula('B2')).toBe(false);
    expect(isFormula('')).toBe(false);
  });
});

describe('literalResult', () => {
  it('reads empty, number and text cells', () => {
    expect(literalResult('  ')).toEqual({ kind: 'empty' });
    expect(literalResult('48.6')).toEqual(number(48.6));
    expect(literalResult('-3')).toEqual(number(-3));
    expect(literalResult('23-PT-92531')).toEqual({ kind: 'text', value: '23-PT-92531' });
    expect(literalResult('1e3')).toEqual({ kind: 'text', value: '1e3' });
    expect(literalResult('2026-03-12')).toEqual({ kind: 'text', value: '2026-03-12' });
  });
});

describe('evaluateFormula', () => {
  it('evaluates numbers and arithmetic with precedence', () => {
    expect(evaluateFormula('=1+2*3', lookup)).toEqual(number(7));
    expect(evaluateFormula('=(1+2)*3', lookup)).toEqual(number(9));
    expect(evaluateFormula('=10/4-1', lookup)).toEqual(number(1.5));
    expect(evaluateFormula('=.5+1.', lookup)).toEqual(number(1.5));
  });

  it('handles unary minus and plus', () => {
    expect(evaluateFormula('=-B2+5', lookup)).toEqual(number(-5));
    expect(evaluateFormula('=--3', lookup)).toEqual(number(3));
    expect(evaluateFormula('=+3', lookup)).toEqual(number(3));
  });

  it('reads cell references in any case and with absolute markers', () => {
    expect(evaluateFormula('=B2*1.1', lookup).kind).toBe('number');
    expect(evaluateFormula('=b2+$B$3', lookup)).toEqual(number(30));
  });

  it('accepts a formula without the equals sign and with spaces', () => {
    expect(evaluateFormula(' B2 + B3 ', lookup)).toEqual(number(30));
  });

  it('treats an empty cell as zero in arithmetic', () => {
    expect(evaluateFormula('=B5+1', lookup)).toEqual(number(1));
  });

  it('sums a range, skipping empty and text cells', () => {
    expect(evaluateFormula('=SUM(B2:B6)', lookup)).toEqual(number(110));
    expect(evaluateFormula('=SUM(C2:C6)', lookup)).toEqual(number(6));
  });

  it('averages only the numbers in a range', () => {
    expect(evaluateFormula('=AVERAGE(B2:B6)', lookup)).toEqual(number(27.5));
  });

  it('supports MIN, MAX and COUNT', () => {
    expect(evaluateFormula('=MIN(B2:B6)', lookup)).toEqual(number(10));
    expect(evaluateFormula('=MAX(B2:B6)', lookup)).toEqual(number(50));
    expect(evaluateFormula('=COUNT(B2:B6)', lookup)).toEqual(number(4));
    expect(evaluateFormula('=MIN()', lookup)).toEqual(number(0));
  });

  it('accepts a reversed range, several arguments and function names in lower case', () => {
    expect(evaluateFormula('=sum(B6:B2)', lookup)).toEqual(number(110));
    expect(evaluateFormula('=SUM(B2:B3, 5, B6)', lookup)).toEqual(number(85));
    expect(evaluateFormula('=SUM(B2:C3)', lookup)).toEqual(number(32));
  });

  it('nests functions inside arithmetic', () => {
    expect(evaluateFormula('=SUM(B2:B3)/COUNT(B2:B3)+MAX(1,2)', lookup)).toEqual(number(17));
  });

  it('reports division by zero', () => {
    expect(evaluateFormula('=B2/0', lookup)).toEqual(error('#DIV/0!'));
    expect(evaluateFormula('=B2/C6', lookup)).toEqual(error('#DIV/0!'));
    expect(evaluateFormula('=AVERAGE(A2:A4)', lookup)).toEqual(error('#DIV/0!'));
  });

  it('reports a text cell used as a number', () => {
    expect(evaluateFormula('=A2+1', lookup)).toEqual(error('#VALUE!'));
  });

  it('reports a reference outside the sheet', () => {
    expect(evaluateFormula('=Z99', lookup)).toEqual(error('#REF!'));
    expect(evaluateFormula('=SUM(B2:B99)', lookup)).toEqual(error('#REF!'));
  });

  it('reports an unknown name', () => {
    expect(evaluateFormula('=TOTAL(B2:B6)', lookup)).toEqual(error('#NAME?'));
    expect(evaluateFormula('=limit', lookup)).toEqual(error('#NAME?'));
  });

  it.each(['=', '=1+', '=(1+2', '=1 2', '=SUM(B2:)', '=B2:B3', '=1 # 2', '=)', '=SUM(1,,2)'])('reports a syntax error for %s', (source) => {
    expect(evaluateFormula(source, lookup)).toEqual(error('#ERROR!'));
  });

  it('passes on an error from a referenced cell', () => {
    const failing: CellLookup = () => ({ kind: 'error', error: '#DIV/0!' });
    expect(evaluateFormula('=B2+1', failing)).toEqual(error('#DIV/0!'));
    expect(evaluateFormula('=SUM(B2:B3)', failing)).toEqual(error('#DIV/0!'));
  });

  it('has a reason for every error and lists its functions', () => {
    expect(Object.values(FORMULA_ERROR_REASON).every((reason) => reason.length > 0)).toBe(true);
    expect(FORMULA_FUNCTIONS).toEqual(['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT']);
  });
});

describe('evaluateSheet', () => {
  it('evaluates literals and formulas in place', () => {
    const results = evaluateSheet([
      ['10', '=A1*2'],
      ['', 'text'],
    ]);
    expect(results).toEqual([
      [number(10), number(20)],
      [{ kind: 'empty' }, { kind: 'text', value: 'text' }],
    ]);
  });

  it('follows formulas that refer to formulas, in any order', () => {
    const results = evaluateSheet([['=B1+1', '=C1+1', '5']]);
    expect(results[0]).toEqual([number(7), number(6), number(5)]);
  });

  it('marks a formula that refers to itself', () => {
    expect(evaluateSheet([['=A1+1']])[0][0]).toEqual(error('#CYCLE!'));
  });

  it('marks every cell in a loop and the cells that depend on it', () => {
    const results = evaluateSheet([['=B1', '=A1', '=A1+1', '4']]);
    expect(results[0].slice(0, 3)).toEqual([error('#CYCLE!'), error('#CYCLE!'), error('#CYCLE!')]);
    expect(results[0][3]).toEqual(number(4));
  });

  it('gives #REF! outside ragged rows', () => {
    expect(evaluateSheet([['=B2'], ['1']])[0][0]).toEqual(error('#REF!'));
  });

  it('lets a range function total a column that ends in another formula', () => {
    const results = evaluateSheet([['1'], ['2'], ['=SUM(A1:A2)'], ['=AVERAGE(A1:A3)']]);
    expect(results[2][0]).toEqual(number(3));
    expect(results[3][0]).toEqual(number(2));
  });
});

describe('shiftFormula', () => {
  it('moves relative references down and right', () => {
    expect(shiftFormula('=B2*1.1', 1, 0)).toBe('=B3*1.1');
    expect(shiftFormula('=SUM(B2:B6)+c1', 2, 1)).toBe('=SUM(C4:C8)+D3');
  });

  it('keeps the parts marked absolute', () => {
    expect(shiftFormula('=$B2+B$2+$B$2', 1, 1)).toBe('=$B3+C$2+$B$2');
  });

  it('leaves function names and plain text alone', () => {
    expect(shiftFormula('=MAX(1,2)', 1, 0)).toBe('=MAX(1,2)');
    expect(shiftFormula('B2', 1, 0)).toBe('B2');
  });

  it('turns a reference pushed off the sheet into #REF!', () => {
    expect(shiftFormula('=B1', -1, 0)).toBe('=#REF!');
    expect(evaluateFormula(shiftFormula('=B1', -1, 0), () => null)).toEqual(error('#ERROR!'));
  });
});
