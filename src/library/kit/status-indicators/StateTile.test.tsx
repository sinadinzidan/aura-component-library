import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { StateTile } from './StateTile';
import { RUN_STATES } from './status';

describe(StateTile.name, () => {
  it('names the thing and its state and is tinted in studio', () => {
    render(<StateTile title="Recompressor" subtitle="23-KA-9103" state={RUN_STATES.tripped} detail="High vibration, 14 min ago" />);

    const tile = screen.getByRole('group', { name: 'Recompressor: Tripped' });
    expect(tile).toHaveAttribute('data-anatomy', 'soft');
    expect(tile).toHaveAttribute('data-tone', 'critical');
    expect(screen.getByText('23-KA-9103')).toBeInTheDocument();
    expect(screen.getByText('High vibration, 14 min ago')).toBeInTheDocument();
  });

  it('takes the anatomy of the look and accepts an override', () => {
    render(
      <LookScope look="signal">
        <StateTile title="Export pump A" state={RUN_STATES.running} />
        <StateTile title="Export pump B" state={RUN_STATES.standby} anatomy="outline" size="lg" />
      </LookScope>,
    );

    expect(screen.getByRole('group', { name: 'Export pump A: Running' })).toHaveAttribute('data-anatomy', 'solid');
    expect(screen.getByRole('group', { name: 'Export pump B: Standby' })).toHaveAttribute('data-anatomy', 'outline');
  });
});
