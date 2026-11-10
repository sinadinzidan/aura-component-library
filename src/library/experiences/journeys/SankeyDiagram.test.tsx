import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SankeyDiagram } from './SankeyDiagram';
import type { SankeyDiagramLink, SankeyDiagramNode, SankeyDiagramProps } from './SankeyDiagram';

const NODES: SankeyDiagramNode[] = [
  { id: 'fuel', label: 'Fuel gas', column: 0, series: 1 },
  { id: 'power', label: 'Power import', column: 0, series: 2 },
  { id: 'turbine', label: 'Gas turbine', column: 1 },
  { id: 'pumps', label: 'Export pumps', column: 1 },
  { id: 'work', label: 'Useful work', column: 2, series: 3 },
  { id: 'loss', label: 'Losses', column: 2 },
];

const LINKS: SankeyDiagramLink[] = [
  { source: 'fuel', target: 'turbine', value: 60 },
  { source: 'power', target: 'pumps', value: 20 },
  { source: 'turbine', target: 'work', value: 20 },
  { source: 'turbine', target: 'loss', value: 40 },
  { source: 'pumps', target: 'work', value: 15 },
  { source: 'pumps', target: 'loss', value: 5 },
];

function setup(overrides: Partial<SankeyDiagramProps> = {}) {
  const onSelect = vi.fn();
  const view = render(<SankeyDiagram nodes={NODES} links={LINKS} unit="MW" label="Energy flow" selection={null} onSelect={onSelect} {...overrides} />);
  return { onSelect, ...view };
}

describe(SankeyDiagram.name, () => {
  it('draws a bar per node and a ribbon per link', () => {
    const { container } = setup();

    expect(screen.getByRole('group', { name: 'Energy flow' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="sankey-node"]')).toHaveLength(6);
    expect(container.querySelectorAll('[data-slot="sankey-link"]')).toHaveLength(6);
  });

  it('labels every node with its name and throughput', () => {
    setup();

    const turbine = screen.getByRole('button', { name: /^Gas turbine:/ });
    expect(turbine).toHaveTextContent('60');
    expect(screen.getByRole('button', { name: /^Useful work:/ })).toHaveTextContent('35');
  });

  it('names every ribbon with its ends and value', () => {
    setup();

    expect(screen.getByRole('button', { name: /^Fuel gas to Gas turbine: 60/ })).toBeInTheDocument();
  });

  it('reports a clicked node', async () => {
    const { onSelect } = setup();

    await userEvent.click(screen.getByRole('button', { name: /^Export pumps:/ }));

    expect(onSelect).toHaveBeenCalledWith({ kind: 'node', id: 'pumps' });
  });

  it('reports a clicked ribbon and one activated with Enter', () => {
    const { onSelect } = setup();
    const ribbon = screen.getByRole('button', { name: /^Gas turbine to Losses/ });

    fireEvent.click(ribbon);
    fireEvent.keyDown(ribbon, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith({ kind: 'link', id: 'turbine->loss' });
  });

  it('lights the path of the selection and dims the rest', () => {
    const { container } = setup({ selection: { kind: 'node', id: 'pumps' } });

    const lit = [...container.querySelectorAll('[data-slot="sankey-link"][data-lit="true"]')].map((node) => node.getAttribute('aria-label'));
    expect(lit).toHaveLength(3);
    expect(lit.every((name) => name?.includes('Export pumps'))).toBe(true);
    expect(screen.getByRole('button', { name: /^Export pumps:/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('previews a path on hover without changing the selection', () => {
    const { container, onSelect } = setup();

    fireEvent.mouseEnter(screen.getByRole('button', { name: /^Fuel gas to Gas turbine/ }));
    expect(container.querySelectorAll('[data-slot="sankey-link"][data-lit="true"]')).toHaveLength(3);

    fireEvent.mouseLeave(screen.getByRole('button', { name: /^Fuel gas to Gas turbine/ }));
    expect(container.querySelectorAll('[data-lit]')).toHaveLength(0);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
