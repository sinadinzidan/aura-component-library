import { fireEvent, render, screen } from '@testing-library/react';

import { BatchLane, type LaneRow } from './BatchLane';

const ROWS: LaneRow[] = [
  {
    id: 'r1',
    name: 'Reactor 1',
    tag: '62-RA-6201',
    bookings: [
      { id: 'b116', label: 'B-116', from: 0, to: 4, state: 'done' },
      { id: 'b118', label: 'B-118', from: 6, to: 10, state: 'running' },
      { id: 'b119', label: 'B-119', from: 12, to: 16, state: 'planned' },
    ],
  },
];

const TICKS = ['08:00', '14:00', '20:00', '02:00'];

describe(BatchLane.name, () => {
  it('draws one bar per booking with its state as a word', () => {
    const { container } = render(<BatchLane label="Vessel allocation" rows={ROWS} hours={18} ticks={TICKS} nowAt={6} />);

    const lane = screen.getByRole('group', { name: 'Vessel allocation' });
    expect(lane).toHaveTextContent('Reactor 1');
    expect(lane).toHaveTextContent('62-RA-6201');
    expect(container.querySelectorAll('[data-state]')).toHaveLength(3);
    expect(container.querySelector('[data-state="planned"]')).toHaveTextContent('Planned');
    expect(container.querySelector('[data-now]')).toBeInTheDocument();
  });

  it('reports the selected booking', () => {
    const onSelect = vi.fn();
    render(<BatchLane label="Vessel allocation" rows={ROWS} hours={18} ticks={TICKS} selectedId="b118" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /B-118/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /B-119/ }));

    expect(onSelect).toHaveBeenCalledWith('b119');
  });
});
