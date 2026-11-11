import { render, screen } from '@testing-library/react';

import { StepSequence, type SequenceStep } from './StepSequence';

const STEPS: SequenceStep[] = [
  { id: 'reset', label: 'Reset vibration trip', detail: 'Ingrid Haugen', time: '13:54', state: 'done' },
  { id: 'seal', label: 'Pressurise seal gas', detail: 'Waiting for 0.5 bar', state: 'held' },
  { id: 'crank', label: 'Crank to idle', state: 'pending' },
];

describe(StepSequence.name, () => {
  it('lists the steps in order and marks the one in hand', () => {
    render(<StepSequence label="Recompressor restart" steps={STEPS} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).toHaveAttribute('data-state', 'held');
  });

  it('numbers steps that have not been done', () => {
    render(<StepSequence label="Recompressor restart" steps={STEPS} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('13:54')).toBeInTheDocument();
  });

  it('lays out as a rail', () => {
    render(<StepSequence label="Parcel" steps={STEPS} orientation="horizontal" />);

    expect(screen.getByRole('list', { name: 'Parcel' })).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });
});
