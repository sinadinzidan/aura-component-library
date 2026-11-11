import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

describe('source file names', () => {
  it('never differ only by letter case, which breaks case-insensitive file systems', () => {
    const files = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
      .split('\n')
      .filter((file) => file.length > 0);

    const byLowerCase = new Map<string, string[]>();
    for (const file of files) {
      const key = file.toLowerCase();
      byLowerCase.set(key, [...(byLowerCase.get(key) ?? []), file]);
    }
    const collisions = [...byLowerCase.values()].filter((group) => group.length > 1);

    expect(collisions).toEqual([]);
  });

  it('never has two modules in one folder that differ only by case once the extension is dropped', () => {
    const files = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
      .split('\n')
      .filter((file) => /\.(ts|tsx)$/.test(file) && !/\.test\.tsx?$/.test(file));

    const byLowerCase = new Map<string, string[]>();
    for (const file of files) {
      const key = file.replace(/\.(ts|tsx)$/, '').toLowerCase();
      byLowerCase.set(key, [...(byLowerCase.get(key) ?? []), file]);
    }
    const collisions = [...byLowerCase.values()].filter((group) => group.length > 1);

    expect(collisions).toEqual([]);
  });
});
