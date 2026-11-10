import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RowActionsMenu } from './RowActionsMenu';

describe(RowActionsMenu.name, () => {
  it('names the trigger after the row', () => {
    render(<RowActionsMenu label="Actions for WO-104482" actions={[]} />);

    expect(screen.getByRole('button', { name: 'Actions for WO-104482' })).toBeInTheDocument();
  });

  it('keeps the actions out of the page until the menu is opened', () => {
    render(
      <RowActionsMenu label="Actions for WO-104482" actions={[{ id: 'assign', label: 'Assign', onSelect: vi.fn() }]} />
    );

    expect(screen.queryByRole('menuitem', { name: 'Assign' })).not.toBeInTheDocument();
  });

  it('runs the chosen action', async () => {
    const onAssign = vi.fn();
    const onDelete = vi.fn();
    render(
      <RowActionsMenu
        label="Actions for WO-104482"
        actions={[
          { id: 'assign', label: 'Assign', onSelect: onAssign },
          { id: 'delete', label: 'Delete', onSelect: onDelete, destructive: true },
        ]}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Actions for WO-104482' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onAssign).not.toHaveBeenCalled();
  });

  it('does not run a disabled action', async () => {
    const onSelect = vi.fn();
    render(
      <RowActionsMenu
        label="Actions for WO-104482"
        actions={[{ id: 'assign', label: 'Assign', onSelect, disabled: true }]}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Actions for WO-104482' }));
    const item = await screen.findByRole('menuitem', { name: 'Assign' });
    await userEvent.click(item);

    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
