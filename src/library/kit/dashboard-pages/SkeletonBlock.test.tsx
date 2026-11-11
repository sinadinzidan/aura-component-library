import { render, screen } from '@testing-library/react';

import { SkeletonBlock } from './SkeletonBlock';

describe(SkeletonBlock.name, () => {
  it('announces what is loading', () => {
    render(<SkeletonBlock label="Loading gas export" shape="stat" />);

    expect(screen.getByRole('status', { name: 'Loading gas export' })).toHaveAttribute('data-shape', 'stat');
  });

  it('draws the requested number of rows', () => {
    const { container } = render(<SkeletonBlock label="Loading alarms" shape="rows" count={3} />);

    expect(container.querySelectorAll('.dash-skeleton-row')).toHaveLength(3);
  });

  it('keeps a fixed chart height and the requested bars', () => {
    const { container } = render(<SkeletonBlock label="Loading trend" shape="chart" count={6} height={180} animate={false} />);

    const block = screen.getByRole('status');
    expect(block).toHaveStyle({ height: '180px' });
    expect(block).toHaveAttribute('data-animate', 'false');
    expect(container.querySelectorAll('.dash-bone')).toHaveLength(6);
  });
});
