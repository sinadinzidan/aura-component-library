import { screen } from '@testing-library/react';

import { ContextMenuRadioGroup } from './ContextMenuRadioGroup';
import { ContextMenuRadioItem } from './ContextMenuRadioItem';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuRadioItem.name, () => {
  it('checks only the item that matches the group value', async () => {
    renderContextMenu(
      <ContextMenuRadioGroup value="24h">
        <ContextMenuRadioItem value="1h">Last hour</ContextMenuRadioItem>
        <ContextMenuRadioItem value="24h">Last 24 hours</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    );
    await openContextMenu();

    expect(screen.getByRole('menuitemradio', { name: 'Last hour' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menuitemradio', { name: 'Last 24 hours' })).toHaveAttribute('aria-checked', 'true');
  });
});
