import { render, screen } from '@testing-library/react';

import { SkeletonList } from './SkeletonList';

describe(SkeletonList.name, () => {
  it('renders the requested number of rows', () => {
    const { container } = render(<SkeletonList rows={6} />);

    expect(container.querySelectorAll('[data-slot="skeleton-row"]')).toHaveLength(6);
  });

  it('renders media, title and description for each row by default', () => {
    const { container } = render(<SkeletonList rows={1} />);

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
  });

  it('leaves out media and description when turned off', () => {
    const { container } = render(<SkeletonList rows={1} media={false} description={false} />);

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(1);
  });

  it('adds a trailing block when asked', () => {
    const { container } = render(<SkeletonList rows={1} trailing />);

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
  });

  it('announces itself as a loading region', () => {
    render(<SkeletonList label="Loading work orders" />);

    expect(screen.getByRole('status', { name: 'Loading work orders' })).toBeInTheDocument();
  });
});
