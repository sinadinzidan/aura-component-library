import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MAINTENANCE_GRAPH, PIPELINE_GRAPH } from './graphFixtures';
import { GraphNodeCard } from './GraphNodeCard';

const MODEL = PIPELINE_GRAPH.nodes[3];

function renderNode(props: Partial<Parameters<typeof GraphNodeCard>[0]> = {}) {
  return render(
    <svg>
      <GraphNodeCard node={MODEL} {...props} />
    </svg>
  );
}

describe(GraphNodeCard.name, () => {
  it('is a button named by its title and run state', () => {
    renderNode();

    expect(screen.getByRole('button', { name: 'Anomaly model, not run', pressed: false })).toBeInTheDocument();
    expect(screen.getByText('Not run')).toBeInTheDocument();
  });

  it('says when it is selected', () => {
    renderNode({ selected: true });

    expect(screen.getByRole('button', { name: 'Anomaly model, not run, selected' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('states failure in words and in the tooltip', () => {
    render(
      <svg>
        <GraphNodeCard node={MAINTENANCE_GRAPH.nodes[2]} />
      </svg>
    );

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Check spare parts: Inventory service did not answer.')).toBeInTheDocument();
  });

  it('names each port with its direction and type', () => {
    renderNode();

    expect(screen.getByRole('button', { name: 'Input Features, table, Anomaly model' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Input Threshold, number, Anomaly model' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Output Scores, table, Anomaly model' })).toBeInTheDocument();
  });

  it('reports a press on an output port without selecting the node', () => {
    const onPointerDown = vi.fn();
    const onPortPointerDown = vi.fn();
    renderNode({ onPointerDown, onPortPointerDown });

    fireEvent.pointerDown(screen.getByRole('button', { name: /Output Scores/ }));

    expect(onPortPointerDown).toHaveBeenCalledTimes(1);
    expect(onPortPointerDown.mock.calls[0][0]).toBe('output');
    expect(onPortPointerDown.mock.calls[0][1].id).toBe('out');
    expect(onPointerDown).not.toHaveBeenCalled();
  });

  it('activates a port with Enter and starts a connection from the keyboard', async () => {
    const onPortActivate = vi.fn();
    renderNode({ onPortActivate });

    screen.getByRole('button', { name: /Output Scores/ }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onPortActivate).toHaveBeenCalledWith('output', MODEL.outputs[0]);
  });

  it('marks an armed port and shows a verdict on inputs', () => {
    const { container } = renderNode({ armedPort: { node: 'model', port: 'out' }, feedback: (id) => (id === 'in' ? 'valid' : 'invalid') });

    expect(screen.getByRole('button', { name: /connection started/ })).toBeInTheDocument();
    expect(container.querySelector('[data-port="in"]')).toHaveAttribute('data-feedback', 'valid');
    expect(container.querySelector('[data-port="thr"]')).toHaveAttribute('data-feedback', 'invalid');
  });

  it('draws ports as plain marks when read-only', () => {
    renderNode({ readOnly: true });

    expect(screen.queryByRole('button', { name: /Output Scores/ })).not.toBeInTheDocument();
  });
});
