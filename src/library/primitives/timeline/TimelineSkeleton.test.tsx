import { render, screen } from '@testing-library/react';

import { TimelineSkeleton } from './TimelineSkeleton';

describe(TimelineSkeleton.name, () => {
  it('announces loading by name', () => {
    render(<TimelineSkeleton label="Loading incident timeline" />);

    expect(screen.getByRole('status', { name: 'Loading incident timeline' })).toBeInTheDocument();
  });

  it('renders the requested number of placeholder events', () => {
    const { container } = render(<TimelineSkeleton items={3} />);

    expect(container.querySelector('[data-slot="timeline-skeleton"]')?.children).toHaveLength(3);
  });
});
