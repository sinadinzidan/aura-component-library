import { screen } from '@testing-library/react';

import { ContextMenuGroup } from './ContextMenuGroup';
import { ContextMenuItem } from './ContextMenuItem';
import { ContextMenuLabel } from './ContextMenuLabel';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuGroup.name, () => {
  it('groups items under its label', async () => {
    renderContextMenu(
      <ContextMenuGroup>
        <ContextMenuLabel>23-KA-9101</ContextMenuLabel>
        <ContextMenuItem>Open asset</ContextMenuItem>
      </ContextMenuGroup>
    );
    await openContextMenu();

    expect(screen.getByRole('group', { name: '23-KA-9101' })).toContainElement(
      screen.getByRole('menuitem', { name: 'Open asset' })
    );
  });
});
