import { screen } from '@testing-library/react';

import { ContextMenuItem } from './ContextMenuItem';
import { ContextMenuSeparator } from './ContextMenuSeparator';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuSeparator.name, () => {
  it('renders a separator between sections', async () => {
    renderContextMenu(
      <>
        <ContextMenuItem>Open asset</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Delete asset</ContextMenuItem>
      </>
    );
    await openContextMenu();

    expect(screen.getByRole('separator')).toHaveAttribute('data-slot', 'context-menu-separator');
  });
});
