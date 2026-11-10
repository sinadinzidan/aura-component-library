import { fireEvent, render, screen } from '@testing-library/react';

import { TimeScrubber } from './TimeScrubber';
import type { ScrubberTimers, TimeScrubberProps } from './TimeScrubber';

const SPANS = [
  { id: 'm1', label: 'Lifting 61-TA-201', startHour: 4, endHour: 16 },
  { id: 'm2', label: 'Receipt 61-TA-206', startHour: 46, endHour: 54, lane: 1 },
];

function setup(overrides: Partial<TimeScrubberProps> = {}) {
  const callbacks: (() => void)[] = [];
  const timers: ScrubberTimers = {
    setInterval: vi.fn((callback: () => void) => {
      callbacks.push(callback);
      return callbacks.length;
    }),
    clearInterval: vi.fn(),
  };
  const props: TimeScrubberProps = {
    hour: 10,
    horizon: 72,
    playing: false,
    onSeek: vi.fn(),
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onTick: vi.fn(),
    timeLabel: '13 Mar 00:00',
    timers,
    ...overrides,
  };
  const view = render(<TimeScrubber {...props} />);
  return { props, timers, callbacks, view };
}

describe(TimeScrubber.name, () => {
  it('shows how far ahead the scrubber is and the time in words', () => {
    setup();

    expect(screen.getByText('+10 h')).toBeInTheDocument();
    expect(screen.getByText('13 Mar 00:00')).toBeInTheDocument();
  });

  it('starts playback from the button and runs no timer before that', () => {
    const { props, timers } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Play plan' }));

    expect(props.onPlay).toHaveBeenCalledOnce();
    expect(timers.setInterval).not.toHaveBeenCalled();
  });

  it('ticks on a timer while playing', () => {
    const { props, timers, callbacks } = setup({ playing: true, stepMs: 200 });

    callbacks[0]();
    callbacks[0]();

    expect(timers.setInterval).toHaveBeenCalledWith(expect.any(Function), 200);
    expect(props.onTick).toHaveBeenCalledTimes(2);
  });

  it('pauses from the button', () => {
    const { props } = setup({ playing: true });

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    expect(props.onPause).toHaveBeenCalledOnce();
  });

  it('clears the timer when playback stops', () => {
    const { props, timers, view } = setup({ playing: true });

    view.rerender(<TimeScrubber {...props} playing={false} />);

    expect(timers.clearInterval).toHaveBeenCalledWith(1);
  });

  it('clears the timer on unmount', () => {
    const { timers, view } = setup({ playing: true });

    view.unmount();

    expect(timers.clearInterval).toHaveBeenCalledWith(1);
  });

  it('offers a replay at the end of the window', () => {
    setup({ hour: 72 });

    expect(screen.getByRole('button', { name: 'Replay plan' })).toBeInTheDocument();
  });

  it('describes each span with its window and state', () => {
    setup({ spans: SPANS });

    expect(screen.getByRole('img', { name: 'Lifting 61-TA-201, +4 h to +16 h, active' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Receipt 61-TA-206, +46 h to +54 h, planned' })).toBeInTheDocument();
  });

  it('marks a finished span as done', () => {
    setup({ spans: SPANS, hour: 20 });

    expect(screen.getByRole('img', { name: /Lifting 61-TA-201.*done/ })).toHaveAttribute('data-state', 'done');
  });

  it('makes spans buttons when they can be selected', () => {
    const onSelectSpan = vi.fn();
    setup({ spans: SPANS, onSelectSpan });

    fireEvent.click(screen.getByRole('button', { name: /Receipt 61-TA-206/ }));

    expect(onSelectSpan).toHaveBeenCalledWith('m2');
  });

  it('places tick labels and extra actions', () => {
    setup({ ticks: [{ hour: 0, label: 'Now' }, { hour: 72, label: '+72 h' }], actions: <span>Speed 1×</span> });

    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('+72 h')).toBeInTheDocument();
    expect(screen.getByText('Speed 1×')).toBeInTheDocument();
  });
});
