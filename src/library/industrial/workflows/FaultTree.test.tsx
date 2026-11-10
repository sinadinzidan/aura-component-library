import { render, screen } from '@testing-library/react';

import { FaultTree } from './FaultTree';
import type { FaultTreeNode } from './FaultTree';

const TREE: FaultTreeNode = {
  id: 'top',
  label: 'Recompressor trip',
  gate: 'OR',
  children: [
    {
      id: 'vib',
      label: 'True high vibration',
      gate: 'AND',
      state: 'confirmed',
      children: [
        { id: 'lube', label: 'Loss of lubrication', state: 'confirmed' },
        { id: 'load', label: 'High load', state: 'open' },
      ],
    },
    { id: 'spurious', label: 'Spurious trip', state: 'ruled-out' },
  ],
};

describe(FaultTree.name, () => {
  it('renders every event, nested by cause', () => {
    const { container } = render(<FaultTree label="Fault tree" root={TREE} />);
    expect(screen.getByRole('list', { name: 'Fault tree' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="fault-tree-node"]')).toHaveLength(5);
    expect(screen.getByText('Loss of lubrication').closest('li')).toHaveAttribute('data-depth', '2');
  });

  it('labels gates only on events that have causes', () => {
    const { container } = render(<FaultTree label="Fault tree" root={TREE} />);
    const gates = [...container.querySelectorAll('[data-slot="fault-tree-gate"]')].map((gate) => gate.firstChild?.textContent);
    expect(gates).toEqual(['OR', 'AND']);
  });

  it('explains a gate to assistive technology', () => {
    render(<FaultTree label="Fault tree" root={TREE} />);
    expect(screen.getByText(': caused by any of the events below')).toBeInTheDocument();
    expect(screen.getByText(': caused by all of the events below')).toBeInTheDocument();
  });

  it('says where the investigation stands on each event', () => {
    render(<FaultTree label="Fault tree" root={TREE} />);
    expect(screen.getAllByText('Confirmed')).toHaveLength(2);
    expect(screen.getByText('Ruled out')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});
