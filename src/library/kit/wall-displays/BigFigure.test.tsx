import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { BigFigure } from './BigFigure';

describe(BigFigure.name, () => {
  it('shows the figure, its unit, the state word and the reference', () => {
    render(<BigFigure label="Gas export" value={4.38} decimals={2} unit="MSm³/d" state="Behind plan" tone="warning" reference="Plan 4.50" progress={0.97} />);

    expect(screen.getByRole('group', { name: 'Gas export' })).toHaveTextContent('4.38');
    expect(screen.getByText('Behind plan')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Gas export progress' })).toHaveAttribute('aria-valuenow', '97');
  });

  it('shows a dash and no unit when the signal is lost', () => {
    render(<BigFigure label="Flaring" value={null} unit="kSm³/d" state="No data" />);

    expect(screen.getByRole('group', { name: 'Flaring' })).toHaveTextContent('—');
    expect(screen.queryByText('kSm³/d')).not.toBeInTheDocument();
  });

  it('fills the tile with its state in the signal look', () => {
    render(
      <LookScope look="signal">
        <BigFigure label="Alarms" value={4} state="Critical" tone="critical" />
      </LookScope>
    );

    expect(screen.getByRole('group', { name: 'Alarms' })).toHaveAttribute('data-filled', 'true');
  });
});
