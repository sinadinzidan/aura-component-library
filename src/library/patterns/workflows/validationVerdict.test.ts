import { validationVerdict } from './validationVerdict';

const ROWS = { one: 'row', other: 'rows' };

describe(validationVerdict.name, () => {
  it('says errors block those rows', () => {
    expect(validationVerdict({ valid: 1200, warnings: 3, errors: 12 }, ROWS)).toBe('12 rows cannot be imported until fixed or skipped.');
  });

  it('uses the singular for one row', () => {
    expect(validationVerdict({ valid: 5, warnings: 0, errors: 1 }, ROWS)).toBe('1 row cannot be imported until fixed or skipped.');
  });

  it('says warnings do not block', () => {
    expect(validationVerdict({ valid: 10, warnings: 2, errors: 0 }, ROWS)).toBe('Every row can be imported. 2 rows will be imported with a warning.');
  });

  it('says when everything is ready', () => {
    expect(validationVerdict({ valid: 1284, warnings: 0, errors: 0 }, ROWS)).toBe('All 1,284 rows are ready to import.');
  });

  it('handles an empty file', () => {
    expect(validationVerdict({ valid: 0, warnings: 0, errors: 0 }, ROWS)).toBe('No rows to check.');
  });
});
