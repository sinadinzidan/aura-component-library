import { fireEvent, render, screen } from '@testing-library/react';

import { SymbolTrain, type TrainNode } from './SymbolTrain';

const NODES: readonly TrainNode[] = [
  { id: 'sep', kind: 'horizontal-separator', tag: '20-VA-1001', name: 'Inlet separator', outLabel: '13.1 barg' },
  { id: 'comp', kind: 'compressor', tag: '23-KA-9101', name: '1st stage compressor', tone: 'warning', state: 'Watch', value: '6.8 mm/s' },
  { id: 'valve', kind: 'shutdown-valve', tag: '27-XV-2005', name: 'Export valve', blocked: true },
];

describe(SymbolTrain.name, () => {
  it('names the train and every machine with its state', () => {
    render(<SymbolTrain label="Gas compression train" nodes={NODES} />);

    expect(screen.getByRole('group', { name: 'Gas compression train' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1st stage compressor, 23-KA-9101, Watch' })).toBeInTheDocument();
    expect(screen.getByText('6.8 mm/s')).toBeInTheDocument();
  });

  it('joins neighbours with a pipe that carries the stream condition', () => {
    const { container } = render(<SymbolTrain label="Train" nodes={NODES} />);

    expect(container.querySelectorAll('[data-part="pipe"]')).toHaveLength(2);
    expect(screen.getByText('13.1 barg')).toBeInTheDocument();
  });

  it('reports the selected machine', () => {
    const onSelect = vi.fn();
    render(<SymbolTrain label="Train" nodes={NODES} selectedId="comp" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /1st stage compressor/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Inlet separator/ }));
    expect(onSelect).toHaveBeenCalledWith('sep');
  });
});
