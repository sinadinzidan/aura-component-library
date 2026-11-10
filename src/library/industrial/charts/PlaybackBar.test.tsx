import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlaybackBar } from './PlaybackBar';
import type { PlaybackBarProps, PlaybackTimers } from './PlaybackBar';

const MINUTE = 60_000;
const FROM = Date.UTC(2026, 2, 12, 6, 0, 0);
const TO = FROM + 60 * MINUTE;

function setup(overrides: Partial<PlaybackBarProps> = {}) {
  let tick: (() => void) | undefined;
  const timers: PlaybackTimers = {
    setInterval: vi.fn((callback: () => void) => {
      tick = callback;
      return 1;
    }),
    clearInterval: vi.fn(),
  };
  const props: PlaybackBarProps = {
    from: FROM,
    to: TO,
    value: FROM,
    onValueChange: vi.fn(),
    playing: false,
    onPlayingChange: vi.fn(),
    speed: 1,
    onSpeedChange: vi.fn(),
    stepMs: 10 * MINUTE,
    timers,
    ...overrides,
  };
  const { container } = render(<PlaybackBar {...props} />);
  return { props, timers, container, tick: () => tick?.() };
}

describe(PlaybackBar.name, () => {
  it('shows the position, the end and a named scrubber', () => {
    const { container } = setup();

    expect(screen.getByText('12 Mar, 06:00')).toBeInTheDocument();
    expect(screen.getByText('12 Mar, 07:00')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Playback position' })).toBeInTheDocument();
    expect(container.querySelectorAll('input[type="range"]')).toHaveLength(1);
  });

  it('asks to play when paused and to pause when playing', async () => {
    const { props } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(props.onPlayingChange).toHaveBeenCalledWith(true);
  });

  it('does not start a timer while paused', () => {
    const { timers } = setup();

    expect(timers.setInterval).not.toHaveBeenCalled();
  });

  it('advances by step times speed on each tick while playing', () => {
    const { props, tick } = setup({ playing: true, speed: 2 });

    tick();

    expect(props.onValueChange).toHaveBeenCalledWith(FROM + 20 * MINUTE);
    expect(props.onPlayingChange).not.toHaveBeenCalled();
  });

  it('stops itself at the end', () => {
    const { props, tick } = setup({ playing: true, value: TO - 5 * MINUTE });

    tick();

    expect(props.onValueChange).toHaveBeenCalledWith(TO);
    expect(props.onPlayingChange).toHaveBeenCalledWith(false);
  });

  it('restarts from the beginning when play is pressed at the end', async () => {
    const { props } = setup({ value: TO });

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));

    expect(props.onValueChange).toHaveBeenCalledWith(FROM);
    expect(props.onPlayingChange).toHaveBeenCalledWith(true);
  });

  it('jumps to either end', async () => {
    const { props } = setup({ value: FROM + 30 * MINUTE });

    await userEvent.click(screen.getByRole('button', { name: 'Go to start' }));
    await userEvent.click(screen.getByRole('button', { name: 'Go to end' }));

    expect(props.onValueChange).toHaveBeenNthCalledWith(1, FROM);
    expect(props.onValueChange).toHaveBeenNthCalledWith(2, TO);
  });

  it('cycles to the next speed', async () => {
    const { props } = setup({ speed: 2 });

    await userEvent.click(screen.getByRole('button', { name: 'Playback speed 2×, change' }));

    expect(props.onSpeedChange).toHaveBeenCalledWith(4);
  });
});
