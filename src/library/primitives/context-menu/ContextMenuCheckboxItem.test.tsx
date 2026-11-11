import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ContextMenuCheckboxItem } from './ContextMenuCheckboxItem';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuCheckboxItem.name, () => {
  it('reflects its checked state', async () => {
    renderContextMenu(<ContextMenuCheckboxItem checked>Show limits</ContextMenuCheckboxItem>);
    await openContextMenu();

    expect(screen.getByRole('menuitemcheckbox', { name: 'Show limits' })).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles and keeps the menu open', async () => {
    const onCheckedChange = vi.fn();
    renderContextMenu(
      <ContextMenuCheckboxItem checked={false} onCheckedChange={onCheckedChange}>
        Show limits
      </ContextMenuCheckboxItem>
    );
    await openContextMenu();

    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Show limits' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});
