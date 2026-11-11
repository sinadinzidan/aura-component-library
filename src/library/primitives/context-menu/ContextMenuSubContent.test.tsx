import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ContextMenuItem } from './ContextMenuItem';
import { ContextMenuSub } from './ContextMenuSub';
import { ContextMenuSubContent } from './ContextMenuSubContent';
import { ContextMenuSubTrigger } from './ContextMenuSubTrigger';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuSubContent.name, () => {
  it('renders the submenu as a second menu', async () => {
    renderContextMenu(
      <ContextMenuSub>
        <ContextMenuSubTrigger>Add to</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem>Trend view</ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
    );
    await openContextMenu();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Add to' }));
    await screen.findByRole('menuitem', { name: 'Trend view' });

    expect(screen.getAllByRole('menu')).toHaveLength(2);
  });
});
