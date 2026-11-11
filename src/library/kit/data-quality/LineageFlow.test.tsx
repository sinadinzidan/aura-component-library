import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LineageFlow, type LineageNode } from './LineageFlow';

const NODES: LineageNode[] = [
  { id: 'source', stage: 'Source', name: 'SAP PM', detail: 'Work orders', state: 'Failing', tone: 'critical' },
  { id: 'raw', stage: 'Staged', name: 'raw.sap.workorders', detail: '48,210 rows', state: 'Stale', tone: 'warning' },
  { id: 'model', stage: 'Data model', name: 'Maintenance.WorkOrder', detail: '47,902 instances', state: 'Served', tone: 'success' },
];

describe(LineageFlow.name, () => {
  it('lists the nodes upstream first with their stage and state', () => {
    render(<LineageFlow label="Lineage of work orders" nodes={NODES} />);

    const items = screen.getAllByRole('listitem');
    expect(screen.getByRole('list', { name: 'Lineage of work orders' })).toBeInTheDocument();
    expect(items.map((item) => item.getAttribute('data-node'))).toEqual(['source', 'raw', 'model']);
    expect(screen.getByText('raw.sap.workorders')).toBeInTheDocument();
    expect(screen.getByText('Failing')).toBeInTheDocument();
    expect(screen.getByText('Data model')).toBeInTheDocument();
  });

  it('carries the tone of each node', () => {
    render(<LineageFlow label="Lineage" nodes={NODES} />);

    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('data-tone', 'critical');
  });

  it('reports the picked node and marks the selected one', async () => {
    const onSelect = vi.fn();
    render(<LineageFlow label="Lineage" nodes={NODES} selected="raw" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /raw\.sap\.workorders/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /SAP PM/ }));
    expect(onSelect).toHaveBeenCalledWith('source');
  });
});
