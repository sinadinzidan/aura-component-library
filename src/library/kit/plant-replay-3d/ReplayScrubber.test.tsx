import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ReplayScrubber, type ScrubberLane } from './ReplayScrubber';

const LANES: ScrubberLane[] = [
  { id: 'vibration', label: 'Vibration', valueText: '7.3 mm/s', tone: 'warning', points: [{ t: 0, v: 4 }, { t: 600_000, v: 12 }], domain: [0, 13], limit: 7.1 },
  { id: 'speed', label: 'Shaft speed', valueText: '9,620 rpm', points: [{ t: 0, v: 9600 }, { t: 600_000, v: 0 }], domain: [0, 11000] },
];

const EVENTS = [
  { id: 'alarm', t: 120_000, label: 'High alarm', tone: 'warning' as const },
  { id: 'trip', t: 480_000, label: 'Trip', tone: 'critical' as const },
];

const format = (t: number) => `${t / 60_000} min`;

function renderScrubber(value = 300_000) {
  const onValueChange = vi.fn();
  render(<ReplayScrubber label="Replay time" from={0} to={600_000} value={value} onValueChange={onValueChange} lanes={LANES} events={EVENTS} ticks={[0, 300_000, 600_000]} formatTime={format} />);
  return onValueChange;
}

describe(ReplayScrubber.name, () => {
  it('shows one lane per signal with its reading at the playhead', () => {
    renderScrubber();
    expect(screen.getByText('Vibration')).toBeTruthy();
    expect(screen.getByText('7.3 mm/s')).toBeTruthy();
    expect(screen.getByText('9,620 rpm')).toBeTruthy();
    expect(document.querySelectorAll('[data-slot="scrubber-lane"]')).toHaveLength(2);
  });

  it('exposes the playhead as a slider with the time in words', () => {
    renderScrubber();
    const slider = screen.getByRole('slider', { name: 'Replay time' });
    expect(slider.getAttribute('aria-valuenow')).toBe('300000');
    expect(slider.getAttribute('aria-valuetext')).toBe('5 min');
  });

  it('steps with the arrow keys and jumps with Home and End', () => {
    const onValueChange = renderScrubber();
    const slider = screen.getByRole('slider', { name: 'Replay time' });
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    fireEvent.keyDown(slider, { key: 'PageUp' });
    fireEvent.keyDown(slider, { key: 'Home' });
    fireEvent.keyDown(slider, { key: 'End' });
    expect(onValueChange.mock.calls.map((call) => call[0])).toEqual([360_000, 240_000, 600_000, 0, 600_000]);
  });

  it('does not step past the end', () => {
    const onValueChange = renderScrubber(600_000);
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Replay time' }), { key: 'ArrowRight' });
    expect(onValueChange).toHaveBeenCalledWith(600_000);
  });

  it('jumps to an event when its numbered marker is clicked', () => {
    const onValueChange = renderScrubber();
    fireEvent.click(screen.getByRole('button', { name: 'Jump to Trip, 8 min' }));
    expect(onValueChange).toHaveBeenCalledWith(480_000);
  });

  it('labels the ticks under the lanes', () => {
    renderScrubber();
    expect(screen.getByText('0 min')).toBeTruthy();
    expect(screen.getByText('10 min')).toBeTruthy();
  });
});
