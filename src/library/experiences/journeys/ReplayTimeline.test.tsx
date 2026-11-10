import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReplayTimeline } from './ReplayTimeline';
import type { ReplayTimelineProps, ReplayTimers } from './ReplayTimeline';

const MINUTE = 60_000;
const FROM = Date.UTC(2026, 2, 12, 13, 0, 0);
const TO = FROM + 60 * MINUTE;
const formatTime = (timestamp: number): string => new Date(timestamp).toISOString().slice(11, 16);

function setup(overrides: Partial<ReplayTimelineProps> = {}) {
  let tick: (() => void) | undefined;
  const timers: ReplayTimers = {
    setInterval: vi.fn((callback: () => void) => {
      tick = callback;
      return 7;
    }),
    clearInterval: vi.fn(),
  };
  const props: ReplayTimelineProps = {
    from: FROM,
    to: TO,
    value: FROM + 30 * MINUTE,
    onValueChange: vi.fn(),
    playing: false,
    onPlayingChange: vi.fn(),
    markers: [
      { id: 'warning', t: FROM + 22 * MINUTE, label: 'First warning', tone: 'info' },
      { id: 'trip', t: FROM + 46 * MINUTE, label: 'Trip', tone: 'critical' },
    ],
    stepMs: MINUTE,
    stepLabel: '1 min',
    ticks: [FROM, FROM + 30 * MINUTE, TO],
    formatTime,
    label: 'Replay of the trip',
    timers,
    ...overrides,
  };
  const view = render(<ReplayTimeline {...props} />);
  return { props, timers, tick: () => tick?.(), ...view };
}

describe(ReplayTimeline.name, () => {
  it('shows the position, the markers and one scrubber', () => {
    const { container } = setup();

    expect(screen.getByRole('group', { name: 'Replay of the trip' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="replay-position"]')).toHaveTextContent('13:30 of 14:00');
    expect(container.querySelectorAll('input[type="range"]')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Go to 13:46, Trip' })).toBeInTheDocument();
  });

  it('places the playhead and marks which events were reached', () => {
    const { container } = setup();

    expect(container.querySelector('[data-slot="replay-playhead"]')).toHaveStyle({ left: '50%' });
    const reached = [...container.querySelectorAll('[data-slot="replay-marker"]')].map((node) => node.getAttribute('data-reached'));
    expect(reached).toEqual(['true', 'false']);
  });

  it('jumps to an event when its marker is clicked', async () => {
    const { props } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Go to 13:46, Trip' }));

    expect(props.onValueChange).toHaveBeenCalledWith(FROM + 46 * MINUTE);
  });

  it('steps one minute back and forward', async () => {
    const { props } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Step forward 1 min' }));
    await userEvent.click(screen.getByRole('button', { name: 'Step back 1 min' }));

    expect(props.onValueChange).toHaveBeenNthCalledWith(1, FROM + 31 * MINUTE);
    expect(props.onValueChange).toHaveBeenNthCalledWith(2, FROM + 29 * MINUTE);
  });

  it('does not start a timer until Play is pressed', async () => {
    const { props, timers } = setup();
    expect(timers.setInterval).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Play replay' }));

    expect(props.onPlayingChange).toHaveBeenCalledWith(true);
  });

  it('advances one step per tick while playing', () => {
    const { props, tick } = setup({ playing: true });

    tick();

    expect(props.onValueChange).toHaveBeenCalledWith(FROM + 31 * MINUTE);
    expect(props.onPlayingChange).not.toHaveBeenCalled();
  });

  it('stops itself at the end', () => {
    const { props, tick } = setup({ playing: true, value: TO - MINUTE });

    tick();

    expect(props.onValueChange).toHaveBeenCalledWith(TO);
    expect(props.onPlayingChange).toHaveBeenCalledWith(false);
  });

  it('clears the timer when playback stops or the timeline unmounts', () => {
    const { timers, unmount } = setup({ playing: true });

    unmount();

    expect(timers.clearInterval).toHaveBeenCalledWith(7);
  });

  it('pauses when the user scrubs during playback', async () => {
    const { props } = setup({ playing: true });

    await userEvent.click(screen.getByRole('button', { name: 'Step back 1 min' }));

    expect(props.onPlayingChange).toHaveBeenCalledWith(false);
  });

  it('offers to replay from the start at the end', async () => {
    const { props } = setup({ value: TO });

    expect(screen.getByRole('button', { name: 'Step forward 1 min' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Replay from start' }));

    expect(props.onValueChange).toHaveBeenCalledWith(FROM);
    expect(props.onPlayingChange).toHaveBeenCalledWith(true);
  });

  it('disables stepping back at the start', () => {
    setup({ value: FROM });

    expect(screen.getByRole('button', { name: 'Step back 1 min' })).toBeDisabled();
    expect(screen.getByText(/start of replay/)).toBeInTheDocument();
  });
});
