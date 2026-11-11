import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ContextMenuRadioGroup } from './ContextMenuRadioGroup';
import { ContextMenuRadioItem } from './ContextMenuRadioItem';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuRadioGroup.name, () => {
  it('reports the chosen value', async () => {
    const onValueChange = vi.fn();
    renderContextMenu(
      <ContextMenuRadioGroup value="1h" onValueChange={onValueChange}>
        <ContextMenuRadioItem value="1h">Last hour</ContextMenuRadioItem>
        <ContextMenuRadioItem value="24h">Last 24 hours</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    );
    await openContextMenu();

    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Last 24 hours' }));

    expect(onValueChange).toHaveBeenCalledWith('24h', expect.anything());
  });
});
