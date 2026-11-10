import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { fixtureTree } from './drilldownFixture';
import { buildHierarchy } from './hierarchy';
import type { DrillNode } from './hierarchy';
import { NodePreview } from './NodePreview';

const tree = fixtureTree();
const node = (id: string): DrillNode => {
  const found = tree.byId.get(id);
  if (!found) throw new Error(id);
  return found;
};
const formatAge = () => '14 min ago';

describe(NodePreview.name, () => {
  it('shows a sensor as a large value on its limits, with trend and alarms', () => {
    const { container } = render(<NodePreview node={node('pt')} formatAge={formatAge} />);

    expect(screen.getByRole('heading', { name: 'Discharge pressure' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="range-indicator"]')).toBeInTheDocument();
    expect(screen.getByText('High').nextElementSibling).toHaveTextContent('52');
    expect(screen.getByText('Trip').nextElementSibling).toHaveTextContent('55');
    expect(screen.getByText('Trend, last 24 hours')).toBeInTheDocument();
    expect(screen.getByText('No alarms in the last 7 days')).toBeInTheDocument();
  });

  it('lists the alarms of a sensor with severity, state, value and age', () => {
    render(<NodePreview node={node('vt')} formatAge={formatAge} />);

    expect(screen.getByText('Recompressor tripped on high vibration')).toBeInTheDocument();
    expect(screen.getByText(/Critical · Active ·/)).toBeInTheDocument();
    expect(screen.getByText('14 min ago')).toBeInTheDocument();
  });

  it('shows equipment as health plus its live readings', () => {
    render(<NodePreview node={node('comp-1')} formatAge={formatAge} />);

    expect(screen.getByText('Measurement points').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Readings')).toBeInTheDocument();
    expect(screen.getByText('Discharge temperature')).toBeInTheDocument();
    expect(screen.getByText('Above high limit')).toBeInTheDocument();
  });

  it('shows an area as a roll-up with its equipment', () => {
    render(<NodePreview node={node('area-b')} formatAge={formatAge} />);
    const facts = within(screen.getByText('Sensors').parentElement?.parentElement ?? document.body);

    expect(facts.getByText('Open alarms').nextElementSibling).toHaveTextContent('2');
    expect(facts.getByText('Equipment').nextElementSibling).toHaveTextContent('2');
    expect(facts.getByText('Sensors').nextElementSibling).toHaveTextContent('3');
    expect(screen.getByText('Recompressor')).toBeInTheDocument();
  });

  it('colours the state only when the node is abnormal', () => {
    const { rerender } = render(<NodePreview node={node('area-a')} formatAge={formatAge} />);
    expect(screen.getByText('Normal').parentElement).not.toHaveClass('text-critical-foreground-strong');

    rerender(<NodePreview node={node('comp-3')} formatAge={formatAge} />);

    expect(screen.getByText('Tripped').parentElement).toHaveClass('text-critical-foreground-strong');
  });

  it('makes child rows selectable when given a handler', async () => {
    const onSelect = vi.fn();
    render(<NodePreview node={node('area-b')} formatAge={formatAge} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Recompressor/ }));

    expect(onSelect).toHaveBeenCalledWith('comp-3');
  });

  it('caps the number of alarms listed', () => {
    render(<NodePreview node={tree.root} formatAge={formatAge} maxAlarms={1} />);

    expect(screen.getByText('Recompressor tripped on high vibration')).toBeInTheDocument();
    expect(screen.queryByText('Discharge temperature high')).not.toBeInTheDocument();
  });

  it('says so when nothing is modelled under a node', () => {
    const empty = buildHierarchy({
      assets: [{ id: 'vs', tag: 'VS', name: 'Valhall Sør', type: 'site', parentId: null, state: 'running', health: 'good', healthScore: 93 }],
      sensors: [],
    });

    render(<NodePreview node={empty.root} formatAge={formatAge} />);

    expect(screen.getByText('Nothing is modelled under this site yet.')).toBeInTheDocument();
  });
});
