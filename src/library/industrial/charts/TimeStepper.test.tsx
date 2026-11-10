import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TimeStepper } from './TimeStepper';

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);

describe(TimeStepper.name, () => {
  it('writes out the current window', () => {
    render(<TimeStepper value={[NOW - 8 * HOUR, NOW]} onValueChange={vi.fn()} />);

    expect(screen.getByText('12 Mar, 06:00 – 14:00')).toBeInTheDocument();
  });

  it('steps back by the window length', async () => {
    const onValueChange = vi.fn();
    render(<TimeStepper value={[NOW - 8 * HOUR, NOW]} onValueChange={onValueChange} bounds={{ max: NOW }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Back 8 h' }));

    expect(onValueChange).toHaveBeenCalledWith([NOW - 16 * HOUR, NOW - 8 * HOUR]);
  });

  it('steps forward when the window is in the past', async () => {
    const onValueChange = vi.fn();
    render(<TimeStepper value={[NOW - 16 * HOUR, NOW - 8 * HOUR]} onValueChange={onValueChange} bounds={{ max: NOW }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Forward 8 h' }));

    expect(onValueChange).toHaveBeenCalledWith([NOW - 8 * HOUR, NOW]);
  });

  it('disables forward at the latest data', () => {
    render(<TimeStepper value={[NOW - 8 * HOUR, NOW]} onValueChange={vi.fn()} bounds={{ max: NOW }} />);

    expect(screen.getByRole('button', { name: 'Forward 8 h' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back 8 h' })).toBeEnabled();
  });

  it('steps by a fraction of the window when asked', () => {
    render(<TimeStepper value={[NOW - 8 * HOUR, NOW]} onValueChange={vi.fn()} fraction={0.5} />);

    expect(screen.getByRole('button', { name: 'Back 4 h' })).toBeInTheDocument();
  });

  it('jumps back to the latest window', async () => {
    const onValueChange = vi.fn();
    render(<TimeStepper showLatest value={[NOW - 32 * HOUR, NOW - 24 * HOUR]} onValueChange={onValueChange} bounds={{ max: NOW }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Latest' }));

    expect(onValueChange).toHaveBeenCalledWith([NOW - 8 * HOUR, NOW]);
  });

  it('disables the latest button when already there', () => {
    render(<TimeStepper showLatest value={[NOW - 8 * HOUR, NOW]} onValueChange={vi.fn()} bounds={{ max: NOW }} />);

    expect(screen.getByRole('button', { name: 'Latest' })).toBeDisabled();
  });
});
