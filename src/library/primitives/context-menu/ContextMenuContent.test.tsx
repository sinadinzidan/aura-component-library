import { screen } from '@testing-library/react';

import { ContextMenuContent } from './ContextMenuContent';
import { ContextMenuItem } from './ContextMenuItem';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuContent.name, () => {
  it('renders a menu outside the trigger area', async () => {
    renderContextMenu(<ContextMenuItem>Open asset</ContextMenuItem>);

    const menu = await openContextMenu();

    expect(menu).toHaveAttribute('data-slot', 'context-menu-content');
    expect(screen.getByText('Target')).not.toContainElement(menu);
  });
});
