import { render, screen } from '@testing-library/react';

import { Drawer } from './Drawer';
import { DrawerContent } from './DrawerContent';
import { DrawerTitle } from './DrawerTitle';

describe(DrawerTitle.name, () => {
  it('renders a heading that names the drawer', () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerTitle>Filter alarms</DrawerTitle>
        </DrawerContent>
      </Drawer>
    );

    expect(screen.getByRole('heading', { name: 'Filter alarms' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Filter alarms' })).toBeInTheDocument();
  });
});
