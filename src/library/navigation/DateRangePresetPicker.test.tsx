import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DateRangePresetPicker } from './DateRangePresetPicker';

const NOW = new Date(2026, 2, 12, 14, 0, 0);

describe(DateRangePresetPicker.name, () => {
  it('applies a preset that ends today and counts today', async () => {
    const onChange = vi.fn();
    render(<DateRangePresetPicker value={[null, null]} onChange={onChange} now={NOW} />);

    await userEvent.click(screen.getByRole('button', { name: 'Last 7 days' }));

    expect(onChange).toHaveBeenCalledWith([new Date(2026, 2, 6), new Date(2026, 2, 12)]);
  });

  it('crosses month boundaries', async () => {
    const onChange = vi.fn();
    render(<DateRangePresetPicker value={[null, null]} onChange={onChange} now={NOW} />);

    await userEvent.click(screen.getByRole('button', { name: 'Last 30 days' }));

    expect(onChange).toHaveBeenCalledWith([new Date(2026, 1, 11), new Date(2026, 2, 12)]);
  });

  it('shows the preset that matches the current range as pressed', () => {
    render(
      <DateRangePresetPicker value={[new Date(2026, 2, 6), new Date(2026, 2, 12, 9, 30)]} onChange={vi.fn()} now={NOW} />
    );

    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Last 30 days' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('presses no preset for a custom range', () => {
    render(
      <DateRangePresetPicker value={[new Date(2026, 2, 2), new Date(2026, 2, 5)]} onChange={vi.fn()} now={NOW} />
    );

    for (const button of screen.getAllByRole('button', { pressed: false })) {
      expect(button).toHaveAttribute('aria-pressed', 'false');
    }
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument();
  });

  it('takes its own presets', async () => {
    const onChange = vi.fn();
    render(
      <DateRangePresetPicker
        value={[null, null]}
        onChange={onChange}
        now={NOW}
        presets={[{ id: '14d', label: '14 d', name: 'Last 14 days', days: 14 }]}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Last 14 days' }));

    expect(onChange).toHaveBeenCalledWith([new Date(2026, 1, 27), new Date(2026, 2, 12)]);
  });
});
