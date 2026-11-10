import { render, screen } from '@testing-library/react';

import { SkeletonCard } from './SkeletonCard';

describe(SkeletonCard.name, () => {
  it('renders a title and two body lines by default', () => {
    const { container } = render(<SkeletonCard />);

    expect(container.querySelectorAll('[data-part="title"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-part="line"]')).toHaveLength(2);
    expect(container.querySelector('[data-part="media"]')).toBeNull();
  });

  it('adds a media block when asked', () => {
    const { container } = render(<SkeletonCard media />);

    expect(container.querySelector('[data-part="media"]')).not.toBeNull();
  });

  it('adds action placeholders when asked', () => {
    const { container } = render(<SkeletonCard actions />);

    expect(container.querySelectorAll('[data-part="action"]')).toHaveLength(2);
  });

  it('renders the requested number of lines', () => {
    const { container } = render(<SkeletonCard lines={4} />);

    expect(container.querySelectorAll('[data-part="line"]')).toHaveLength(4);
  });

  it('announces itself as a loading region', () => {
    render(<SkeletonCard label="Loading asset" />);

    expect(screen.getByRole('status', { name: 'Loading asset' })).toBeInTheDocument();
  });
});
