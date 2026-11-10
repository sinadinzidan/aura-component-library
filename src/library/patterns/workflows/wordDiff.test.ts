import { diffStats, wordDiff } from './wordDiff';

describe(wordDiff.name, () => {
  it('returns one unchanged run for identical text', () => {
    expect(wordDiff('Isolate the pump', 'Isolate the pump')).toEqual([{ type: 'same', text: 'Isolate the pump' }]);
  });

  it('marks a replaced word as removed then added', () => {
    expect(wordDiff('Trip at 55 barg', 'Trip at 53 barg')).toEqual([
      { type: 'same', text: 'Trip at' },
      { type: 'removed', text: '55' },
      { type: 'added', text: '53' },
      { type: 'same', text: 'barg' },
    ]);
  });

  it('marks words added at the end', () => {
    expect(wordDiff('Close the valve', 'Close the valve and lock it')).toEqual([
      { type: 'same', text: 'Close the valve' },
      { type: 'added', text: 'and lock it' },
    ]);
  });

  it('marks words removed from the start', () => {
    expect(wordDiff('Always confirm isolation', 'confirm isolation')).toEqual([
      { type: 'removed', text: 'Always' },
      { type: 'same', text: 'confirm isolation' },
    ]);
  });

  it('joins neighbouring changes into one run', () => {
    expect(wordDiff('a b c d', 'a x y d')).toEqual([
      { type: 'same', text: 'a' },
      { type: 'removed', text: 'b c' },
      { type: 'added', text: 'x y' },
      { type: 'same', text: 'd' },
    ]);
  });

  it('ignores differences in whitespace', () => {
    expect(wordDiff('Close  the\nvalve', 'Close the valve')).toEqual([{ type: 'same', text: 'Close the valve' }]);
  });

  it('handles empty text on either side', () => {
    expect(wordDiff('', 'New step')).toEqual([{ type: 'added', text: 'New step' }]);
    expect(wordDiff('Old step', '')).toEqual([{ type: 'removed', text: 'Old step' }]);
    expect(wordDiff('', '')).toEqual([]);
  });
});

describe(diffStats.name, () => {
  it('counts added and removed words', () => {
    expect(diffStats(wordDiff('a b c d', 'a x y z d'))).toEqual({ added: 3, removed: 2 });
  });

  it('is zero for identical text', () => {
    expect(diffStats(wordDiff('same', 'same'))).toEqual({ added: 0, removed: 0 });
  });
});
