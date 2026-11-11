import { act, renderHook } from '@testing-library/react';

import { useViewportFlight } from './useViewportFlight';

const SIZE = { width: 800, height: 400 };
const FROM = { x: 0, y: 0, k: 1 };
const TO = { x: 300, y: 100, k: 2 };

describe(useViewportFlight.name, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('jumps to the target when animation is off', () => {
    const onFrame = vi.fn();
    const { result } = renderHook(() => useViewportFlight(onFrame, { animate: false }));

    act(() => result.current.fly(FROM, TO, SIZE));

    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(onFrame).toHaveBeenCalledWith(TO);
  });

  it('steps through intermediate viewports and lands on the target', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
    const onFrame = vi.fn();
    const { result } = renderHook(() => useViewportFlight(onFrame, { durationMs: 100 }));

    act(() => result.current.fly(FROM, TO, SIZE));
    act(() => frames[0](0));
    act(() => frames[1](50));
    act(() => frames[2](100));

    expect(onFrame).toHaveBeenCalledTimes(3);
    expect(onFrame.mock.calls[1][0].k).toBeGreaterThan(1);
    expect(onFrame.mock.calls[1][0].k).toBeLessThan(2);
    expect(onFrame.mock.calls[2][0]).toBe(TO);
    expect(frames).toHaveLength(3);
  });

  it('cancels a flight in progress', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 7);
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const { result, unmount } = renderHook(() => useViewportFlight(vi.fn()));

    act(() => result.current.fly(FROM, TO, SIZE));
    act(() => result.current.cancel());
    unmount();

    expect(cancelFrame).toHaveBeenCalledWith(7);
  });
});
