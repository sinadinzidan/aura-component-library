import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { FaultNode } from './causes';
import { FaultTree } from './FaultTree';

const TREE: FaultNode = {
  id: 'trip',
  label: 'Recompressor tripped',
  state: 'confirmed',
  gate: 'or',
  children: [
    { id: 'real', label: 'Real high vibration', state: 'confirmed', gate: 'and', children: [{ id: 'bearing', label: 'Bearing wear', state: 'confirmed', detail: 'E-03' }] },
    { id: 'spurious', label: 'Spurious signal', state: 'ruled-out' },
  ],
};

describe(FaultTree.name, () => {
  it('renders every node with its state in words and names the gates', () => {
    const { container } = render(<FaultTree label="Fault tree for the trip" root={TREE} />);

    expect(screen.getByRole('list', { name: 'Fault tree for the trip' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-node]')).toHaveLength(4);
    expect(screen.getByText('Any of')).toBeInTheDocument();
    expect(screen.getByText('All of')).toBeInTheDocument();
    expect(screen.getByText('Ruled out')).toBeInTheDocument();
    expect(screen.getByText('Spurious signal')).toHaveClass('line-through');
    expect(screen.getByText('E-03')).toBeInTheDocument();
  });

  it('lets a node be selected', async () => {
    const onSelect = vi.fn();
    render(<FaultTree label="Fault tree" root={TREE} selected="real" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /Real high vibration/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Bearing wear/ }));

    expect(onSelect).toHaveBeenCalledWith('bearing');
  });
});
