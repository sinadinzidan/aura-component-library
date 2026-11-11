import { Button } from '@cognite/aura/components/button';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Drawer } from './Drawer';
import { DrawerContent } from './DrawerContent';
import { DrawerTitle } from './DrawerTitle';
import { DrawerTrigger } from './DrawerTrigger';

describe(DrawerTrigger.name, () => {
  it('renders the given button and marks it as opening a dialog', () => {
    renderTrigger();

    expect(screen.getByRole('button', { name: 'Open asset details' })).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('reflects the open state on the trigger', async () => {
    renderTrigger();
    const trigger = screen.getByRole('button', { name: 'Open asset details' });

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

function renderTrigger() {
  return render(
    <Drawer>
      <DrawerTrigger render={<Button variant="outline">Open asset details</Button>} />
      <DrawerContent>
        <DrawerTitle>23-KA-9101</DrawerTitle>
      </DrawerContent>
    </Drawer>
  );
}
