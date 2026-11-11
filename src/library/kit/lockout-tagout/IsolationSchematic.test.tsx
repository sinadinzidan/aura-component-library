import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IsolationSchematic, type SchematicLink, type SchematicNode } from './IsolationSchematic';

const NODES: SchematicNode[] = [
  { id: 'comp', x: 50, y: 50, kind: 'equipment', label: 'Recompressor' },
  { id: 'p1', x: 20, y: 50, kind: 'point', label: '23-XV-9130', step: 1, state: 'verified' },
  { id: 'p2', x: 80, y: 50, kind: 'point', label: '23-XV-9135', step: 2, state: 'planned' },
];

const LINKS: SchematicLink[] = [
  { from: 'p1', to: 'comp' },
  { from: 'comp', to: 'p2' },
  { from: 'missing', to: 'comp' },
];

describe(IsolationSchematic.name, () => {
  it('names the drawing and writes tag and state beside each point', () => {
    render(<IsolationSchematic label="Isolation boundary" nodes={NODES} links={LINKS} />);

    expect(screen.getByRole('group', { name: 'Isolation boundary' })).toBeInTheDocument();
    expect(screen.getByText('Recompressor')).toBeInTheDocument();
    expect(screen.getByText('23-XV-9130')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('draws a line per link whose ends exist', () => {
    const { container } = render(<IsolationSchematic label="Boundary" nodes={NODES} links={LINKS} />);

    expect(container.querySelectorAll('polyline')).toHaveLength(2);
  });

  it('is read-only without a handler', () => {
    render(<IsolationSchematic label="Boundary" nodes={NODES} links={LINKS} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('marks the selected point and reports a selection', async () => {
    const onSelect = vi.fn();
    render(<IsolationSchematic label="Boundary" nodes={NODES} links={LINKS} selected="p1" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /23-XV-9130/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /23-XV-9135/ }));
    expect(onSelect).toHaveBeenCalledWith('p2');
  });
});
