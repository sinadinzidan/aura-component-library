import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SelectionActionBar } from './SelectionActionBar';
import type { SelectionAction } from './SelectionActionBar';

const NOUN = { one: 'work order', other: 'work orders' };

describe(SelectionActionBar.name, () => {
  it('words a selection of several with the plural noun', () => {
    render(<SelectionActionBar count={3} noun={NOUN} actions={[]} onClear={vi.fn()} />);

    const toolbar = screen.getByRole('toolbar', { name: 'Actions for selected work orders' });
    expect(toolbar).toHaveTextContent('3');
    expect(toolbar).toHaveTextContent('work orders selected');
  });

  it('words a selection of one with the singular noun', () => {
    render(<SelectionActionBar count={1} noun={NOUN} actions={[]} onClear={vi.fn()} />);

    expect(screen.getByRole('toolbar')).toHaveTextContent('work order selected');
    expect(screen.getByRole('toolbar')).not.toHaveTextContent('work orders selected');
  });

  it('renders nothing while the selection is empty', () => {
    render(<SelectionActionBar count={0} noun={NOUN} actions={[]} onClear={vi.fn()} />);

    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  });

  it('keeps wording the last selection while the bar leaves', () => {
    const { rerender } = render(<SelectionActionBar count={2} noun={NOUN} actions={[]} onClear={vi.fn()} />);

    rerender(<SelectionActionBar count={0} noun={NOUN} actions={[]} onClear={vi.fn()} />);

    expect(screen.getByRole('toolbar')).toHaveTextContent('2 work orders selected');
  });

  it('clears the selection from the clear button', async () => {
    const onClear = vi.fn();
    render(<SelectionActionBar count={2} noun={NOUN} actions={[]} onClear={onClear} />);

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('runs a visible action', async () => {
    const actions = makeActions();
    render(<SelectionActionBar count={2} noun={NOUN} actions={actions} onClear={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Assign' }));

    expect(actions[0].onSelect).toHaveBeenCalledTimes(1);
  });

  it('moves actions past the visible limit into the overflow menu', async () => {
    const actions = makeActions();
    render(<SelectionActionBar count={2} noun={NOUN} actions={actions} maxVisible={1} onClear={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Export' }));

    expect(actions[1].onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows no overflow menu when every action fits', () => {
    render(<SelectionActionBar count={2} noun={NOUN} actions={makeActions()} maxVisible={3} onClear={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument();
  });

  it('runs the primary action', async () => {
    const onSelect = vi.fn();
    render(
      <SelectionActionBar
        count={2}
        noun={NOUN}
        actions={[]}
        primaryAction={{ label: 'Close work orders', onSelect }}
        onClear={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close work orders' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

function makeActions(): SelectionAction[] {
  return [
    { id: 'assign', label: 'Assign', onSelect: vi.fn() },
    { id: 'export', label: 'Export', onSelect: vi.fn() },
    { id: 'delete', label: 'Delete', onSelect: vi.fn(), destructive: true },
  ];
}
