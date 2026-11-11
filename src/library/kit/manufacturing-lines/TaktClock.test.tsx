import { render, screen } from '@testing-library/react';

import { TaktClock } from './TaktClock';

describe(TaktClock.name, () => {
  it('shows the count, the target and how far behind pace the line is', () => {
    render(<TaktClock label="Actuators, day shift" count={342} target={600} elapsedShare={0.6} remaining="3 h 10 min left" rate="71 an hour, need 81" />);

    const group = screen.getByRole('group', { name: 'Actuators, day shift' });
    expect(group).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByText('342')).toBeInTheDocument();
    expect(screen.getByText('of 600')).toBeInTheDocument();
    expect(screen.getByText('18 behind pace')).toBeInTheDocument();
    expect(screen.getByText('Should be 360')).toBeInTheDocument();
    expect(screen.getByText('3 h 10 min left')).toBeInTheDocument();
    expect(screen.getByText('71 an hour, need 81')).toBeInTheDocument();
  });

  it('describes the meter in words', () => {
    render(<TaktClock label="Actuators" count={380} target={600} elapsedShare={0.6} remaining="3 h left" />);

    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '380 of 600, 20 ahead of pace');
    expect(screen.getByRole('group', { name: 'Actuators' })).toHaveAttribute('data-tone', 'success');
  });

  it('turns critical when far behind', () => {
    render(<TaktClock label="Actuators" count={250} target={600} elapsedShare={0.6} remaining="3 h left" />);

    expect(screen.getByRole('group', { name: 'Actuators' })).toHaveAttribute('data-tone', 'critical');
  });
});
