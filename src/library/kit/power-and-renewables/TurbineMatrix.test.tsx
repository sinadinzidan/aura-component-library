import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TurbineMatrix, type MatrixTurbine } from './TurbineMatrix';

const TURBINES: MatrixTurbine[] = [
  { name: 'WTG-01', state: 'generating', power: 3.4 },
  { name: 'WTG-03', state: 'maintenance', power: null },
  { name: 'WTG-11', state: 'fault', power: 0 },
];

describe(TurbineMatrix.name, () => {
  it('draws one cell per turbine with its state in a word', () => {
    render(<TurbineMatrix label="Wind farm" turbines={TURBINES} ratedPower={4.2} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Fault')).toBeInTheDocument();
  });

  it('selects a turbine', async () => {
    const onSelect = vi.fn();
    render(<TurbineMatrix label="Wind farm" turbines={TURBINES} ratedPower={4.2} selected="WTG-01" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'WTG-11, fault' }));

    expect(onSelect).toHaveBeenCalledWith('WTG-11');
    expect(screen.getByRole('button', { name: 'WTG-01, generating' })).toHaveAttribute('aria-pressed', 'true');
  });
});
