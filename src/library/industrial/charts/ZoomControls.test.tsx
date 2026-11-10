import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ZoomControls } from './ZoomControls';

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);
const HOME = [NOW - 8 * HOUR, NOW] as const;

describe(ZoomControls.name, () => {
  it('halves the span around the centre when zooming in', async () => {
    const onValueChange = vi.fn();
    render(<ZoomControls value={HOME} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    expect(onValueChange).toHaveBeenCalledWith([NOW - 6 * HOUR, NOW - 2 * HOUR]);
  });

  it('doubles the span and stays out of the future when zooming out', async () => {
    const onValueChange = vi.fn();
    render(<ZoomControls value={HOME} onValueChange={onValueChange} bounds={{ max: NOW }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));

    expect(onValueChange).toHaveBeenCalledWith([NOW - 16 * HOUR, NOW]);
  });

  it('keeps the end fixed when anchored there', async () => {
    const onValueChange = vi.fn();
    render(<ZoomControls value={HOME} onValueChange={onValueChange} anchor="end" />);

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    expect(onValueChange).toHaveBeenCalledWith([NOW - 4 * HOUR, NOW]);
  });

  it('disables the buttons at the span limits', () => {
    render(<ZoomControls value={HOME} onValueChange={vi.fn()} bounds={{ minSpanMs: 8 * HOUR, maxSpanMs: 8 * HOUR }} />);

    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
  });

  it('resets to the home window and disables reset when already there', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<ZoomControls value={[NOW - 2 * HOUR, NOW]} onValueChange={onValueChange} home={HOME} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reset zoom' }));
    expect(onValueChange).toHaveBeenCalledWith([NOW - 8 * HOUR, NOW]);

    rerender(<ZoomControls value={HOME} onValueChange={onValueChange} home={HOME} />);
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toBeDisabled();
  });

  it('hides reset without a home window and prints the span when asked', () => {
    render(<ZoomControls value={HOME} onValueChange={vi.fn()} showSpan />);

    expect(screen.queryByRole('button', { name: 'Reset zoom' })).not.toBeInTheDocument();
    expect(screen.getByText('8 h')).toBeInTheDocument();
  });
});
