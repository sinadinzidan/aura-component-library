import { render, screen } from '@testing-library/react';

import { TrendLine } from './TrendLine';

const LABELS = ['10:00', '11:00', '12:00', '13:00'];
const SERIES = [
  { id: 'today', label: 'Today', values: [4.2, 4.3, 4.1, 4.38] },
  { id: 'yesterday', label: 'Yesterday', values: [4.1, 4.2, 4.2, 4.21], dashed: true },
];

describe(TrendLine.name, () => {
  it('names the plot', () => {
    render(<TrendLine label="Gas export against plan" labels={LABELS} series={SERIES} />);

    expect(screen.getByRole('img', { name: 'Gas export against plan' })).toBeInTheDocument();
  });

  it('lists every series and limit in the legend', () => {
    render(<TrendLine label="Gas export" labels={LABELS} series={SERIES} limits={[{ value: 4.5, label: 'Plan' }]} />);

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Today', 'Yesterday', 'Plan']);
  });

  it('hides the legend for a single series unless asked', () => {
    const { rerender } = render(<TrendLine label="Gas export" labels={LABELS} series={SERIES.slice(0, 1)} />);
    expect(screen.queryByRole('list')).toBeNull();

    rerender(<TrendLine label="Gas export" labels={LABELS} series={SERIES.slice(0, 1)} showLegend />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('shows headline and notes', () => {
    render(<TrendLine label="Gas export" labels={LABELS} series={SERIES} headline="4.38 now" notes="Dip after the trip." />);

    expect(screen.getByText('4.38 now')).toBeInTheDocument();
    expect(screen.getByText('Dip after the trip.')).toBeInTheDocument();
  });
});
