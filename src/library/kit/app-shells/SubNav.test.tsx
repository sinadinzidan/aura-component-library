import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SubNav, type SubNavGroup } from './SubNav';

const GROUPS: SubNavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'general', label: 'General', hint: 'Name and site' },
      { id: 'alarms', label: 'Alarms', count: '4', tone: 'critical' },
    ],
  },
];

describe(SubNav.name, () => {
  it('lists the items under their group and marks the current one', () => {
    render(<SubNav label="Settings sections" groups={GROUPS} current="alarms" />);

    expect(screen.getByRole('navigation', { name: 'Settings sections' })).toHaveTextContent('Workspace');
    expect(screen.getByRole('button', { name: /Alarms/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /General/ })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Name and site')).toBeInTheDocument();
    expect(screen.getByText('4')).toHaveAttribute('data-tone', 'critical');
  });

  it('reports the selected id', async () => {
    const onSelect = vi.fn();
    render(<SubNav label="Settings sections" groups={GROUPS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /General/ }));

    expect(onSelect).toHaveBeenCalledWith('general');
  });
});
