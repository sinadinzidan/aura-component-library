import { render, screen } from '@testing-library/react';

import { DistributionBar } from './DistributionBar';

const SEGMENTS = [
  { id: 'good', label: 'Good', value: 6 },
  { id: 'watch', label: 'Watch', value: 3, tone: 'warning' },
  { id: 'poor', label: 'Poor', value: 1, tone: 'critical' },
] as const;

describe(DistributionBar.name, () => {
  it('describes every segment in its accessible name', () => {
    render(<DistributionBar segments={SEGMENTS} label="Fleet health" />);

    expect(screen.getByRole('img', { name: 'Fleet health: Good 6, Watch 3, Poor 1' })).toBeInTheDocument();
  });

  it('sizes each segment by its share of the total', () => {
    const { container } = render(<DistributionBar segments={SEGMENTS} label="Fleet health" />);

    expect(container.querySelector('[data-segment="good"]')).toHaveStyle({ width: '60%' });
    expect(container.querySelector('[data-segment="poor"]')).toHaveStyle({ width: '10%' });
  });

  it('repeats each segment with count and share in the legend', () => {
    render(<DistributionBar segments={SEGMENTS} label="Fleet health" />);

    expect(screen.getByText('Watch')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('leaves out empty segments from the bar', () => {
    const { container } = render(<DistributionBar segments={[{ id: 'a', label: 'Done', value: 0 }, { id: 'b', label: 'Open', value: 4 }]} label="Tasks" />);

    expect(container.querySelectorAll('[data-slot="distribution-segment"]')).toHaveLength(1);
  });

  it('prefers a category colour over a tone', () => {
    const { container } = render(<DistributionBar segments={[{ id: 'pm', label: 'Preventive', value: 2, colorClass: 'bg-chart-2-450' }]} label="Work type" />);

    expect(container.querySelector('[data-segment="pm"]')).toHaveClass('bg-chart-2-450');
  });

  it('hides the legend when asked', () => {
    render(<DistributionBar segments={SEGMENTS} label="Fleet health" showLegend={false} />);

    expect(screen.queryByText('Watch')).not.toBeInTheDocument();
  });
});
