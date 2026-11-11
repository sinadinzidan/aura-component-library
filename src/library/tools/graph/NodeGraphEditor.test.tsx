import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ALARM_RULE_GRAPH } from './graphFixtures';
import type { GraphData } from './graphModel';
import { NodeGraphEditor } from './NodeGraphEditor';

const TWO_NODES: GraphData = {
  nodes: [
    { id: 'a', kind: 'source', title: 'Read tag', x: 40, y: 40, inputs: [], outputs: [{ id: 'out', label: 'Value', type: 'number' }], state: 'idle' },
    { id: 'b', kind: 'logic', title: 'Compare', x: 320, y: 40, inputs: [{ id: 'in', label: 'Value', type: 'number' }], outputs: [], state: 'idle' },
    { id: 'c', kind: 'sink', title: 'Notify', x: 320, y: 200, inputs: [{ id: 'in', label: 'Message', type: 'text' }], outputs: [], state: 'idle' },
  ],
  edges: [],
};

function renderEditor(graph: GraphData = TWO_NODES, props: Partial<Parameters<typeof NodeGraphEditor>[0]> = {}) {
  return render(
    <div style={{ height: 600 }}>
      <NodeGraphEditor graph={graph} label="Alarm rule" {...props} />
    </div>
  );
}

const node = (name: RegExp | string) => screen.getByRole('button', { name, pressed: undefined });
const status = () => screen.getByRole('status', { name: 'Editor activity' });

describe(NodeGraphEditor.name, () => {
  it('draws every node and a canvas named for the graph', () => {
    renderEditor();

    expect(screen.getByRole('application', { name: /^Alarm rule/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^(Read tag|Compare|Notify), not run/ })).toHaveLength(3);
  });

  it('selects a node with Enter, opens the inspector and announces it', async () => {
    renderEditor();

    node(/^Read tag, not run/).focus();
    await userEvent.keyboard('{Enter}');

    expect(status()).toHaveTextContent('Read tag selected');
    expect(screen.getByRole('complementary', { name: 'Read tag' })).toBeInTheDocument();
  });

  it('moves the selected node with the arrow keys, one grid step at a time', async () => {
    renderEditor();

    node(/^Read tag, not run/).focus();
    await userEvent.keyboard('{Enter}{ArrowRight}');

    expect(status()).toHaveTextContent('Moved Read tag');
    const rect = node(/^Read tag, not run, selected/).querySelector('rect');
    expect(rect).toHaveAttribute('x', '48');
  });

  it('deletes the selection with Delete and brings it back with undo', async () => {
    renderEditor();

    node(/^Notify, not run/).focus();
    await userEvent.keyboard('{Enter}{Delete}');
    expect(screen.queryByRole('button', { name: /^Notify, not run/ })).not.toBeInTheDocument();
    expect(status()).toHaveTextContent('Deleted 1 node');

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('button', { name: /^Notify, not run/ })).toBeInTheDocument();
  });

  it('duplicates with Ctrl+D', async () => {
    renderEditor();

    node(/^Read tag, not run/).focus();
    await userEvent.keyboard('{Enter}{Control>}d{/Control}');

    expect(screen.getAllByRole('button', { name: /^Read tag, not run/ })).toHaveLength(2);
  });

  it('connects an output to an input from the keyboard', async () => {
    const { container } = renderEditor();

    screen.getByRole('button', { name: 'Output Value, number, Read tag' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: /Output Value, number, Read tag, connection started/ })).toBeInTheDocument();
    screen.getByRole('button', { name: 'Input Value, number, Compare' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(status()).toHaveTextContent('Connected Read tag to Compare');
    expect(container.querySelectorAll('[data-edge]')).toHaveLength(1);
  });

  it('refuses a connection between different types and says why', async () => {
    const { container } = renderEditor();

    screen.getByRole('button', { name: 'Output Value, number, Read tag' }).focus();
    await userEvent.keyboard('{Enter}');
    screen.getByRole('button', { name: 'Input Message, text, Notify' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('Number cannot feed text.');
    expect(container.querySelectorAll('[data-edge]')).toHaveLength(0);
  });

  it('cancels a started connection with Escape', async () => {
    renderEditor();

    screen.getByRole('button', { name: 'Output Value, number, Read tag' }).focus();
    await userEvent.keyboard('{Enter}{Escape}');

    expect(screen.queryByRole('button', { name: /connection started/ })).not.toBeInTheDocument();
  });

  it('adds a node from the palette and selects it', async () => {
    renderEditor();

    await userEvent.click(screen.getByRole('button', { name: 'Add Resample' }));

    expect(screen.getByRole('button', { name: /^Resample, not run, selected/ })).toBeInTheDocument();
  });

  it('selects everything with Ctrl+A and offers selection actions', async () => {
    renderEditor();

    node(/^Read tag, not run/).focus();
    await userEvent.keyboard('{Control>}a{/Control}');

    const toolbar = screen.getByRole('toolbar', { name: 'Selection' });
    expect(within(toolbar).getByText('3 selected')).toBeInTheDocument();
    await userEvent.click(within(toolbar).getByRole('button', { name: 'Delete selection' }));
    expect(screen.getByText(/The canvas is empty/)).toBeInTheDocument();
  });

  it('removes a selected connection', async () => {
    const { container } = renderEditor(ALARM_RULE_GRAPH);

    const [first] = screen.getAllByRole('button', { name: /^Connection, / });
    first.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Remove connection' }));

    expect(container.querySelectorAll('[data-edge]')).toHaveLength(ALARM_RULE_GRAPH.edges.length - 1);
  });

  it('arranges nodes left to right in one undoable step', async () => {
    renderEditor();

    await userEvent.click(screen.getByRole('button', { name: 'Arrange nodes left to right' }));
    expect(status()).toHaveTextContent('Nodes arranged left to right');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(status()).toHaveTextContent('Undone');
  });

  it('shows an empty canvas with a way forward', () => {
    renderEditor({ nodes: [], edges: [] });

    expect(screen.getByText(/The canvas is empty/)).toBeInTheDocument();
  });

  it('cannot be changed when read-only, but can still be inspected', async () => {
    renderEditor(TWO_NODES, { readOnly: true });

    expect(screen.getByText('Read-only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Resample' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();

    node(/^Read tag, not run/).focus();
    await userEvent.keyboard('{Enter}{Delete}');
    expect(screen.getByRole('button', { name: /^Read tag, not run/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
  });

  it('drops the palette, inspector and mini-map when compact', () => {
    renderEditor(TWO_NODES, { variant: 'compact' });

    expect(screen.queryByRole('list', { name: 'Nodes to add' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mini-map/ })).not.toBeInTheDocument();
  });

  it('starts with the given selection', () => {
    renderEditor(TWO_NODES, { initialSelection: ['a', 'b'] });

    expect(screen.getByRole('toolbar', { name: 'Selection' })).toHaveTextContent('2 selected');
  });

  it('zooms from the toolbar', async () => {
    renderEditor();
    const before = screen.getByRole('status', { name: 'Zoom level' }).textContent;

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));

    expect(screen.getByRole('status', { name: 'Zoom level' }).textContent).not.toBe(before);
  });
});
