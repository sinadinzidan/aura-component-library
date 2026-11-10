import { render, screen } from '@testing-library/react';

import { SkeletonText } from './SkeletonText';

describe(SkeletonText.name, () => {
  it('renders one bar per line', () => {
    const { container } = render(<SkeletonText lines={4} />);

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
  });

  it('makes the last line shorter than the others', () => {
    const { container } = render(<SkeletonText lines={3} />);

    const bars = container.querySelectorAll('[data-slot="skeleton"]');
    expect(bars[0]).toHaveClass('w-full');
    expect(bars[2]).toHaveClass('w-3/5');
  });

  it('announces itself as a loading region', () => {
    render(<SkeletonText label="Loading description" />);

    expect(screen.getByRole('status', { name: 'Loading description' })).toBeInTheDocument();
  });

  it('has no role when the label is null', () => {
    render(<SkeletonText label={null} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
