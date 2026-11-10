import { render, screen } from '@testing-library/react';

import { WorkOrderRow } from './WorkOrderRow';

const ORDER = { id: 'WO-104482', title: 'Inspect recompressor drive-end bearing', priority: 'P1', status: 'in-progress' } as const;
const PERSON = { id: 'tb', name: 'Tomás Barros', initials: 'TB' };

describe(WorkOrderRow.name, () => {
  it('shows priority, number, title, equipment, status and due date', () => {
    render(<ul><WorkOrderRow order={ORDER} assetTag="23-KA-9103" assetName="Recompressor" due="in 6 h" /></ul>);

    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText('WO-104482')).toHaveClass('font-mono');
    expect(screen.getByText('Inspect recompressor drive-end bearing')).toBeInTheDocument();
    expect(screen.getByText('23-KA-9103')).toHaveClass('font-mono');
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('in 6 h')).toBeInTheDocument();
  });

  it('names the assignee, or says the order is unassigned', () => {
    const { rerender } = render(<ul><WorkOrderRow order={ORDER} due="in 6 h" assignee={PERSON} /></ul>);
    expect(screen.getByText('Tomás Barros')).toBeInTheDocument();

    rerender(<ul><WorkOrderRow order={ORDER} due="in 6 h" /></ul>);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('flags an overdue order in words', () => {
    render(<ul><WorkOrderRow order={{ ...ORDER, status: 'open' }} due="8 Mar" overdue /></ul>);

    expect(screen.getByText('Overdue · 8 Mar')).toBeInTheDocument();
  });

  it('does not flag a finished order as overdue', () => {
    render(<ul><WorkOrderRow order={{ ...ORDER, status: 'done' }} due="8 Mar" overdue /></ul>);

    expect(screen.queryByText(/Overdue/)).not.toBeInTheDocument();
  });

  it('shows when a permit is required', () => {
    render(<ul><WorkOrderRow order={ORDER} due="in 6 h" permitRequired /></ul>);

    expect(screen.getByText('Permit')).toBeInTheDocument();
  });

  it('drops status and assignee name when compact', () => {
    render(<ul><WorkOrderRow order={ORDER} due="in 6 h" assignee={PERSON} density="compact" /></ul>);

    expect(screen.queryByText('In progress')).not.toBeInTheDocument();
    expect(screen.queryByText('Tomás Barros')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Tomás Barros')).toBeInTheDocument();
  });
});
