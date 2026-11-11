import { render, screen } from '@testing-library/react';

import { StationCard } from './StationCard';

describe(StationCard.name, () => {
  it('shows state, cycle against takt, count and yield', () => {
    render(<StationCard station={{ id: 's1', code: 'S1', name: 'Housing load', state: 'running', cycleSeconds: 44 }} taktSeconds={48} count={312} yieldPercent={98.4} />);

    expect(screen.getByRole('heading', { name: 'Housing load' })).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('Under takt')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Cycle time, Housing load' })).toHaveAttribute('aria-valuetext', '44 seconds against a takt of 48 seconds');
    expect(screen.getByText('Takt 48 s')).toBeInTheDocument();
    expect(screen.getByText('312')).toBeInTheDocument();
    expect(screen.getByText('98.4 %')).toBeInTheDocument();
  });

  it('says when a station is over takt', () => {
    render(<StationCard station={{ id: 's3', code: 'S3', name: 'Gear assembly', state: 'running', cycleSeconds: 52 }} taktSeconds={48} count={280} yieldPercent={96} />);

    expect(screen.getByText('Over takt')).toBeInTheDocument();
  });

  it('gives the reason and an action for a station that is down', () => {
    render(
      <StationCard
        station={{ id: 's5', code: 'S5', name: 'Torque and seal', state: 'down', reason: 'Torque tool fault E-217', since: '12 min' }}
        taktSeconds={48}
        count={266}
        yieldPercent={97.1}
        action={<button type="button">Call maintenance</button>}
      />,
    );

    expect(screen.getByText('Not cycling')).toBeInTheDocument();
    expect(screen.getByText('Torque tool fault E-217 · 12 min')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Call maintenance' })).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Not cycling');
  });
});
