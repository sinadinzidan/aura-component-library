import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ContextMenu } from './ContextMenu';
import { ContextMenuItem } from './ContextMenuItem';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenu.name, () => {
  it('stays closed until asked for', () => {
    renderContextMenu(<ContextMenuItem>Open asset</ContextMenuItem>);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens on right-click', async () => {
    renderContextMenu(<ContextMenuItem>Open asset</ContextMenuItem>);

    await openContextMenu();

    expect(screen.getByRole('menuitem', { name: 'Open asset' })).toBeInTheDocument();
  });

  it('runs the action and closes when an item is chosen', async () => {
    const onClick = vi.fn();
    renderContextMenu(<ContextMenuItem onClick={onClick}>Open asset</ContextMenuItem>);
    await openContextMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Open asset' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('closes on Escape', async () => {
    renderContextMenu(<ContextMenuItem>Open asset</ContextMenuItem>);
    await openContextMenu();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
});
