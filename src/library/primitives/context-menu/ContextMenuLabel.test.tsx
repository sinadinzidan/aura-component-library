import { screen } from '@testing-library/react';

import { ContextMenuGroup } from './ContextMenuGroup';
import { ContextMenuLabel } from './ContextMenuLabel';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuLabel.name, () => {
  it('renders the section heading, inset on request', async () => {
    renderContextMenu(
      <ContextMenuGroup>
        <ContextMenuLabel inset>Time range</ContextMenuLabel>
      </ContextMenuGroup>
    );
    await openContextMenu();

    expect(screen.getByText('Time range')).toHaveAttribute('data-slot', 'context-menu-label');
    expect(screen.getByText('Time range')).toHaveClass('pl-8');
  });
});
