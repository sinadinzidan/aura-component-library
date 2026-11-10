import { render, screen } from '@testing-library/react';

import { CategoryChart, categoryValues } from './CategoryChart';
import type { CategoryRow, CategorySeries } from './CategoryChart';

const ROWS: readonly CategoryRow[] = [
  { category: '10 Mar', actual: 4.2, plan: 4.5 },
  { category: '11 Mar', actual: 4.6, plan: 4.5 },
];

const SERIES: readonly CategorySeries[] = [
  { key: 'actual', label: 'Gas export' },
  { key: 'plan', label: 'Plan', type: 'step', dashed: true },
];

describe(CategoryChart.name, () => {
  it('exposes the chart as an image named by its label', () => {
    render(<CategoryChart label="Gas export per day against plan" rows={ROWS} series={SERIES} />);

    expect(screen.getByRole('img', { name: 'Gas export per day against plan' })).toBeInTheDocument();
  });

  it('prints the summary and the unit', () => {
    render(<CategoryChart label="Gas export" rows={ROWS} series={SERIES} unit="MSm³" summary="One day above plan." />);

    expect(screen.getByText('MSm³')).toBeInTheDocument();
    expect(screen.getByText('One day above plan.')).toBeInTheDocument();
  });

  it('lists series in the legend except hidden helpers', () => {
    render(
      <CategoryChart
        label="Gas export"
        legend
        rows={ROWS}
        series={[...SERIES, { key: 'helper', label: 'Helper', hideFromLegend: true }]}
      />
    );

    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(legend).toHaveTextContent('Gas export');
    expect(legend).toHaveTextContent('Plan');
    expect(legend).not.toHaveTextContent('Helper');
  });

  it('renders the row layout without the unit header', () => {
    render(<CategoryChart label="Downtime by cause" layout="rows" rows={ROWS} series={SERIES} unit="h" valueLabels />);

    expect(screen.getByRole('img', { name: 'Downtime by cause' })).toBeInTheDocument();
    expect(screen.queryByText('h')).not.toBeInTheDocument();
  });
});

describe(categoryValues.name, () => {
  it('collects plain values', () => {
    expect(categoryValues(ROWS, SERIES)).toEqual([4.2, 4.5, 4.6, 4.5]);
  });

  it('sums stacked bars per row, positives and negatives apart', () => {
    const values = categoryValues(
      [{ category: 'Day', a: 3, b: 4, c: -2 }],
      [
        { key: 'a', label: 'A', stack: 's' },
        { key: 'b', label: 'B', stack: 's' },
        { key: 'c', label: 'C', stack: 's' },
      ]
    );

    expect(values).toEqual([7, -2]);
  });

  it('includes both ends of floating bars and skips gaps and text', () => {
    const values = categoryValues([{ category: 'Loss', span: [60, 85], other: null }], [
      { key: 'span', label: 'Span' },
      { key: 'other', label: 'Other' },
      { key: 'category', label: 'Name' },
    ]);

    expect(values).toEqual([60, 85]);
  });
});
