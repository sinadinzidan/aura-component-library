import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RoleSelect } from './RoleSelect';

const ROLES = [
  { value: 'viewer', label: 'Viewer', description: 'Read data and dashboards' },
  { value: 'editor', label: 'Editor', description: 'Create and change content' },
  { value: 'admin', label: 'Admin', description: 'Manage members and settings' },
];

describe(RoleSelect.name, () => {
  it('shows the current role on a named trigger', () => {
    render(<RoleSelect roles={ROLES} value="editor" onValueChange={vi.fn()} label="Role for Aisha Khan" />);

    expect(screen.getByRole('combobox', { name: 'Role for Aisha Khan' })).toHaveTextContent('Editor');
  });

  it('lists every role with what it can do', async () => {
    render(<RoleSelect roles={ROLES} value="editor" onValueChange={vi.fn()} label="Role for Aisha Khan" />);

    await userEvent.click(screen.getByRole('combobox'));

    expect(await screen.findByRole('option', { name: /Admin/ })).toHaveTextContent('Manage members and settings');
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('reports the picked role', async () => {
    const onValueChange = vi.fn();
    render(<RoleSelect roles={ROLES} value="editor" onValueChange={onValueChange} label="Role for Aisha Khan" />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: /Viewer/ }));

    expect(onValueChange).toHaveBeenCalledWith('viewer');
  });

  it('replaces the select with locked text and the reason', () => {
    render(
      <TooltipProvider>
        <RoleSelect
          roles={ROLES}
          value="admin"
          onValueChange={vi.fn()}
          label="Role for Liv Wold"
          lockedReason="You cannot change your own role."
        />
      </TooltipProvider>
    );

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Role for Liv Wold: Admin. You cannot change your own role.' })
    ).toHaveTextContent('Admin');
  });
});
