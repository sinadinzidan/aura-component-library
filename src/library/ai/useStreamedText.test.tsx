import { act, renderHook } from '@testing-library/react';

import { useStreamedText } from './useStreamedText';

describe(useStreamedText.name, () => {
  let tick: () => void;
  let setIntervalFn: (handler: () => void, ms: number) => number;
  let clearIntervalFn: (handle: number) => void;

  beforeEach(() => {
    tick = () => assert.fail('No interval is running');
    setIntervalFn = vi.fn((handler: () => void) => {
      tick = handler;
      return 1;
    });
    clearIntervalFn = vi.fn();
  });

  it('starts idle with no text and no timer', () => {
    const { result } = renderHook(() => useStreamedText('Recompressor tripped', { setIntervalFn, clearIntervalFn }));

    expect(result.current.status).toBe('idle');
    expect(result.current.text).toBe('');
    expect(setIntervalFn).not.toHaveBeenCalled();
  });

  it('reveals one chunk per tick while streaming', () => {
    const { result } = renderHook(() => useStreamedText('Recompressor', { chunkSize: 4, setIntervalFn, clearIntervalFn }));

    act(() => result.current.start());
    act(() => tick());

    expect(result.current.status).toBe('streaming');
    expect(result.current.text).toBe('Reco');
  });

  it('finishes and clears the timer when the last character is shown', () => {
    const { result } = renderHook(() => useStreamedText('Trip', { chunkSize: 4, setIntervalFn, clearIntervalFn }));

    act(() => result.current.start());
    act(() => tick());

    expect(result.current.status).toBe('done');
    expect(result.current.text).toBe('Trip');
    expect(clearIntervalFn).toHaveBeenCalledWith(1);
  });

  it('keeps the partial text when stopped', () => {
    const { result } = renderHook(() => useStreamedText('Recompressor', { chunkSize: 4, setIntervalFn, clearIntervalFn }));
    act(() => result.current.start());
    act(() => tick());

    act(() => result.current.stop());

    expect(result.current.status).toBe('stopped');
    expect(result.current.text).toBe('Reco');
  });

  it('can begin part-way through to show a stream caught mid-way', () => {
    const { result } = renderHook(() => useStreamedText('Recompressor', { initialLength: 6, setIntervalFn, clearIntervalFn }));

    expect(result.current.status).toBe('stopped');
    expect(result.current.text).toBe('Recomp');
  });

  it('shows everything at once on finish', () => {
    const { result } = renderHook(() => useStreamedText('Recompressor', { setIntervalFn, clearIntervalFn }));

    act(() => result.current.finish());

    expect(result.current.status).toBe('done');
    expect(result.current.text).toBe('Recompressor');
  });
});
