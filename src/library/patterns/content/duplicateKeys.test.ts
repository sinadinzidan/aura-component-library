import { duplicateKeys } from './duplicateKeys';
import type { KeyValuePair } from './duplicateKeys';

const PAIRS: KeyValuePair[] = [
  { id: 'a', key: 'unit', value: 'barg' },
  { id: 'b', key: 'source', value: 'PI' },
];

describe(duplicateKeys.name, () => {
  it('finds keys used twice, ignoring case and space', () => {
    expect(duplicateKeys([...PAIRS, { id: 'c', key: ' Unit ', value: 'bar' }])).toEqual(['unit']);
  });

  it('ignores blank keys', () => {
    expect(
      duplicateKeys([
        { id: 'a', key: '', value: '' },
        { id: 'b', key: ' ', value: '' },
      ])
    ).toEqual([]);
  });
});
