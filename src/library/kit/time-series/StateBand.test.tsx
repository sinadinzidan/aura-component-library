import { render, screen } from '@testing-library/react';

import { StateBand } from './StateBand';

describe(StateBand.name, () => {
  it('sizes each block by its share of the time axis and names the states', () => {
    const { container } = render(
      <StateBand
        label="Run state"
        caption="State"
        count={25}
        segments={[
          { from: 0, to: 18, label: 'Running', tone: 'success' },
          { from: 18, to: 20, label: 'Tripped', tone: 'critical' },
          { from: 20, to: 24, label: 'Running', tone: 'success' },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: 'Run state: Running, Tripped, Running' })).toBeInTheDocument();
    const blocks = container.querySelectorAll('[data-part="segment"]');
    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toHaveStyle({ width: '75%' });
    expect(blocks[1]).toHaveAttribute('data-tone', 'critical');
    expect(blocks[1]).toHaveTextContent('');
    expect(screen.getByText('State')).toBeInTheDocument();
  });
});
