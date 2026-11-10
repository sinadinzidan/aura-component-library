import { validateFile } from './validateFile';

const RULE = { extensions: ['pdf', 'dwg', 'csv'], maxBytes: 100_000_000 } as const;

describe(validateFile.name, () => {
  it('accepts a file of an allowed type within the limit', () => {
    expect(validateFile({ name: 'P&ID rev C.PDF', size: 2_400_000 }, RULE)).toBeNull();
  });

  it('rejects a type that is not allowed and lists what is', () => {
    expect(validateFile({ name: 'historian.bak', size: 10 }, RULE)).toEqual({
      reason: 'type',
      message: 'This file type is not supported. Use PDF, DWG or CSV.',
    });
  });

  it('names a single allowed type without a list', () => {
    expect(validateFile({ name: 'a.txt', size: 10 }, { extensions: ['csv'] })?.message).toBe(
      'This file type is not supported. Use CSV.'
    );
  });

  it('rejects a file over the limit with both sizes', () => {
    expect(validateFile({ name: 'scan.pdf', size: 412_000_000 }, RULE)).toEqual({
      reason: 'size',
      message: 'This file is 412 MB. The limit is 100 MB.',
    });
  });

  it('rejects an empty file', () => {
    expect(validateFile({ name: 'export.csv', size: 0 }, RULE)?.reason).toBe('empty');
  });

  it('reports the type before the size', () => {
    expect(validateFile({ name: 'dump.bak', size: 412_000_000 }, RULE)?.reason).toBe('type');
  });

  it('accepts anything when the rule is open', () => {
    expect(validateFile({ name: 'dump.bak', size: 412_000_000 }, {})).toBeNull();
  });
});
