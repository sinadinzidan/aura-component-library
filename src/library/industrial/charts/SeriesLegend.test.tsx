import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SeriesLegend } from './SeriesLegend';
import type { SeriesLegendItem } from './SeriesLegend';

const ITEMS: readonly SeriesLegendItem[] = [
  { key: 'suction', label: 'Suction pressure', color: 'var(--color-chart-1-450)', value: 12.4, unit: 'barg', decimals: 1 },
  { key: 'discharge', label: 'Discharge pressure', color: 'var(--color-chart-2-450)', mark: 'dashed', value: null },
];

describe(SeriesLegend.name, () => {
  it('lists every series under an accessible name', () => {
    render(<SeriesLegend items={ITEMS} label="Pressures" />);

    const legend = screen.getByRole('list', { name: 'Pressures' });
    expect(legend).toHaveTextContent('Suction pressure');
    expect(legend).toHaveTextContent('Discharge pressure');
  });

  it('prints the current value with its unit and an em dash for no value', () => {
    render(<SeriesLegend items={ITEMS} />);

    expect(screen.getByText('12.4')).toBeInTheDocument();
    expect(screen.getByText('barg')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('draws a dashed swatch for a dashed series', () => {
    const { container } = render(<SeriesLegend items={ITEMS} />);

    const swatches = container.querySelectorAll('[data-slot="series-swatch"]');
    expect(swatches[0]).not.toHaveClass('border-dashed');
    expect(swatches[1]).toHaveClass('border-dashed');
  });

  it('renders plain text entries without onToggle', () => {
    render(<SeriesLegend items={ITEMS} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('reports the toggled key and marks hidden series as not pressed', async () => {
    const onToggle = vi.fn();
    render(<SeriesLegend items={ITEMS} hiddenKeys={['discharge']} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: /Suction pressure/ }));

    expect(onToggle).toHaveBeenCalledWith('suction');
    expect(screen.getByRole('button', { name: /Suction pressure/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Discharge pressure/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('stacks entries in a column when asked', () => {
    render(<SeriesLegend items={ITEMS} orientation="column" />);

    expect(screen.getByRole('list')).toHaveClass('flex-col');
  });
});
