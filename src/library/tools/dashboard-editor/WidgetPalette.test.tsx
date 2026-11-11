import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WidgetPalette } from './WidgetPalette';

const WIDGETS = [
  { type: 'trend', label: 'Trend chart', description: 'One tag over time.', w: 6, h: 4 },
  { type: 'alarms', label: 'Alarm list', description: 'Open alarms, worst first.', w: 4, h: 4 },
];

describe(WidgetPalette.name, () => {
  it('lists each widget with what it shows and its default size', () => {
    render(<WidgetPalette widgets={WIDGETS} onAdd={vi.fn()} />);

    expect(screen.getByText('Trend chart')).toBeInTheDocument();
    expect(screen.getByText('One tag over time.')).toBeInTheDocument();
    expect(screen.getByText('6 × 4 cells')).toBeInTheDocument();
  });

  it('adds the widget whose button was pressed', async () => {
    const onAdd = vi.fn();
    render(<WidgetPalette widgets={WIDGETS} onAdd={onAdd} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add Alarm list' }));

    expect(onAdd).toHaveBeenCalledWith('alarms');
  });

  it('says how many of a type are already on the dashboard', () => {
    render(<WidgetPalette widgets={WIDGETS} onAdd={vi.fn()} counts={{ trend: 2 }} />);

    expect(screen.getByText('6 × 4 cells · 2 on dashboard')).toBeInTheDocument();
  });

  it('locks every button and gives the reason', () => {
    render(<WidgetPalette widgets={WIDGETS} onAdd={vi.fn()} disabledReason="Only the dashboard owner can add widgets." />);

    expect(screen.getByText('Only the dashboard owner can add widgets.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Trend chart' })).toBeDisabled();
  });
});
