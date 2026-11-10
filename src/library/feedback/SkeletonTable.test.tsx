import { render, screen } from '@testing-library/react';

import { SkeletonTable } from './SkeletonTable';

describe(SkeletonTable.name, () => {
  it('renders one placeholder row per requested row', () => {
    const { container } = render(<SkeletonTable rows={3} columns={4} />);

    expect(container.querySelectorAll('[data-slot="skeleton-row"]')).toHaveLength(3);
  });

  it('renders a cell for every column in every row', () => {
    const { container } = render(<SkeletonTable rows={2} columns={['Tag', 'Name', 'State']} />);

    expect(container.querySelectorAll('[data-slot="skeleton-row"] [data-slot="skeleton"]')).toHaveLength(6);
  });

  it('shows real headers when they are known', () => {
    render(<SkeletonTable columns={['Tag', 'Name']} />);

    expect(screen.getByText('Tag')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('uses placeholder headers when only a column count is given', () => {
    const { container } = render(<SkeletonTable rows={1} columns={3} />);

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(6);
  });

  it('announces itself as a loading region', () => {
    render(<SkeletonTable columns={2} label="Loading alarms" />);

    expect(screen.getByRole('status', { name: 'Loading alarms' })).toBeInTheDocument();
  });
});
