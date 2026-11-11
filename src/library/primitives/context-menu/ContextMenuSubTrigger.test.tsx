import { screen } from '@testing-library/react';

import { ContextMenuSub } from './ContextMenuSub';
import { ContextMenuSubTrigger } from './ContextMenuSubTrigger';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuSubTrigger.name, () => {
  it('is a menu item that announces a submenu', async () => {
    renderContextMenu(
      <ContextMenuSub>
        <ContextMenuSubTrigger>Add to</ContextMenuSubTrigger>
      </ContextMenuSub>
    );
    await openContextMenu();

    expect(screen.getByRole('menuitem', { name: 'Add to' })).toHaveAttribute('aria-haspopup', 'menu');
  });
});
