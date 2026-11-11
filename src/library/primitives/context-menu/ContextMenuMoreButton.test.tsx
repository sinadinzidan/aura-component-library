import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ContextMenu } from './ContextMenu';
import { ContextMenuContent } from './ContextMenuContent';
import { ContextMenuItem } from './ContextMenuItem';
import { ContextMenuMoreButton } from './ContextMenuMoreButton';
import { ContextMenuTrigger } from './ContextMenuTrigger';

describe(ContextMenuMoreButton.name, () => {
  it('has an accessible name', () => {
    renderRow('More actions for 23-KA-9101');

    expect(screen.getByRole('button', { name: 'More actions for 23-KA-9101' })).toBeInTheDocument();
  });

  it('opens the surrounding context menu', async () => {
    renderRow();

    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));

    expect(await screen.findByRole('menuitem', { name: 'Open asset' })).toBeInTheDocument();
  });

  it('keeps the menu closed until pressed', () => {
    renderRow();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

function renderRow(label?: string) {
  return render(
    <TooltipProvider>
      <ContextMenu>
        <ContextMenuTrigger>
          <span>23-KA-9101</span>
          <ContextMenuMoreButton label={label} />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Open asset</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </TooltipProvider>
  );
}
