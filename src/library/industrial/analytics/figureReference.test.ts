import { figureReference } from './figureReference';

describe(figureReference.name, () => {
  it('builds the reference used in running text', () => {
    expect(figureReference(3)).toBe('Figure 3');
    expect(figureReference('A1', 'Table')).toBe('Table A1');
  });
});
