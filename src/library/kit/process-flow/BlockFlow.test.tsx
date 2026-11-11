import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BlockFlow, type FlowBlock, type FlowEdge } from './BlockFlow';

const BLOCKS: FlowBlock[] = [
  { id: 'wells', label: 'Wells', col: 0, row: 0, kind: 'terminal' },
  { id: 'sep', label: 'Separation', detail: '20-VA-1001', col: 1, row: 0, tone: 'success' },
  { id: 'comp', label: 'Compression', detail: '23-KA-9101', col: 2, row: 0, tone: 'warning' },
];

const EDGES: FlowEdge[] = [
  { id: 'e1', from: 'wells', to: 'sep', label: 'S-101' },
  { id: 'e2', from: 'sep', to: 'comp', label: 'S-201' },
  { id: 'e3', from: 'comp', to: 'sep', kind: 'stopped' },
  { id: 'e4', from: 'comp', to: 'missing' },
];

describe(BlockFlow.name, () => {
  it('draws the blocks and the lines between blocks that exist', () => {
    const { container } = render(<BlockFlow label="Gas train" blocks={BLOCKS} edges={EDGES} />);

    expect(screen.getByRole('group', { name: 'Gas train' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-block]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-edge]')).toHaveLength(3);
    expect(screen.getByText('S-201')).toBeInTheDocument();
  });

  it('leaves the arrow head off a stopped line', () => {
    const { container } = render(<BlockFlow label="Gas train" blocks={BLOCKS} edges={EDGES} />);

    expect(container.querySelectorAll('[data-edge="e3"] path')).toHaveLength(1);
    expect(container.querySelectorAll('[data-edge="e1"] path')).toHaveLength(2);
  });

  it('selects a block with the pointer and the keyboard', async () => {
    const onSelect = vi.fn();
    render(<BlockFlow label="Gas train" blocks={BLOCKS} edges={EDGES} selectedId="sep" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Compression, 23-KA-9101' }));
    screen.getByRole('button', { name: 'Wells' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenNthCalledWith(1, 'comp');
    expect(onSelect).toHaveBeenNthCalledWith(2, 'wells');
    expect(screen.getByRole('button', { name: 'Separation, 20-VA-1001' })).toHaveAttribute('aria-pressed', 'true');
  });
});
