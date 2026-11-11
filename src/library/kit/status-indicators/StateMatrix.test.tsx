import { fireEvent, render, screen } from '@testing-library/react';

import { StateMatrix, type MatrixCell } from './StateMatrix';
import { RUN_STATES } from './status';

const CELLS: MatrixCell[] = [
  { id: 'a', label: '9101', name: '1st stage compressor', state: RUN_STATES.running },
  { id: 'b', label: '9103', name: 'Recompressor', state: RUN_STATES.tripped },
];

describe(StateMatrix.name, () => {
  it('names every cell with its state', () => {
    render(<StateMatrix label="Equipment state" cells={CELLS} columns={2} />);

    expect(screen.getByRole('list', { name: 'Equipment state' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Recompressor: Tripped' })).toBeInTheDocument();
    expect(screen.getByText('9101')).toBeInTheDocument();
  });

  it('selects a cell and hides labels when compact', () => {
    const onSelect = vi.fn();
    render(<StateMatrix label="Equipment state" cells={CELLS} selected="b" onSelect={onSelect} density="compact" />);

    expect(screen.getByRole('button', { name: 'Recompressor: Tripped' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('9101')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '1st stage compressor: Running' }));
    expect(onSelect).toHaveBeenCalledWith('a');
  });
});
