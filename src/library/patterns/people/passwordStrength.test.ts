import { DEFAULT_PASSWORD_RULES, scorePassword } from './passwordStrength';

describe(scorePassword.name, () => {
  it('scores an empty password as empty with no rule met', () => {
    const result = scorePassword('');

    expect(result.score).toBe(0);
    expect(result.level).toBe('empty');
    expect(result.label).toBe('');
    expect(result.valid).toBe(false);
    expect(result.rules.every((rule) => !rule.met)).toBe(true);
  });

  it('scores a short lower-case password as weak', () => {
    const result = scorePassword('pump');

    expect(result.level).toBe('weak');
    expect(result.score).toBe(1);
  });

  it('scores a password that meets some rules as fair', () => {
    const result = scorePassword('Compressor9101');

    expect(result.level).toBe('fair');
    expect(result.score).toBe(2);
    expect(result.valid).toBe(false);
  });

  it('scores a password that meets every rule as good', () => {
    const result = scorePassword('Compressor-91');

    expect(result.level).toBe('good');
    expect(result.score).toBe(3);
    expect(result.valid).toBe(true);
  });

  it('scores a long password that meets every rule as strong', () => {
    const result = scorePassword('Compressor-9101-train-A');

    expect(result.level).toBe('strong');
    expect(result.score).toBe(4);
    expect(result.label).toBe('Strong');
  });

  it('reports each rule separately', () => {
    const result = scorePassword('abcdefghijkl');

    expect(result.rules).toEqual([
      { id: 'length', label: 'At least 12 characters', met: true },
      { id: 'case', label: 'Upper and lower case letters', met: false },
      { id: 'number', label: 'A number', met: false },
      { id: 'symbol', label: 'A symbol', met: false },
    ]);
  });

  it('does not count spaces as symbols', () => {
    const result = scorePassword('Compressor 9101');

    expect(result.rules.find((rule) => rule.id === 'symbol')?.met).toBe(false);
  });

  it('counts accented letters as letters, not symbols', () => {
    const result = scorePassword('Åsgårdåsgård1');

    expect(result.rules.find((rule) => rule.id === 'case')?.met).toBe(true);
    expect(result.rules.find((rule) => rule.id === 'symbol')?.met).toBe(false);
  });

  it('uses custom rules when given', () => {
    const rules = [{ id: 'long', label: 'At least 4 characters', test: (password: string) => password.length >= 4 }];

    expect(scorePassword('pump', rules).valid).toBe(true);
    expect(scorePassword('pum', rules).level).toBe('weak');
  });

  it('ships four default rules', () => {
    expect(DEFAULT_PASSWORD_RULES.map((rule) => rule.id)).toEqual(['length', 'case', 'number', 'symbol']);
  });
});
