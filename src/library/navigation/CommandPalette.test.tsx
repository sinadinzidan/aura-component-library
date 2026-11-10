import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CommandPalette } from './CommandPalette';
import type { CommandPaletteGroup } from './CommandPalette';

describe(CommandPalette.name, () => {
  it('stays closed until the trigger is used', () => {
    render(<CommandPalette groups={groups(vi.fn())} />);

    expect(screen.queryByRole('option', { name: /Create work order/ })).not.toBeInTheDocument();
  });

  it('opens from the trigger and lists the commands by group', async () => {
    render(<CommandPalette groups={groups(vi.fn())} triggerLabel="Search Nordkapp" />);

    await userEvent.click(screen.getByRole('button', { name: /Search Nordkapp/ }));

    expect(await screen.findByText('Actions')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Create work order/ })).toBeInTheDocument();
  });

  it('runs the command and closes', async () => {
    const onSelect = vi.fn();
    render(<CommandPalette groups={groups(onSelect)} />);
    await userEvent.click(screen.getByRole('button', { name: /Search or run a command/ }));

    await userEvent.click(await screen.findByRole('option', { name: /Create work order/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(screen.queryByRole('option', { name: /Create work order/ })).not.toBeInTheDocument());
  });

  it('opens on the keyboard shortcut when one is set', async () => {
    render(<CommandPalette groups={groups(vi.fn())} hotkey="k" />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(await screen.findByRole('option', { name: /Create work order/ })).toBeInTheDocument();
  });

  it('ignores the shortcut when none is set', () => {
    render(<CommandPalette groups={groups(vi.fn())} />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(screen.queryByRole('option', { name: /Create work order/ })).not.toBeInTheDocument();
  });

  it('shows the empty message when nothing matches', async () => {
    render(<CommandPalette groups={groups(vi.fn())} emptyMessage="No matching commands." />);
    await userEvent.click(screen.getByRole('button', { name: /Search or run a command/ }));

    await userEvent.type(await screen.findByRole('combobox'), 'zzzz');

    expect(await screen.findByText('No matching commands.')).toBeInTheDocument();
  });
});

function groups(onSelect: () => void): CommandPaletteGroup[] {
  return [
    {
      id: 'actions',
      heading: 'Actions',
      items: [
        { id: 'create', label: 'Create work order', shortcut: 'C W', onSelect },
        { id: 'ack', label: 'Acknowledge alarm', onSelect: () => undefined },
      ],
    },
  ];
}
