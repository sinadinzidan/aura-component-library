import { fireEvent, render, screen } from '@testing-library/react';

import { ContextMenu } from './ContextMenu';
import { ContextMenuContent } from './ContextMenuContent';
import { ContextMenuItem } from './ContextMenuItem';
import { ContextMenuTrigger } from './ContextMenuTrigger';
import { renderContextMenu } from './testUtils';

describe(ContextMenuTrigger.name, () => {
  it('is a tab stop when focusable', () => {
    renderContextMenu(<ContextMenuItem>Open asset</ContextMenuItem>);

    expect(screen.getByText('Target')).toHaveAttribute('tabindex', '0');
  });

  it('is not a tab stop by default', () => {
    renderContextMenu(<ContextMenuItem>Open asset</ContextMenuItem>, false);

    expect(screen.getByText('Target')).not.toHaveAttribute('tabindex');
  });

  it('opens with Shift+F10', async () => {
    renderContextMenu(<ContextMenuItem>Open asset</ContextMenuItem>);

    fireEvent.keyDown(screen.getByText('Target'), { key: 'F10', shiftKey: true });

    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });

  it('opens with the context-menu key', async () => {
    renderContextMenu(<ContextMenuItem>Open asset</ContextMenuItem>);

    fireEvent.keyDown(screen.getByText('Target'), { key: 'ContextMenu' });

    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });

  it('opens from a focused control inside the area', async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>
          <button type="button">23-KA-9101</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Open asset</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    fireEvent.keyDown(screen.getByRole('button', { name: '23-KA-9101' }), { key: 'F10', shiftKey: true });

    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });

  it('ignores other keys', () => {
    renderContextMenu(<ContextMenuItem>Open asset</ContextMenuItem>);

    fireEvent.keyDown(screen.getByText('Target'), { key: 'F10' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('still calls the caller key handler', () => {
    const onKeyDown = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger onKeyDown={onKeyDown}>Target</ContextMenuTrigger>
      </ContextMenu>
    );

    fireEvent.keyDown(screen.getByText('Target'), { key: 'a' });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});
