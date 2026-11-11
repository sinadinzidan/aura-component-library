import { render, screen, within } from '@testing-library/react';

import { TrainLanes, type TrainLane } from './TrainLanes';

const LANES: TrainLane[] = [
  { id: 'a', name: 'Train A', state: 'Running', tone: 'success', share: 100, stages: [{ id: 'a1', name: 'Suction', state: 'Open', tone: 'neutral' }, { id: 'a2', name: 'Export pump A', state: 'Running', tone: 'success', value: 21.4, decimals: 1, unit: 'barg' }] },
  { id: 'b', name: 'Train B', state: 'Standby', tone: 'info', share: 0, stages: [{ id: 'b1', name: 'Suction', state: 'Closed', tone: 'neutral' }, { id: 'b2', name: 'Export pump B', state: 'Standby', tone: 'info', value: null, unit: 'barg' }] },
];

describe(TrainLanes.name, () => {
  it('draws one lane per train with its share of the duty', () => {
    const { container } = render(<TrainLanes label="Export pumps" lanes={LANES} />);

    expect(container.querySelectorAll('[data-lane]')).toHaveLength(2);
    expect(screen.getByText('100 % of duty')).toBeInTheDocument();
    expect(screen.getByText('0 % of duty')).toBeInTheDocument();
  });

  it('puts the stages of a train in its lane', () => {
    render(<TrainLanes label="Export pumps" lanes={LANES} />);

    const lane = screen.getByRole('list', { name: 'Train B stages' });
    expect(within(lane).getByText('Export pump B')).toBeInTheDocument();
    expect(within(lane).getByText('—')).toBeInTheDocument();
  });
});
