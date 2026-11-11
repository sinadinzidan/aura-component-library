import { toCode } from './toCode';

describe(toCode.name, () => {
  it('keeps digits only and cuts to the length', () => {
    expect(toCode('12 34-56 78', 6)).toBe('123456');
    expect(toCode('ab', 6)).toBe('');
  });
});
