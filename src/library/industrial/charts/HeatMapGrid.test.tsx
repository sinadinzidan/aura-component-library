import { render, screen, within } from '@testing-library/react';

import { HeatMapGrid } from './HeatMapGrid';

const ROWS = ['Mon', 'Tue'];
const COLUMNS = ['00', '06', '12', '18'];
const VALUES = [
  [0, 2, 8, 4],
  [1, null, 6, 3],
];

describe(HeatMapGrid.name, () => {
  it('renders a named table with row and column headers', () => {
    render(<HeatMapGrid label="Alarms by weekday and hour" rows={ROWS} columns={COLUMNS} values={VALUES} />);

    const table = screen.getByRole('table', { name: 'Alarms by weekday and hour' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(4);
    expect(within(table).getByRole('rowheader', { name: 'Tue' })).toBeInTheDocument();
  });

  it('maps values to the four heat steps across the data range', () => {
    const { container } = render(<HeatMapGrid label="Alarms" rows={ROWS} columns={COLUMNS} values={VALUES} />);

    const cells = container.querySelectorAll('[data-slot="heat-cell"]');
    expect(cells[0]).toHaveClass('bg-heat-map-mild');
    expect(cells[2]).toHaveClass('bg-heat-map-intense');
    expect(cells[3]).toHaveAttribute('data-level', '2');
  });

  it('uses the given domain instead of the data range', () => {
    const { container } = render(<HeatMapGrid label="Alarms" rows={ROWS} columns={COLUMNS} values={VALUES} domain={[0, 100]} />);

    expect(container.querySelectorAll('[data-level="0"]')).toHaveLength(7);
  });

  it('colours by a derived intensity when given', () => {
    const { container } = render(
      <HeatMapGrid label="Correlation" rows={['a']} columns={['x', 'y']} values={[[-0.9, 0.1]]} domain={[0, 1]} intensityOf={Math.abs} decimals={1} showValues />
    );

    const cells = container.querySelectorAll('[data-slot="heat-cell"]');
    expect(cells[0]).toHaveClass('bg-heat-map-intense');
    expect(cells[0]).toHaveTextContent('\u22120.9');
    expect(cells[1]).toHaveClass('bg-heat-map-mild');
  });

  it('draws cells without data on the neutral surface and says so', () => {
    const { container } = render(<HeatMapGrid label="Alarms" rows={ROWS} columns={COLUMNS} values={VALUES} unit="alarms" />);

    const empty = container.querySelector('[data-level="empty"]');
    expect(empty).toHaveClass('bg-muted-background');
    expect(empty).toHaveAttribute('title', 'Tue, 06: no data');
    expect(empty).toHaveTextContent('No data');
  });

  it('keeps values for screen readers and shows them when asked', () => {
    const { container, rerender } = render(<HeatMapGrid label="Alarms" rows={ROWS} columns={COLUMNS} values={VALUES} />);
    expect(container.querySelector('[data-slot="heat-cell"] span')).toHaveClass('sr-only');

    rerender(<HeatMapGrid label="Alarms" rows={ROWS} columns={COLUMNS} values={VALUES} showValues />);

    expect(container.querySelector('[data-slot="heat-cell"] span')).not.toHaveClass('sr-only');
  });

  it('hides column labels in between when thinned', () => {
    render(<HeatMapGrid label="Alarms" rows={ROWS} columns={COLUMNS} values={VALUES} columnLabelEvery={2} />);

    expect(screen.getByText('00')).not.toHaveClass('sr-only');
    expect(screen.getByText('06')).toHaveClass('sr-only');
  });

  it('adds the colour key and summary', () => {
    render(
      <HeatMapGrid label="Alarms" rows={ROWS} columns={COLUMNS} values={VALUES} legend={{ low: '0', high: '8 per hour' }} summary="Peak at noon." />
    );

    expect(screen.getByText('8 per hour')).toBeInTheDocument();
    expect(screen.getByText('Peak at noon.')).toBeInTheDocument();
  });
});
