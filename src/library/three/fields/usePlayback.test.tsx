import { act, renderHook } from '@testing-library/react';

import { advanceValue, usePlayback } from './usePlayback';
import type { FrameScheduler } from './usePlayback';

type Fake = FrameScheduler & { step: (timestamp: number) => void; pending: () => number };

function fakeScheduler(): Fake {
  const callbacks = new Map<number, (timestamp: number) => void>();
  let next = 1;
  return {
    request: (callback) => {
      callbacks.set(next, callback);
      return next++;
    },
    cancel: (id) => {
      callbacks.delete(id);
    },
    step: (timestamp) => {
      const entries = [...callbacks.entries()];
      callbacks.clear();
      for (const [, callback] of entries) callback(timestamp);
    },
    pending: () => callbacks.size,
  };
}

describe(advanceValue.name, () => {
  it('adds rate times elapsed seconds', () => {
    expect(advanceValue(10, 4, 250, 100)).toEqual({ value: 11, ended: false });
  });

  it('stops at the maximum and says so', () => {
    expect(advanceValue(99, 10, 200, 100)).toEqual({ value: 100, ended: true });
  });

  it('caps a long gap so a stalled tab does not jump', () => {
    expect(advanceValue(0, 10, 60_000, 1000, 250).value).toBe(2.5);
  });

  it('ignores negative time and never goes below zero', () => {
    expect(advanceValue(5, 10, -100, 100).value).toBe(5);
    expect(advanceValue(1, -10, 200, 100).value).toBe(0);
  });
});

describe(usePlayback.name, () => {
  const setup = (running: boolean, value = 0) => {
    const scheduler = fakeScheduler();
    const onValue = vi.fn();
    const onEnd = vi.fn();
    const hook = renderHook((props: { running: boolean }) => usePlayback({ running: props.running, rate: 10, value, max: 3, onValue, onEnd, scheduler }), { initialProps: { running } });
    return { scheduler, onValue, onEnd, hook };
  };

  it('does nothing while not running', () => {
    const { scheduler, onValue } = setup(false);

    expect(scheduler.pending()).toBe(0);
    expect(onValue).not.toHaveBeenCalled();
  });

  it('advances the value every frame once running', () => {
    const { scheduler, onValue } = setup(true);
    act(() => scheduler.step(1000));
    act(() => scheduler.step(1100));

    expect(onValue).toHaveBeenNthCalledWith(1, 0);
    expect(onValue).toHaveBeenNthCalledWith(2, 1);
  });

  it('ends by itself at the maximum and schedules no more frames', () => {
    const { scheduler, onEnd } = setup(true);
    act(() => scheduler.step(0));
    act(() => scheduler.step(250));
    act(() => scheduler.step(500));
    act(() => scheduler.step(750));

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(scheduler.pending()).toBe(0);
  });

  it('cancels its frame when paused', () => {
    const { scheduler, hook } = setup(true);

    hook.rerender({ running: false });

    expect(scheduler.pending()).toBe(0);
  });

  it('cancels its frame when unmounted', () => {
    const { scheduler, hook } = setup(true);

    hook.unmount();

    expect(scheduler.pending()).toBe(0);
  });
});
