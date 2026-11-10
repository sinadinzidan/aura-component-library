import { render, screen } from '@testing-library/react';

import { RoleBadge } from './RoleBadge';

describe(RoleBadge.name, () => {
  it.each([
    ['owner', 'Owner'],
    ['admin', 'Admin'],
    ['editor', 'Editor'],
    ['viewer', 'Viewer'],
    ['guest', 'Guest'],
  ] as const)('labels the %s role', (role, label) => {
    render(<RoleBadge role={role} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('uses a custom label when given', () => {
    render(<RoleBadge role="editor" label="Maintenance planner" />);

    expect(screen.getByText('Maintenance planner')).toBeInTheDocument();
    expect(screen.queryByText('Editor')).not.toBeInTheDocument();
  });

  it('can drop the icon', () => {
    const { container } = render(<RoleBadge role="admin" showIcon={false} />);

    expect(container.querySelector('svg')).toBeNull();
  });
});
