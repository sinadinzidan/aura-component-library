import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MAINTENANCE_GRAPH, PIPELINE_GRAPH } from './graphFixtures';
import { NodeInspector } from './NodeInspector';

const handlers = () => ({ onRename: vi.fn(), onDetail: vi.fn(), onRunState: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn() });

describe(NodeInspector.name, () => {
  it('shows the node name, settings, ports and connection count', () => {
    render(<NodeInspector node={PIPELINE_GRAPH.nodes[3]} connections={3} {...handlers()} />);

    expect(screen.getByLabelText('Name')).toHaveValue('Anomaly model');
    expect(screen.getByLabelText('Settings')).toHaveValue('Isolation forest');
    expect(screen.getByText('In: Threshold')).toBeInTheDocument();
    expect(screen.getByText('model node · 3 connections')).toBeInTheDocument();
  });

  it('reports edits to the name', async () => {
    const h = handlers();
    render(<NodeInspector node={PIPELINE_GRAPH.nodes[0]} connections={1} {...h} />);

    await userEvent.type(screen.getByLabelText('Name'), '!');

    expect(h.onRename).toHaveBeenCalledWith('Read time series!');
  });

  it('duplicates and deletes', async () => {
    const h = handlers();
    render(<NodeInspector node={PIPELINE_GRAPH.nodes[0]} connections={1} {...h} />);

    await userEvent.click(screen.getByRole('button', { name: /Duplicate/ }));
    await userEvent.click(screen.getByRole('button', { name: /Delete/ }));

    expect(h.onDuplicate).toHaveBeenCalledTimes(1);
    expect(h.onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows why a node failed', () => {
    render(<NodeInspector node={MAINTENANCE_GRAPH.nodes[2]} connections={2} {...handlers()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Inventory service did not answer.');
  });

  it('hides the actions and locks the fields when read-only', () => {
    render(<NodeInspector node={PIPELINE_GRAPH.nodes[0]} connections={1} readOnly {...handlers()} />);

    expect(screen.getByLabelText('Name')).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
  });
});
