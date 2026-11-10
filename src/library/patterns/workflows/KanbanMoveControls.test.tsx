import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { KanbanMoveControls } from './KanbanMoveControls';

const COLUMNS = [
  { id: 'open', title: 'Open' },
  { id: 'planned', title: 'Planned' },
  { id: 'done', title: 'Done' },
];

describe(KanbanMoveControls.name, () => {
  it('steps the card to the next column', async () => {
    const onMove = vi.fn();
    render(<KanbanMoveControls cardLabel="WO-1" columns={COLUMNS} currentColumnId="planned" onMove={onMove} />);

    await userEvent.click(screen.getByRole('button', { name: 'Move WO-1 to Done' }));

    expect(onMove).toHaveBeenCalledWith('done');
  });

  it('steps the card to the previous column', async () => {
    const onMove = vi.fn();
    render(<KanbanMoveControls cardLabel="WO-1" columns={COLUMNS} currentColumnId="planned" onMove={onMove} />);

    await userEvent.click(screen.getByRole('button', { name: 'Move WO-1 to Open' }));

    expect(onMove).toHaveBeenCalledWith('open');
  });

  it('disables the arrow at the edge of the board and says why', () => {
    render(<KanbanMoveControls cardLabel="WO-1" columns={COLUMNS} currentColumnId="open" onMove={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'WO-1 is in the first column' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move WO-1 to Planned' })).toBeEnabled();
  });

  it('jumps to any column from the menu', async () => {
    const onMove = vi.fn();
    render(<KanbanMoveControls cardLabel="WO-1" columns={COLUMNS} currentColumnId="open" onMove={onMove} controls="menu" />);

    await userEvent.click(screen.getByRole('button', { name: 'Move WO-1 to…' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Done' }));

    expect(onMove).toHaveBeenCalledWith('done');
  });

  it('marks the current column in the menu and keeps it from being chosen', async () => {
    const onMove = vi.fn();
    render(<KanbanMoveControls cardLabel="WO-1" columns={COLUMNS} currentColumnId="open" onMove={onMove} controls="menu" />);

    await userEvent.click(screen.getByRole('button', { name: 'Move WO-1 to…' }));
    const current = await screen.findByRole('menuitem', { name: /Open/ });

    expect(current).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows only the controls asked for', () => {
    render(<KanbanMoveControls cardLabel="WO-1" columns={COLUMNS} currentColumnId="open" onMove={vi.fn()} controls="buttons" />);

    expect(screen.queryByRole('button', { name: 'Move WO-1 to…' })).not.toBeInTheDocument();
  });
});
