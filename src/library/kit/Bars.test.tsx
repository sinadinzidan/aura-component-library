import { render, screen } from '@testing-library/react';

import { Bars } from './Bars';

const DAYS = ['Tue', 'Wed', 'Thu'];

describe(Bars.name, () => {
  it('names the plot', () => {
    render(<Bars label="Export per day" categories={DAYS} series={[{ id: 'export', label: 'Export', values: [4.4, 4.2, 4.38] }]} />);

    expect(screen.getByRole('img', { name: 'Export per day' })).toBeInTheDocument();
  });

  it('shows a legend when there are several series', () => {
    render(
      <Bars
        label="Work hours"
        categories={DAYS}
        stacked
        series={[
          { id: 'planned', label: 'Planned', values: [24, 20, 18] },
          { id: 'unplanned', label: 'Unplanned', values: [3, 9, 14] },
        ]}
      />
    );

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Planned', 'Unplanned']);
  });

  it('has no legend for a single series', () => {
    render(<Bars label="Export per day" orientation="horizontal" categories={DAYS} series={[{ id: 'export', label: 'Export', values: [4.4, 4.2, 4.38] }]} />);

    expect(screen.queryByRole('list')).toBeNull();
  });
});
