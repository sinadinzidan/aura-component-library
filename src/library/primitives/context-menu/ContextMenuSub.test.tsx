import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ContextMenuItem } from './ContextMenuItem';
import { ContextMenuSub } from './ContextMenuSub';
import { ContextMenuSubContent } from './ContextMenuSubContent';
import { ContextMenuSubTrigger } from './ContextMenuSubTrigger';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuSub.name, () => {
  it('keeps the submenu closed until its trigger is used', async () => {
    renderSubmenu();
    await openContextMenu();

    expect(screen.queryByRole('menuitem', { name: 'Trend view' })).not.toBeInTheDocument();
  });

  it('opens the submenu from its trigger', async () => {
    renderSubmenu();
    await openContextMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to' }));

    expect(await screen.findByRole('menuitem', { name: 'Trend view' })).toBeInTheDocument();
  });
});

function renderSubmenu() {
  return renderContextMenu(
    <ContextMenuSub>
      <ContextMenuSubTrigger>Add to</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Trend view</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  );
}
