import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { KanbanCard } from './KanbanCard';

describe(KanbanCard.name, () => {
  it('names the card after its reference and title', () => {
    render(<KanbanCard reference="WO-104482" title="Inspect bearing" />);

    expect(screen.getByRole('article', { name: 'WO-104482 Inspect bearing' })).toBeInTheDocument();
  });

  it('says a blocked card is blocked and why', () => {
    render(<KanbanCard reference="WO-104471" title="Clean cooler" blockedReason="Waiting for gaskets" />);

    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for gaskets/)).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveAttribute('data-blocked', 'true');
  });

  it('shows progress as a bar and a figure', () => {
    render(<KanbanCard reference="WO-104482" title="Inspect bearing" progress={35} />);

    expect(screen.getByRole('progressbar', { name: 'WO-104482 progress' })).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
  });

  it('shows the assignee, or says there is none', () => {
    const { rerender } = render(<KanbanCard reference="WO-1" title="Job" assignee={{ id: 'tb', name: 'Tomás Barros' }} />);
    expect(screen.getByLabelText('Tomás Barros')).toBeInTheDocument();

    rerender(<KanbanCard reference="WO-1" title="Job" assignee={null} />);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('drops the detail lines when compact', () => {
    render(<KanbanCard density="compact" reference="WO-1" title="Job" description="23-KA-9103" progress={35} assignee={null} />);

    expect(screen.queryByText('23-KA-9103')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText('Unassigned')).not.toBeInTheDocument();
  });

  it('opens from the title when it can be opened', async () => {
    const onOpen = vi.fn();
    render(<KanbanCard reference="WO-1" title="Inspect bearing" onOpen={onOpen} />);

    await userEvent.click(screen.getByRole('button', { name: 'Inspect bearing' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('marks the card that is open in a panel', () => {
    render(<KanbanCard reference="WO-1" title="Inspect bearing" onOpen={vi.fn()} selected />);

    expect(screen.getByRole('button', { name: 'Inspect bearing' })).toHaveAttribute('aria-current', 'true');
  });

  it('renders the actions and the grip', () => {
    const { container } = render(<KanbanCard reference="WO-1" title="Job" grip actions={<button type="button">Move</button>} />);

    expect(screen.getByRole('button', { name: 'Move' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="kanban-card-grip"]')).not.toBeNull();
  });
});
