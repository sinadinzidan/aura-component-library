import { render, screen } from '@testing-library/react';

import { WorkOrderCard } from './WorkOrderCard';

const ORDER = {
  id: 'WO-104482',
  title: 'Inspect recompressor drive-end bearing',
  priority: 'P1',
  status: 'in-progress',
  type: 'corrective',
  progress: 35,
} as const;

describe(WorkOrderCard.name, () => {
  it('shows number, priority, job, equipment, status and due date', () => {
    render(<WorkOrderCard order={ORDER} assetTag="23-KA-9103" assetName="Recompressor" due="in 6 h" />);

    expect(screen.getByText('WO-104482')).toHaveClass('font-mono');
    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText('Inspect recompressor drive-end bearing')).toBeInTheDocument();
    expect(screen.getByText('23-KA-9103')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('in 6 h')).toBeInTheDocument();
  });

  it('shows progress for work that has started', () => {
    render(<WorkOrderCard order={ORDER} due="in 6 h" />);

    expect(screen.getByRole('progressbar', { name: 'WO-104482 progress' })).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
  });

  it('shows no progress bar before work starts or after it is done', () => {
    const { rerender } = render(<WorkOrderCard order={{ ...ORDER, status: 'planned', progress: 0 }} due="13 Mar" />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

    rerender(<WorkOrderCard order={{ ...ORDER, status: 'done', progress: 100 }} due="11 Mar" />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows the work type instead of the status on a board', () => {
    render(<WorkOrderCard order={ORDER} due="in 6 h" showStatus={false} />);

    expect(screen.queryByText('In progress')).not.toBeInTheDocument();
    expect(screen.getByText('Corrective')).toBeInTheDocument();
  });

  it('says unassigned when nobody has the order', () => {
    render(<WorkOrderCard order={ORDER} due="in 6 h" />);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows what a waiting order is held by, and a required permit', () => {
    render(<WorkOrderCard order={{ ...ORDER, status: 'waiting' }} due="16 Mar" blockedBy="Waiting for spare parts" permitRequired />);

    expect(screen.getByText('Waiting for spare parts')).toBeInTheDocument();
    expect(screen.getByText('Permit')).toBeInTheDocument();
  });
});
