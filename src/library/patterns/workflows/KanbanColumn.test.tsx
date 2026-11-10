import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { KanbanColumn } from './KanbanColumn';

describe(KanbanColumn.name, () => {
  it('names the column with its card count', () => {
    render(
      <KanbanColumn title="Planned" count={2}>
        <p>Card</p>
      </KanbanColumn>
    );

    expect(screen.getByRole('region', { name: 'Planned, 2 cards' })).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
  });

  it('shows the count against the limit', () => {
    render(<KanbanColumn title="In progress" count={2} limit={3} />);

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.queryByText(/over limit/)).not.toBeInTheDocument();
  });

  it('says when the column is at its limit', () => {
    render(<KanbanColumn title="In progress" count={3} limit={3} />);

    expect(screen.getByText('At limit')).toBeInTheDocument();
  });

  it('says by how much the column is over its limit', () => {
    render(<KanbanColumn title="In progress" count={5} limit={3} />);

    expect(screen.getByText('2 over limit')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveAttribute('data-wip', 'over');
  });

  it('shows the empty message only when there are no cards', () => {
    const { rerender } = render(<KanbanColumn title="Waiting" count={0} empty="Nothing is waiting" />);
    expect(screen.getByText('Nothing is waiting')).toBeInTheDocument();

    rerender(<KanbanColumn title="Waiting" count={1} empty="Nothing is waiting" />);

    expect(screen.queryByText('Nothing is waiting')).not.toBeInTheDocument();
  });

  it('adds a card from the button under the cards', async () => {
    const onAdd = vi.fn();
    render(<KanbanColumn title="Open" count={0} onAdd={onAdd} addLabel="Add work order" />);

    await userEvent.click(screen.getByRole('button', { name: 'Add work order' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('collapses to a rail that keeps the name and count', () => {
    render(
      <KanbanColumn title="Done" count={12} collapsed onToggleCollapse={vi.fn()}>
        <p>Card</p>
      </KanbanColumn>
    );

    expect(screen.getByRole('region', { name: 'Done, 12 cards' })).toHaveAttribute('data-collapsed', 'true');
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.queryByText('Card')).not.toBeInTheDocument();
  });

  it('collapses to a summary line at full width', () => {
    render(
      <KanbanColumn title="Done" count={12} collapsed collapsedLayout="summary" collapsedSummary="12 closed this week">
        <p>Card</p>
      </KanbanColumn>
    );

    expect(screen.getByText('12 closed this week')).toBeInTheDocument();
    expect(screen.queryByText('Card')).not.toBeInTheDocument();
  });

  it('toggles from the collapse button and reports its state', async () => {
    const onToggleCollapse = vi.fn();
    render(<KanbanColumn title="Done" count={1} onToggleCollapse={onToggleCollapse} />);
    const button = screen.getByRole('button', { name: 'Collapse Done' });

    await userEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });
});
