import { render, screen } from '@testing-library/react';

import { StateTally } from './StateTally';
import { RUN_STATES, tally } from './status';

const ENTRIES = tally([RUN_STATES.running, RUN_STATES.running, RUN_STATES.running, RUN_STATES.tripped]);

describe(StateTally.name, () => {
  it('draws shares in proportion and writes the counts', () => {
    const { container } = render(<StateTally label="Equipment by run state" entries={ENTRIES} noun="assets" />);

    expect(screen.getByRole('img', { name: 'Equipment by run state: 1 tripped, 3 running' })).toBeInTheDocument();
    const shares = container.querySelectorAll('[data-part="share"]');
    expect(shares).toHaveLength(2);
    expect(shares[1]).toHaveStyle({ flexGrow: '3' });
    expect(screen.getByText('4 assets')).toBeInTheDocument();
  });

  it('lays out as chips and as a list', () => {
    const { rerender } = render(<StateTally label="Run state" entries={ENTRIES} layout="chips" />);
    expect(screen.getByRole('list', { name: 'Run state' })).toHaveAttribute('data-layout', 'chips');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    rerender(<StateTally label="Run state" entries={ENTRIES} layout="list" />);
    expect(screen.getByRole('list', { name: 'Run state' })).toHaveAttribute('data-layout', 'list');
    expect(screen.getByText('Tripped')).toBeInTheDocument();
  });
});
