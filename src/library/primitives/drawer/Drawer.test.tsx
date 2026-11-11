import { Button } from '@cognite/aura/components/button';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Drawer } from './Drawer';
import { DrawerContent } from './DrawerContent';
import { DrawerTitle } from './DrawerTitle';
import { DrawerTrigger } from './DrawerTrigger';

describe(Drawer.name, () => {
  it('stays closed until the trigger is pressed', async () => {
    renderDrawer({});

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open filters' }));

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    renderDrawer({});
    const trigger = screen.getByRole('button', { name: 'Open filters' });
    await userEvent.click(trigger);

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('moves focus into the drawer when it opens', async () => {
    renderDrawer({});

    await userEvent.click(screen.getByRole('button', { name: 'Open filters' }));

    await waitFor(() => expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
  });

  it('reports open changes', async () => {
    const onOpenChange = vi.fn();
    renderDrawer({ onOpenChange });

    await userEvent.click(screen.getByRole('button', { name: 'Open filters' }));

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('ignores Escape and the close button while not dismissible', async () => {
    const onOpenChange = vi.fn();
    renderDrawer({ defaultOpen: true, dismissible: false, onOpenChange });

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('renders a scrim only when modal', () => {
    const { unmount } = renderDrawer({ defaultOpen: true });
    expect(document.querySelector('[data-slot="drawer-overlay"]')).not.toBeNull();
    unmount();

    renderDrawer({ defaultOpen: true, modal: false });
    expect(document.querySelector('[data-slot="drawer-overlay"]')).toBeNull();
  });
});

function renderDrawer(props: {
  defaultOpen?: boolean;
  modal?: boolean;
  dismissible?: boolean;
  onOpenChange?: () => void;
}) {
  return render(
    <Drawer {...props}>
      <DrawerTrigger render={<Button>Open filters</Button>} />
      <DrawerContent>
        <DrawerTitle>Filters</DrawerTitle>
      </DrawerContent>
    </Drawer>
  );
}
