import { Button } from '@cognite/aura/components/button';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Drawer } from './Drawer';
import { DrawerClose } from './DrawerClose';
import { DrawerContent } from './DrawerContent';
import { DrawerTitle } from './DrawerTitle';

describe(DrawerClose.name, () => {
  it('closes the drawer', async () => {
    renderClose(true);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('is disabled while the drawer is not dismissible', () => {
    renderClose(false);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});

function renderClose(dismissible: boolean) {
  return render(
    <Drawer defaultOpen dismissible={dismissible}>
      <DrawerContent showCloseButton={false}>
        <DrawerTitle>Edit work order</DrawerTitle>
        <DrawerClose render={<Button variant="ghost">Cancel</Button>} />
      </DrawerContent>
    </Drawer>
  );
}
