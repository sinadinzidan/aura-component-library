import { render, screen } from '@testing-library/react';

import { fixtureTree } from './drilldownFixture';
import type { DrillNode } from './hierarchy';
import { NodeRow } from './NodeRow';

const tree = fixtureTree();
const node = (id: string): DrillNode => {
  const found = tree.byId.get(id);
  if (!found) throw new Error(id);
  return found;
};

describe(NodeRow.name, () => {
  it('shows name, tag, headline figure and state', () => {
    render(<NodeRow node={node('pt')} />);

    expect(screen.getByText('Discharge pressure')).toBeInTheDocument();
    expect(screen.getByText('23-PT-92531')).toHaveClass('font-mono');
    expect(screen.getByText('48.6')).toBeInTheDocument();
    expect(screen.getByText('barg')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toHaveClass('text-muted-foreground');
  });

  it('colours the state and the figure only when the node is abnormal', () => {
    render(<NodeRow node={node('vt')} />);

    expect(screen.getByText('Trip limit exceeded')).toHaveClass('text-critical-foreground-strong');
    expect(screen.getByText('11.6')).toHaveClass('text-critical-foreground-strong');
  });

  it('repeats the state in the shape of the dot', () => {
    const { container } = render(<NodeRow node={node('comp-3')} />);

    expect(container.querySelector('[data-slot="status-dot"]')).toHaveAttribute('data-shape', 'diamond');
  });

  it('adds a chevron for rows that open something', () => {
    const { container, rerender } = render(<NodeRow node={node('area-b')} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();

    rerender(<NodeRow node={node('area-b')} showChevron />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
