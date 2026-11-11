import { render, screen } from '@testing-library/react';

import { Drawer } from './Drawer';
import { DrawerContent } from './DrawerContent';
import { DrawerDescription } from './DrawerDescription';
import { DrawerTitle } from './DrawerTitle';

describe(DrawerDescription.name, () => {
  it('describes the drawer for assistive technology', () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerTitle>Filter alarms</DrawerTitle>
          <DrawerDescription>Narrow the list by severity and area.</DrawerDescription>
        </DrawerContent>
      </Drawer>
    );

    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Narrow the list by severity and area.');
  });
});
