import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { ContextMenu } from './ContextMenu';
import { ContextMenuContent } from './ContextMenuContent';
import { ContextMenuTrigger } from './ContextMenuTrigger';

/** Renders a context menu around a "Target" area for the context-menu tests. */
export function renderContextMenu(items: ReactNode, focusable = true) {
  return render(
    <ContextMenu>
      <ContextMenuTrigger focusable={focusable}>Target</ContextMenuTrigger>
      <ContextMenuContent>{items}</ContextMenuContent>
    </ContextMenu>
  );
}

/** Right-clicks the target area and waits for the menu. */
export async function openContextMenu() {
  fireEvent.contextMenu(screen.getByText('Target'), { clientX: 40, clientY: 30 });
  return screen.findByRole('menu');
}
