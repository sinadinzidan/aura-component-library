import { checkPassword } from './passwordRules';

describe(checkPassword.name, () => {
  it('meets nothing for an empty password', () => {
    expect(checkPassword('').every((rule) => !rule.met)).toBe(true);
  });

  it('reports each rule on its own', () => {
    const met = (password: string) =>
      checkPassword(password)
        .filter((rule) => rule.met)
        .map((rule) => rule.id);

    expect(met('abcdefghijkl')).toEqual(['length']);
    expect(met('Abc1')).toEqual(['case', 'digit']);
    expect(met('Nordkapp-2026#')).toEqual(['length', 'case', 'digit', 'symbol']);
  });
});
