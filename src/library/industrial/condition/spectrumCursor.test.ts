import { INITIAL_SPECTRUM_CURSOR, neighbouringPeak, spectrumCursorReducer } from './spectrumCursor';

const spectrum = [0, 1, 5, 1, 0.5, 3, 0.4, 0.2].map((amplitude, index) => ({ frequencyHz: index * 10, amplitude }));
const run = (state: Parameters<typeof spectrumCursorReducer>[0], action: Parameters<typeof spectrumCursorReducer>[1]) => spectrumCursorReducer(state, action, spectrum);

describe('spectrumCursorReducer', () => {
  it('moves to a line, skipping 0 Hz and clamping to the end', () => {
    expect(run(INITIAL_SPECTRUM_CURSOR, { type: 'moveTo', index: 0 }).index).toBe(1);
    expect(run(INITIAL_SPECTRUM_CURSOR, { type: 'moveTo', index: 99 }).index).toBe(7);
  });

  it('steps from the first line when it has not moved yet', () => {
    expect(run(INITIAL_SPECTRUM_CURSOR, { type: 'step', by: 1 }).index).toBe(2);
    expect(run({ index: 3, fundamentalIndex: null }, { type: 'step', by: -5 }).index).toBe(1);
  });

  it('jumps between peaks', () => {
    expect(run({ index: 1, fundamentalIndex: null }, { type: 'peak', direction: 1 }).index).toBe(2);
    expect(run({ index: 2, fundamentalIndex: null }, { type: 'peak', direction: 1 }).index).toBe(5);
    expect(run({ index: 5, fundamentalIndex: null }, { type: 'peak', direction: -1 }).index).toBe(2);
    expect(run({ index: 5, fundamentalIndex: null }, { type: 'peak', direction: 1 }).index).toBe(5);
  });

  it('goes to the first and last line', () => {
    expect(run({ index: 4, fundamentalIndex: null }, { type: 'first' }).index).toBe(1);
    expect(run({ index: 4, fundamentalIndex: null }, { type: 'last' }).index).toBe(7);
  });

  it('sets, toggles and clears the fundamental', () => {
    const set = run({ index: 2, fundamentalIndex: null }, { type: 'setFundamental' });
    expect(set.fundamentalIndex).toBe(2);
    expect(run(set, { type: 'setFundamental' }).fundamentalIndex).toBeNull();
    expect(run(set, { type: 'setFundamental', index: 5 })).toEqual({ index: 5, fundamentalIndex: 5 });
    expect(run(set, { type: 'clearFundamental' }).fundamentalIndex).toBeNull();
  });

  it('ignores setting a fundamental without a cursor', () => {
    expect(run(INITIAL_SPECTRUM_CURSOR, { type: 'setFundamental' })).toBe(INITIAL_SPECTRUM_CURSOR);
  });

  it('clears the cursor on leave but keeps the family', () => {
    expect(run({ index: 2, fundamentalIndex: 5 }, { type: 'leave' })).toEqual({ index: null, fundamentalIndex: 5 });
  });

  it('does nothing for a spectrum with no lines', () => {
    expect(spectrumCursorReducer(INITIAL_SPECTRUM_CURSOR, { type: 'first' }, [])).toBe(INITIAL_SPECTRUM_CURSOR);
  });

  it('finds the neighbouring peak above a threshold', () => {
    expect(neighbouringPeak(spectrum, 0, 1, 4)).toBe(2);
    expect(neighbouringPeak(spectrum, 2, 1, 4)).toBe(2);
  });
});
