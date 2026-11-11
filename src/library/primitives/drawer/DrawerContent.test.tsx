import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Drawer } from './Drawer';
import { DrawerContent } from './DrawerContent';
import type { DrawerContentProps } from './DrawerContent';
import { DrawerTitle } from './DrawerTitle';

describe(DrawerContent.name, () => {
  it('is a dialog named by its title', () => {
    renderContent({});

    expect(screen.getByRole('dialog', { name: 'Alarm 4812' })).toBeInTheDocument();
  });

  it('defaults to a medium drawer on the right', () => {
    renderContent({});

    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'right');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'md');
  });

  it.each(['left', 'top', 'bottom'] as const)('attaches to the %s edge', (side) => {
    renderContent({ side });

    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', side);
  });

  it('uses a width for side drawers and a height for top and bottom ones', () => {
    const { unmount } = renderContent({ side: 'right', size: 'sm' });
    expect(screen.getByRole('dialog')).toHaveClass('w-80');
    unmount();

    renderContent({ side: 'bottom', size: 'sm' });
    expect(screen.getByRole('dialog')).toHaveClass('h-56');
  });

  it('has a labelled close button that closes it', async () => {
    renderContent({ closeButtonLabel: 'Close alarm details' });

    await userEvent.click(screen.getByRole('button', { name: 'Close alarm details' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('can hide the close button', () => {
    renderContent({ showCloseButton: false });

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('renders in place when docked', async () => {
    render(
      <div data-testid="stage">
        <Drawer defaultOpen modal={false}>
          <DrawerContent docked>
            <DrawerTitle>Inspector</DrawerTitle>
          </DrawerContent>
        </Drawer>
      </div>
    );

    const dialog = await screen.findByRole('dialog', { name: 'Inspector' });

    expect(screen.getByTestId('stage')).toContainElement(dialog);
    expect(dialog).toHaveAttribute('data-docked');
  });
});

function renderContent(props: Partial<DrawerContentProps>) {
  return render(
    <Drawer defaultOpen>
      <DrawerContent {...props}>
        <DrawerTitle>Alarm 4812</DrawerTitle>
      </DrawerContent>
    </Drawer>
  );
}
