import { fireEvent, render, screen } from '@testing-library/react';

import { SeriesLegend } from './SeriesLegend';

const ITEMS = [
  { id: 'pressure', label: 'Discharge pressure', tone: 'blue', value: '48.6 barg' },
  { id: 'temperature', label: 'Discharge temperature', tone: 'amber', value: '141.2 °C', detail: '23-TT-92532' },
] as const;

describe(SeriesLegend.name, () => {
  it('lists every series with its current value', () => {
    render(<SeriesLegend items={ITEMS} />);

    expect(screen.getByText('Discharge pressure')).toBeInTheDocument();
    expect(screen.getByText('141.2 °C')).toBeInTheDocument();
    expect(screen.getByText('23-TT-92532')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('toggles a series and marks the hidden one', () => {
    const onToggle = vi.fn();
    render(<SeriesLegend items={ITEMS} hidden={['temperature']} onToggle={onToggle} />);

    expect(screen.getByRole('button', { name: /Discharge pressure/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Discharge temperature/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Hidden')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Discharge pressure/ }));
    expect(onToggle).toHaveBeenCalledWith('pressure');
  });
});
