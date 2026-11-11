import { render, screen } from '@testing-library/react';

import { AlarmLanes, type AlarmLane } from './AlarmLanes';

const LANES: AlarmLane[] = [
  {
    id: 'a',
    label: 'Discharge temperature high',
    tag: '23-TT-92532',
    total: '2 times',
    spans: [
      { from: 0.25, to: 0.5, tone: 'warning', label: 'First' },
      { from: 0.9, to: 1.4, tone: 'warning', kind: 'acknowledged', label: 'Second' },
    ],
  },
  { id: 'b', label: 'Signal lost', tag: '40-TT-40015', total: '9 h', spans: [{ from: 0.6, to: 1, tone: 'info', kind: 'shelved', label: 'Shelved' }] },
];

describe(AlarmLanes.name, () => {
  it('is one named image with a lane per alarm and its total', () => {
    render(<AlarmLanes label="Standing time" lanes={LANES} ticks={['14:00', '02:00', '14:00']} />);

    const chart = screen.getByRole('img', { name: 'Standing time' });
    expect(chart).toHaveTextContent('Discharge temperature high');
    expect(chart).toHaveTextContent('23-TT-92532');
    expect(chart).toHaveTextContent('2 times');
    expect(chart).toHaveTextContent('Signal lost');
  });

  it('places spans by their share of the window and clamps them to it', () => {
    render(<AlarmLanes label="Standing time" lanes={LANES} ticks={['14:00', '14:00']} />);

    const first = screen.getByTitle('First');
    expect(first.style.left).toBe('25%');
    expect(first.style.width).toBe('25%');
    const second = screen.getByTitle('Second');
    expect(second.style.left).toBe('90%');
    expect(parseFloat(second.style.width)).toBeCloseTo(10);
  });

  it('marks the kind and tone of a span', () => {
    render(<AlarmLanes label="Standing time" lanes={LANES} ticks={[]} />);

    expect(screen.getByTitle('Shelved')).toHaveAttribute('data-kind', 'shelved');
    expect(screen.getByTitle('Shelved')).toHaveAttribute('data-tone', 'info');
    expect(screen.getByTitle('First')).toHaveAttribute('data-kind', 'standing');
  });

  it('shows the ticks and the totals header, repeated ticks included', () => {
    render(<AlarmLanes label="Standing time" lanes={LANES} ticks={['14:00', '02:00', '14:00']} totalHeader="Total" />);

    expect(screen.getAllByText('14:00')).toHaveLength(2);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });
});
