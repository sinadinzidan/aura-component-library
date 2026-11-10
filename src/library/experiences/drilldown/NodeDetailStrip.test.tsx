import { render, screen } from '@testing-library/react';

import { fixtureTree } from './drilldownFixture';
import type { DrillNode } from './hierarchy';
import { NodeDetailStrip } from './NodeDetailStrip';

const tree = fixtureTree();
const node = (id: string): DrillNode => {
  const found = tree.byId.get(id);
  if (!found) throw new Error(id);
  return found;
};
const METRICS = [
  { key: 'openAlarms', label: 'Open alarms' },
  { key: 'downtimeHours', label: 'Downtime', unit: 'h' },
];

describe(NodeDetailStrip.name, () => {
  it('says what the node is and what state it is in', () => {
    render(<NodeDetailStrip node={node('comp-3')} metrics={METRICS} />);

    expect(screen.getByText('Recompressor')).toBeInTheDocument();
    expect(screen.getByText('23-KA-9103')).toHaveClass('font-mono');
    expect(screen.getByText('Tripped')).toBeInTheDocument();
  });

  it('prints every roll-up figure with its unit', () => {
    render(<NodeDetailStrip node={node('area-b')} metrics={METRICS} />);

    expect(screen.getByText('Open alarms').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Downtime').nextElementSibling).toHaveTextContent('47h');
  });

  it('picks out the active metric', () => {
    render(<NodeDetailStrip node={node('area-b')} metrics={METRICS} activeMetric="downtimeHours" />);

    expect(screen.getByText('Downtime').parentElement).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('Open alarms').parentElement).not.toHaveAttribute('data-active');
  });

  it('draws the trend behind the headline figure', () => {
    render(<NodeDetailStrip node={node('comp-1')} metrics={METRICS} period="7 d" />);

    expect(screen.getByText('Health, 7 d')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Health of 1st stage compressor, 7 d/ })).toBeInTheDocument();
  });

  it('calls a sensor’s figure its value, since the name is already there', () => {
    render(<NodeDetailStrip node={node('pt')} metrics={METRICS} />);

    expect(screen.getByText('Value, 24 h')).toBeInTheDocument();
  });

  it('says so when there is no trend', () => {
    render(<NodeDetailStrip node={node('sep')} metrics={METRICS} />);

    expect(screen.getByText('No trend data')).toBeInTheDocument();
  });
});
