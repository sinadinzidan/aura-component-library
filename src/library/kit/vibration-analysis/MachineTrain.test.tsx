import { fireEvent, render, screen } from '@testing-library/react';

import { MachineTrain } from './MachineTrain';

const MACHINES = [
  { id: 'motor', label: 'Motor', from: 0, to: 0.4 },
  { id: 'pump', label: 'Pump', from: 0.55, to: 1 },
];

const POINTS = [
  { id: 'm-de', label: 'Motor DE', at: 0.35, value: 1.8, tone: 'success', state: 'Good' },
  { id: 'p-de', label: 'Pump DE', at: 0.6, value: 5.2, tone: 'warning', state: 'Alert' },
] as const;

describe(MachineTrain.name, () => {
  it('shows a reading at every bearing and the machines on the shaft', () => {
    render(<MachineTrain label="Export pump A" machines={MACHINES} points={POINTS} />);

    expect(screen.getByRole('group', { name: 'Export pump A' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pump DE: 5.2 mm/s, Alert' })).toBeInTheDocument();
    expect(screen.getByText('Motor')).toBeInTheDocument();
  });

  it('reports the picked point', () => {
    const onSelect = vi.fn();
    render(<MachineTrain label="Train" machines={MACHINES} points={POINTS} selected="m-de" onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Pump DE/ }));

    expect(onSelect).toHaveBeenCalledWith('p-de');
    expect(screen.getByRole('button', { name: /Motor DE/ })).toHaveAttribute('aria-pressed', 'true');
  });
});
