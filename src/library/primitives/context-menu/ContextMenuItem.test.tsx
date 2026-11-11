import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ContextMenuItem } from './ContextMenuItem';
import { openContextMenu, renderContextMenu } from './testUtils';

describe(ContextMenuItem.name, () => {
  it('marks the destructive variant', async () => {
    renderContextMenu(<ContextMenuItem variant="destructive">Delete asset</ContextMenuItem>);
    await openContextMenu();

    expect(screen.getByRole('menuitem', { name: 'Delete asset' })).toHaveAttribute('data-variant', 'destructive');
  });

  it('insets the label when asked', async () => {
    renderContextMenu(<ContextMenuItem inset>Rename</ContextMenuItem>);
    await openContextMenu();

    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveClass('pl-8');
  });

  it('disables the item and shows the reason', async () => {
    const onClick = vi.fn();
    renderContextMenu(
      <ContextMenuItem disabledReason="Stop the compressor first" onClick={onClick}>
        Isolate
      </ContextMenuItem>
    );
    await openContextMenu();
    const item = screen.getByRole('menuitem', { name: /Isolate/ });

    await userEvent.click(item);

    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).toHaveTextContent('Stop the compressor first');
    expect(onClick).not.toHaveBeenCalled();
  });
});
