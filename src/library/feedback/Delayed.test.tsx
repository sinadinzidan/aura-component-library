import { act, render, screen } from '@testing-library/react';

import { Delayed } from './Delayed';

describe(Delayed.name, () => {
  it('shows nothing before the delay has passed', () => {
    const timer = manualTimer();
    render(
      <Delayed setTimer={timer.set} clearTimer={timer.clear}>
        Loading alarms
      </Delayed>
    );

    expect(screen.queryByText('Loading alarms')).not.toBeInTheDocument();
    expect(timer.set).toHaveBeenCalledWith(expect.any(Function), 300);
  });

  it('shows its children once the delay has passed', () => {
    const timer = manualTimer();
    render(
      <Delayed delayMs={500} setTimer={timer.set} clearTimer={timer.clear}>
        Loading alarms
      </Delayed>
    );

    act(() => timer.fire());

    expect(screen.getByText('Loading alarms')).toBeInTheDocument();
  });

  it('shows its children at once when the delay is zero', () => {
    render(<Delayed delayMs={0}>Loading alarms</Delayed>);

    expect(screen.getByText('Loading alarms')).toBeInTheDocument();
  });

  it('cancels the timer when unmounted early', () => {
    const timer = manualTimer();
    const { unmount } = render(
      <Delayed setTimer={timer.set} clearTimer={timer.clear}>
        Loading alarms
      </Delayed>
    );

    unmount();

    expect(timer.clear).toHaveBeenCalledWith(7);
  });
});

function manualTimer() {
  let pending: (() => void) | null = null;
  return {
    set: vi.fn((callback: () => void, _ms: number) => {
      pending = callback;
      return 7;
    }),
    clear: vi.fn((_handle: number) => {
      pending = null;
    }),
    fire: () => pending?.(),
  };
}
